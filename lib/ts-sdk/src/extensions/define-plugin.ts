/**
 * `definePlugin()` — bundles schema extensions, route declarations, and client
 * defaults into a `Plugin<TSchemas, TRoutes>` object with a typed
 * `getClient(config)` factory.
 *
 * `definePlugin` is the single author surface for transforms. For each
 * `schemas[Name]` entry it:
 *   - Builds `commonSchema` once from `customFields` via `withCustomFields()`
 *     (the single source of truth; base schema when no custom fields).
 *   - Obtains raw transform functions: compiling declarative `mappings` via the
 *     `@internal buildTransforms`, or using hand-written `toCommon` /
 *     `fromCommon` directly (mappings XOR functions, enforced at compile time).
 *   - Wraps BOTH directions in one `safeParse` validator so they behave
 *     identically: `toCommon` output validated against the extended
 *     `commonSchema`, `fromCommon` output against `sourceSchema`, with failures
 *     merged into `TransformResult.errors`.
 *
 * The plugin's `getClient` is built by `buildGetClient()` so each resource
 * method is automatically wired to the typed schema and filters.
 */

import { z } from "zod";
import type { ClientConfig } from "../client/config";
import { buildGetClient, type BuiltClient } from "./build-get-client";
import { buildTransforms } from "./build-transforms";
import {
  EXTENSIBLE_SCHEMA_MAP,
  type CustomFieldSpec,
  type ExtensibleSchemaName,
  type HasCustomFields,
  type PluginRoutes,
  type SchemaExtensions,
  type SchemaInput,
  type SchemaMappings,
} from "./plugin-types";
import { TransformError, type TransformResult } from "./transform-types";
import { withCustomFields, type WithCustomFieldsResult } from "./with-custom-fields";

// ############################################################################
// Public types
// ############################################################################

/** Required metadata describing a plugin. */
export interface PluginMeta {
  /** Plugin identifier (e.g. "grants-gov-adapter") */
  name: string;
  /** Semantic version */
  version: string;
  /** Optional source-system identifier (e.g. "grants.gov") */
  sourceSystem?: string;
}

/**
 * A resolved entry with transforms. Both directions are non-optional and
 * two-sided typed: `toCommon` returns the common type, `fromCommon` the source
 * type. Output of `definePlugin` for any entry that declared `mappings` or
 * hand-written functions.
 */
export interface SchemaWithTransforms<TCommon extends z.ZodTypeAny, TSource extends z.ZodTypeAny> {
  /** The (possibly extended) common-schema for this model */
  commonSchema: TCommon;
  /** The source-system schema */
  sourceSchema: TSource;
  /** Custom fields declared on the entry, if any */
  customFields?: Record<string, CustomFieldSpec>;
  /** Declarative mappings, when the entry used the mappings path */
  mappings?: SchemaMappings;
  /** Transform a source record into common-schema shape (validated against `commonSchema`) */
  toCommon: (source: z.infer<TSource>) => TransformResult<z.infer<TCommon>>;
  /** Transform a common-schema record back to the source shape (validated against `sourceSchema`) */
  fromCommon: (common: z.infer<TCommon>) => TransformResult<z.infer<TSource>>;
}

/** A resolved entry with custom fields only — no transforms. */
export interface SchemaOnly<TCommon extends z.ZodTypeAny> {
  /** The (possibly extended) common-schema for this model */
  commonSchema: TCommon;
  /** Custom fields declared on the entry, if any */
  customFields?: Record<string, CustomFieldSpec>;
}

/** Resolve the common schema for entry `E` against base schema `Base`. */
type CommonSchemaFor<Base extends HasCustomFields, E> = E extends {
  customFields: infer CF;
}
  ? CF extends Record<string, CustomFieldSpec>
    ? WithCustomFieldsResult<Base, CF>
    : Base
  : Base;

/**
 * Resolve a single input entry to its consumer-facing shape. An entry with a
 * `sourceSchema` carries transforms (`SchemaWithTransforms`); otherwise it is
 * `SchemaOnly`.
 */
type ResolveSchemaEntry<E, Base extends HasCustomFields> = E extends {
  sourceSchema: infer TSource;
}
  ? TSource extends z.ZodTypeAny
    ? SchemaWithTransforms<CommonSchemaFor<Base, E>, TSource>
    : SchemaOnly<CommonSchemaFor<Base, E>>
  : SchemaOnly<CommonSchemaFor<Base, E>>;

