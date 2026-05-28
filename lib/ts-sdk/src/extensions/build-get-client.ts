/**
 * `buildGetClient()` — produces a `getClient(config)` factory whose returned
 * `Client` already has typed resources attached.
 *
 * For each resource in `routes`, the factory:
 *   1. Looks up the matching schema name in `RESOURCE_SCHEMA_MAP`
 *      (e.g. `widgets.search → "Widget"`).
 *   2. If `schemas.Widget.commonSchema` was supplied (extended via
 *      `withCustomFields()`), passes it to the resource as `defaultItemSchema`
 *      so call-site parsing uses the typed schema automatically.
 *   3. Builds a `filtersSchema` via `withCustomFilters()` from each
 *      `routes[resource].search.filters` declaration, and stashes it on the
 *      resource so `search({ filters })` validates input before the request.
 */

import { z } from "zod";
import { Client } from "../client/client";
import type { ClientConfig } from "../client/config";
import { RESOURCE_SCHEMA_MAP } from "../client/resources/registry";
import { Widgets } from "../client/resources/widgets";
import { WidgetBaseSchema } from "../schemas/widget";
import type { ResolvedPluginSchemas } from "./define-plugin";
import type { PluginRoutes, SchemaExtensions } from "./plugin-types";
import { withCustomFilters } from "./with-custom-filters";

// ############################################################################
// Type-level resource derivation
// ############################################################################

type WidgetBase = z.infer<typeof WidgetBaseSchema>;

/** Resolves the typed item type produced by a plugin schema entry. */
type ResolvedItemType<
  TSchemas extends SchemaExtensions,
  TSchemaName extends keyof TSchemas,
  TDefault,
> = TSchemas[TSchemaName] extends { customFields: Record<string, unknown> }
  ? ResolvedPluginSchemas<TSchemas>[TSchemaName & "Widget"] extends {
      commonSchema: infer S;
    }
    ? S extends z.ZodTypeAny
      ? z.infer<S>
      : TDefault
    : TDefault
  : TDefault;

/** Resolves the filters bag type for a route's `search.filters` spec. */
type ResolvedFiltersType<TMethods> = TMethods extends {
  search: { filters: infer F };
}
  ? F extends Record<string, { filterType: string }>
    ? {
        [K in keyof F]?: unknown;
      }
    : Record<string, unknown>
  : Record<string, unknown>;

/**
 * Mapped type producing each typed resource attached to the built client.
 *
 * For each resource key in `TRoutes`, looks up the registered class
 * (`widgets → Widgets`) and parameterizes it with the resolved item type
 * (from `schemas`) and filters type (from `routes`).
 */
export type ClientResources<TRoutes extends PluginRoutes, TSchemas extends SchemaExtensions> = {
  [K in keyof TRoutes & "widgets"]: Widgets<
    ResolvedItemType<TSchemas, "Widget", WidgetBase>,
    ResolvedFiltersType<TRoutes[K]> & Record<string, unknown>
  >;
};

/** Final return type of `getClient(config)`. */
export type BuiltClient<TRoutes extends PluginRoutes, TSchemas extends SchemaExtensions> = Client &
  ClientResources<TRoutes, TSchemas>;

// ############################################################################
// buildGetClient
// ############################################################################

export interface BuildGetClientOptions<
  TSchemas extends SchemaExtensions,
  TRoutes extends PluginRoutes,
> {
  /** Resolved plugin schemas (output of `definePlugin` schema processing) */
  schemas: ResolvedPluginSchemas<TSchemas>;
  /** Per-resource route declarations */
  routes: TRoutes;
  /** Default client-config overrides applied on top of the caller's config */
  defaults?: Partial<ClientConfig>;
}

/**
 * Returns a `getClient(config)` factory whose `Client` instance already has
 * the configured resources attached.
 */
export function buildGetClient<
  const TSchemas extends SchemaExtensions,
  const TRoutes extends PluginRoutes,
>(
  options: BuildGetClientOptions<TSchemas, TRoutes>
): (config: ClientConfig) => BuiltClient<TRoutes, TSchemas> {
  const { schemas, routes, defaults } = options;

  return (config: ClientConfig) => {
    const merged: ClientConfig = { ...defaults, ...config };
    const client = new Client(merged);

    const resourceMap: Record<string, unknown> = {};

    for (const [resourceName, routeMethods] of Object.entries(routes ?? {})) {
      if (resourceName === "widgets") {
        resourceMap.widgets = buildWidgets(
          client,
          routeMethods,
          schemas as unknown as ResolvedPluginSchemas<SchemaExtensions>
        );
      }
    }

    return Object.assign(client, resourceMap) as BuiltClient<TRoutes, TSchemas>;
  };
}

// ############################################################################
// Per-resource builders
// ############################################################################

function buildWidgets(
  client: Client,
  routeMethods: unknown,
  schemas: ResolvedPluginSchemas<SchemaExtensions>
): Widgets<WidgetBase, Record<string, unknown>> {
  const schemaName = RESOURCE_SCHEMA_MAP.widgets.get;
  const entry = schemas[schemaName as "Widget"];
  const itemSchema = entry?.commonSchema as z.ZodType<WidgetBase> | undefined;
  const filtersSchema = extractFiltersSchema(routeMethods);

  return new Widgets({
    client,
    defaultItemSchema: itemSchema,
    filtersSchema: filtersSchema as z.ZodType<Record<string, unknown>> | undefined,
  });
}

function extractFiltersSchema(routeMethods: unknown): z.ZodTypeAny | undefined {
  if (!routeMethods || typeof routeMethods !== "object") return undefined;
  const search = (routeMethods as { search?: { filters?: Record<string, unknown> } }).search;
  if (!search?.filters || Object.keys(search.filters).length === 0) return undefined;
  return withCustomFilters(
    search.filters as Parameters<typeof withCustomFilters>[0]
  ) as z.ZodTypeAny;
}
