/**
 * `definePlugin()` — bundles schema extensions, route declarations, and
 * client defaults into a `Plugin<TSchemas, TRoutes>` object with a typed
 * `getClient(config)` factory.
 *
 * For each `schemas[Name]` entry the plugin:
 *   - Runs `withCustomFields()` against the base schema if `customFields` are
 *     declared, producing a typed `commonSchema`.
 *   - Passes `sourceSchema` / `toCommon` / `fromCommon` through untouched. The
 *     SDK does NOT auto-invoke them; consumers can read them off
 *     `plugin.schemas[Name]` and run them at their own integration boundary.
 *
 * The plugin's `getClient` is built by `buildGetClient()` so each resource
 * method is automatically wired to the typed schema and filters.
 */

import { z } from "zod";
import type { ClientConfig } from "../client/config";
import { buildGetClient, type BuiltClient } from "./build-get-client";
import {
  EXTENSIBLE_SCHEMA_MAP,
  type CustomFieldSpec,
  type ExtensibleSchemaName,
  type PluginRoutes,
  type PluginSchemaEntry,
  type SchemaExtensions,
} from "./plugin-types";
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

/** Per-entry shape produced by `definePlugin` after resolving customFields. */
export interface ResolvedPluginSchemaEntry<
  TCommon extends z.ZodTypeAny,
  TSource extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** The (possibly extended) common-schema for this model */
  commonSchema: TCommon;
  /** Optional source-system schema, passed through unchanged */
  sourceSchema?: TSource;
  /** Map a parsed source record into common-schema shape */
  toCommon?: (source: z.infer<TSource>) => unknown;
  /** Map a parsed common-schema record back to the source shape */
  fromCommon?: (common: unknown) => z.infer<TSource>;
}

/**
 * Resolves each input `PluginSchemaEntry` to a typed
 * `ResolvedPluginSchemaEntry`, picking the appropriate `commonSchema` based on
 * whether `customFields` is present.
 */
export type ResolvedPluginSchemas<TSchemas extends SchemaExtensions> = {
  [K in ExtensibleSchemaName]: K extends keyof TSchemas
    ? TSchemas[K] extends { customFields: infer CF }
      ? CF extends Record<string, CustomFieldSpec>
        ? ResolvedPluginSchemaEntry<
            WithCustomFieldsResult<(typeof EXTENSIBLE_SCHEMA_MAP)[K], CF>,
            NonNullable<TSchemas[K]>["sourceSchema"] extends z.ZodTypeAny
              ? NonNullable<TSchemas[K]>["sourceSchema"] & z.ZodTypeAny
              : z.ZodTypeAny
          >
        : ResolvedPluginSchemaEntry<(typeof EXTENSIBLE_SCHEMA_MAP)[K]>
      : ResolvedPluginSchemaEntry<(typeof EXTENSIBLE_SCHEMA_MAP)[K]>
    : ResolvedPluginSchemaEntry<(typeof EXTENSIBLE_SCHEMA_MAP)[K]>;
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

function resolveSchemas(inputs: SchemaExtensions): ResolvedPluginSchemas<SchemaExtensions> {
  const out: Record<string, ResolvedPluginSchemaEntry<z.ZodTypeAny>> = {};

  for (const [name, baseSchema] of Object.entries(EXTENSIBLE_SCHEMA_MAP) as [
    ExtensibleSchemaName,
    (typeof EXTENSIBLE_SCHEMA_MAP)[ExtensibleSchemaName],
  ][]) {
    const entry: PluginSchemaEntry | undefined = inputs[name];
    const commonSchema =
      entry?.customFields && Object.keys(entry.customFields).length > 0
        ? withCustomFields(baseSchema, entry.customFields)
        : baseSchema;

    out[name] = {
      commonSchema,
      sourceSchema: entry?.sourceSchema,
      toCommon: entry?.toCommon,
      fromCommon: entry?.fromCommon,
    };
  }

  return out as ResolvedPluginSchemas<SchemaExtensions>;
}
