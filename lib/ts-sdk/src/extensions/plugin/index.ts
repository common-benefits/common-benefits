/**
 * The `plugin` concern: `definePlugin()` bundles schema extensions, route
 * declarations, and client defaults into a `Plugin<TSchemas, TRoutes>` with a
 * typed `getClient(config)` factory. Mirrors `py-sdk`'s `extensions/plugin.py`.
 */

import type { ClientConfig } from "../../client/config";
import type { PluginRoutes } from "../routes";
import type { SchemaExtensions } from "../schemas";
import { buildGetClient, resolveSchemas } from "./builder";
import type { BuiltClient, ResolvedPluginSchemas } from "./types";

export { buildGetClient } from "./builder";
export type { ResolvedPluginSchemas, BuiltClient } from "./types";
export type { BuildGetClientOptions } from "./builder";

/** Required metadata describing a plugin. */
export interface PluginMeta {
  /** Plugin identifier (e.g. "grants-gov-adapter"). */
  name: string;
  /** Semantic version. */
  version: string;
  /** Optional source-system identifier (e.g. "grants.gov"). */
  sourceSystem?: string;
}

/** Options accepted by `definePlugin()`. */
export interface DefinePluginOptions<
  TSchemas extends SchemaExtensions,
  TRoutes extends PluginRoutes,
> {
  meta: PluginMeta;
  /** Per-model extension declarations. */
  schemas?: TSchemas;
  /** Per-resource route declarations (currently only `search.filters`). */
  routes?: TRoutes;
  /** Default client-config overrides applied when `getClient()` is called. */
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

/**
 * Bundle schema extensions, route declarations, and client defaults into a
 * typed plugin. For each `schemas[Name]` entry, `commonSchema` is built once
 * from `customFields`, transforms are obtained (mappings XOR hand-written), and
 * both directions are wrapped in one validation step.
 */
export function definePlugin<
  const TSchemas extends SchemaExtensions,
  const TRoutes extends PluginRoutes,
>(options: DefinePluginOptions<TSchemas, TRoutes>): Plugin<TSchemas, TRoutes> {
  const { meta, schemas: schemaInputs, routes, client: clientDefaults } = options;

  const resolvedSchemas = resolveSchemas(schemaInputs ?? {});
  const resolvedRoutes = (routes ?? {}) as TRoutes;

  // The factory is typed with the caller's narrow `TSchemas` / `TRoutes`, but
  // internally we hand `buildGetClient` the resolved (already-erased) schemas.
  // TS can't bridge the two narrowings, so we cast at this single boundary.
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
