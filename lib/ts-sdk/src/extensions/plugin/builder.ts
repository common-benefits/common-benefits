/**
 * Runtime construction for the `plugin` concern.
 *
 * `resolveSchemas` turns each schema input into a resolved entry (building
 * `commonSchema` once via `withCustomFields`, obtaining raw transforms, and
 * wrapping both directions in one validation step). `buildGetClient` returns the
 * `getClient(config)` factory: it loops over `RESOURCE_REGISTRY` and builds every
 * registered resource, wiring each method's item schema and the resource's
 * default + registered custom filters. This is the TS analog of Python's
 * `Plugin.get_client` method (a factory-produced closure rather than a method
 * reading `self`).
 */

import { z } from "zod";
import { Client } from "../../client/client";
import type { ClientConfig } from "../../client/config";
import type { ResourceConstructor, ResourceMethod } from "../../client/resources/base";
import { DEFAULT_FILTERS_MAP, RESOURCE_REGISTRY } from "../../client/resources/registry";
import { withCustomFilters } from "../routes";
import type { PluginRoutes } from "../routes";
import { EXTENSIBLE_SCHEMA_MAP, type ExtensibleSchemaName } from "../registry";
import {
  withCustomFields,
  type SchemaExtensions,
  type SchemaInput,
  type SchemaOnly,
  type SchemaWithTransforms,
} from "../schemas";
import { TransformError, type TransformResult } from "../transforms";
import { buildTransforms } from "../transforms/builder";
import type { BuiltClient, ResolvedPluginSchemas } from "./types";

// ############################################################################
// Schema resolution (commonSchema build + transform validation wrapping)
// ############################################################################

/** A raw transform callable before output validation is layered on. */
type RawTransform = (input: unknown) => TransformResult<unknown>;

/** A resolved entry, runtime-erased (loose typing for the internal store). */
type ResolvedEntry = SchemaOnly<z.ZodTypeAny> | SchemaWithTransforms<z.ZodTypeAny, z.ZodTypeAny>;

export function resolveSchemas(inputs: SchemaExtensions): ResolvedPluginSchemas<SchemaExtensions> {
  const out: Record<string, ResolvedEntry> = {};

  for (const [name, baseSchema] of Object.entries(EXTENSIBLE_SCHEMA_MAP) as [
    ExtensibleSchemaName,
    (typeof EXTENSIBLE_SCHEMA_MAP)[ExtensibleSchemaName],
  ][]) {
    const entry: SchemaInput | undefined = inputs[name];

    // 1. Build commonSchema once from customFields (single source of truth).
    const commonSchema =
      entry?.customFields && Object.keys(entry.customFields).length > 0
        ? withCustomFields(baseSchema, entry.customFields)
        : baseSchema;

    // 2. No sourceSchema => schema-only entry, no transforms.
    if (!entry || !entry.sourceSchema) {
      out[name] = { commonSchema, customFields: entry?.customFields };
      continue;
    }

    const sourceSchema = entry.sourceSchema;

    // 3. Obtain raw transform functions (mappings XOR hand-written functions).
    let rawToCommon: RawTransform;
    let rawFromCommon: RawTransform;
    if (entry.mappings) {
      const built = buildTransforms({
        mappings: entry.mappings,
        handlers: entry.handlers,
        sourceSchema,
        commonSchema,
      });
      rawToCommon = built.toCommon;
      rawFromCommon = built.fromCommon;
    } else {
      rawToCommon = entry.toCommon as RawTransform;
      rawFromCommon = entry.fromCommon as RawTransform;
    }

    // 4. Wrap both directions with one safeParse validator so the mapping and
    //    hand-written paths behave identically and the consumer output type is
    //    sound. Validate `toCommon` against the custom-fields-extended
    //    commonSchema (not the base) or `.parse()` would strip the custom fields.
    out[name] = {
      commonSchema,
      sourceSchema,
      customFields: entry.customFields,
      mappings: entry.mappings,
      toCommon: wrapWithValidation(rawToCommon, commonSchema),
      fromCommon: wrapWithValidation(rawFromCommon, sourceSchema),
    };
  }

  return out as ResolvedPluginSchemas<SchemaExtensions>;
}