/**
 * Resolves each input entry to a typed `SchemaWithTransforms` or `SchemaOnly`,
 * picking the right base + common schema per model.
 */
export type ResolvedPluginSchemas<TSchemas extends SchemaExtensions> = {
  [K in ExtensibleSchemaName]: K extends keyof TSchemas
    ? ResolveSchemaEntry<NonNullable<TSchemas[K]>, (typeof EXTENSIBLE_SCHEMA_MAP)[K]>
    : SchemaOnly<(typeof EXTENSIBLE_SCHEMA_MAP)[K]>;
};

/** Options accepted by `definePlugin()`. */
export interface DefinePluginOptions<
  TSchemas extends SchemaExtensions,
  TRoutes extends PluginRoutes,
> {
  meta: PluginMeta;
  /** Per-model extension declarations */
  schemas?: TSchemas;
  /** Per-resource route declarations (currently only `search.filters`) */
  routes?: TRoutes;
  /** Default client-config overrides applied when `getClient()` is called */
  client?: Partial<ClientConfig>;
}

/** A configured plugin. */
export interface Plugin<TSchemas extends SchemaExtensions, TRoutes extends PluginRoutes> {
  meta: PluginMeta;
  schemas: ResolvedPluginSchemas<TSchemas>;
  routes: TRoutes;
  /** Constructs a `Client` with the plugin's typed resources attached. */
  getClient: (config: ClientConfig) => BuiltClient<TRoutes, TSchemas>;
}

// ############################################################################
// Public function - definePlugin()
// ############################################################################

export function definePlugin<
  const TSchemas extends SchemaExtensions,
  const TRoutes extends PluginRoutes,
>(options: DefinePluginOptions<TSchemas, TRoutes>): Plugin<TSchemas, TRoutes> {
  const { meta, schemas: schemaInputs, routes, client: clientDefaults } = options;

  const resolvedSchemas = resolveSchemas(schemaInputs ?? {});
  const resolvedRoutes = (routes ?? {}) as TRoutes;

  // The factory is typed with the caller's narrow `TSchemas` / `TRoutes` for
  // the user-facing surface, but internally we hand `buildGetClient` the
  // resolved (already-erased) schemas. TS can't bridge the two narrowings on
  // its own, so we cast at this single boundary.
  const getClient = buildGetClient<TSchemas, TRoutes>({
    schemas: resolvedSchemas as unknown as ResolvedPluginSchemas<TSchemas>,
    routes: resolvedRoutes,
    defaults: clientDefaults,
  });

  return {
    meta,
    schemas: resolvedSchemas as unknown as Plugin<TSchemas, TRoutes>["schemas"],
    routes: resolvedRoutes,
    getClient,
  };
}

// ############################################################################
// Internal helpers
// ############################################################################

/** A raw transform callable before output validation is layered on. */
type RawTransform = (input: unknown) => TransformResult<unknown>;

/** A resolved entry, runtime-erased (loose typing for the internal store). */
type ResolvedEntry = SchemaOnly<z.ZodTypeAny> | SchemaWithTransforms<z.ZodTypeAny, z.ZodTypeAny>;

function resolveSchemas(inputs: SchemaExtensions): ResolvedPluginSchemas<SchemaExtensions> {
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
    //    sound (it comes from `safeParse(...).data`). Validate `toCommon`
    //    against the custom-fields-extended commonSchema (not the base) or
    //    `.parse()` would strip the custom fields.
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
 * existing errors.
 *
 * When the raw transform already reported errors (e.g. a handler threw, leaving
 * a partial `{}` result), validation is skipped so a handler failure surfaces
 * as a single `TransformError` rather than a flood of "required field" Zod
 * issues against the partial result.
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
      // Root-level issues (e.g. from `.refine()`) have an empty path — leave
      // `TransformError.path` undefined so the "if known" contract holds.
      const joined = issue.path.length > 0 ? issue.path.map((p) => String(p)).join(".") : undefined;
      return new TransformError(issue.message, { path: joined });
    });
    // Return the raw transformed value alongside the merged errors so callers
    // can inspect malformed data.
    return { result, errors: zodErrors };
  };
}