/**
 * Wrap a raw transform with a `safeParse` step against `outputSchema`. Zod
 * issues are flattened to dot-path `TransformError`s and merged into the
 * existing errors. When the raw transform already reported errors, validation is
 * skipped so a handler failure surfaces as a single error rather than a flood of
 * "required field" Zod issues.
 */
function wrapWithValidation(
  rawFn: RawTransform,
  outputSchema: z.ZodTypeAny
): (input: unknown) => TransformResult<unknown> {
  return (input: unknown): TransformResult<unknown> => {
    const { result, errors } = rawFn(input);
    if (errors.length > 0) {
      return { result, errors };
    }
    const parsed = outputSchema.safeParse(result);
    if (parsed.success) {
      return { result: parsed.data, errors };
    }
    const zodErrors = parsed.error.issues.map((issue) => {
      const joined = issue.path.length > 0 ? issue.path.map((p) => String(p)).join(".") : undefined;
      return new TransformError(issue.message, { path: joined });
    });
    return { result, errors: zodErrors };
  };
}

// ############################################################################
// buildGetClient
// ############################################################################

export interface BuildGetClientOptions<
  TSchemas extends SchemaExtensions,
  TRoutes extends PluginRoutes,
> {
  /** Resolved plugin schemas (output of `resolveSchemas`). */
  schemas: ResolvedPluginSchemas<TSchemas>;
  /** Per-resource route declarations. */
  routes: TRoutes;
  /** Default client-config overrides applied on top of the caller's config. */
  defaults?: Partial<ClientConfig>;
}

/**
 * Returns a `getClient(config)` factory whose `Client` instance already has the
 * typed resources attached. Construction loops over `RESOURCE_REGISTRY` and
 * builds every registered resource generically; `routes` only supplies the
 * registered custom filters for resources that declared any.
 */
export function buildGetClient<
  const TSchemas extends SchemaExtensions,
  const TRoutes extends PluginRoutes,
>(
  options: BuildGetClientOptions<TSchemas, TRoutes>
): (config: ClientConfig) => BuiltClient<TRoutes, TSchemas> {
  const { schemas, routes, defaults } = options;
  const resolvedSchemas = schemas as unknown as ResolvedPluginSchemas<SchemaExtensions>;

  return (config: ClientConfig) => {
    const merged: ClientConfig = { ...defaults, ...config };
    const client = new Client(merged);

    const resourceMap: Record<string, unknown> = {};

    for (const [resourceName, entry] of Object.entries(RESOURCE_REGISTRY)) {
      const routeMethods = (routes ?? {})[resourceName];

      const itemSchemaFor = (method: ResourceMethod): z.ZodTypeAny | undefined => {
        const modelName = entry.schemas[method];
        return modelName ? resolvedSchemas[modelName]?.commonSchema : undefined;
      };

      resourceMap[resourceName] = new (entry.resourceClass as ResourceConstructor)({
        client,
        itemSchemas: {
          get: itemSchemaFor("get"),
          list: itemSchemaFor("list"),
          search: itemSchemaFor("search"),
        },
        defaultFiltersSchema: entry.defaultFilters
          ? DEFAULT_FILTERS_MAP[entry.defaultFilters]
          : undefined,
        customFiltersSchema: extractFiltersSchema(routeMethods),
      });
    }

    return Object.assign(client, resourceMap) as unknown as BuiltClient<TRoutes, TSchemas>;
  };
}

/** Builds the registered custom-filters schema from a route's `search.filters`. */
function extractFiltersSchema(routeMethods: unknown): z.ZodTypeAny | undefined {
  if (!routeMethods || typeof routeMethods !== "object") return undefined;
  const search = (routeMethods as { search?: { filters?: Record<string, unknown> } }).search;
  if (!search?.filters || Object.keys(search.filters).length === 0) return undefined;
  return withCustomFilters(
    search.filters as Parameters<typeof withCustomFilters>[0]
  ) as z.ZodTypeAny;
}
