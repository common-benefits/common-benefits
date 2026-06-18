/**
 * `buildGetClient()` — produces a `getClient(config)` factory whose returned
 * `Client` already has typed resources attached.
 *
 * Construction is generic and registry-driven (no per-resource builder). For
 * each entry in `RESOURCE_REGISTRY` (every registered resource is always built,
 * matching the fixed slots on the typed facade), the factory:
 *   1. Reads its `resourceClass`, per-method `schemas`, and `defaultFilters`.
 *   2. Resolves each method's item schema by name through the plugin's resolved
 *      schemas (the extended `commonSchema`, or the base schema) and passes them
 *      as `itemSchemas` so call-site parsing uses the typed schema automatically.
 *   3. Builds a `customFiltersSchema` via `withCustomFilters()` from the
 *      resource's `routes[resource].search.filters` declaration (if any), and
 *      passes both it and the protocol `defaultFiltersSchema` so `search({ filters })`
 *      can split standard from custom filters before the request.
 *
 * The return type is the explicit fixed-slot `CommonBenefitsClient` facade, with
 * each slot's item/filter types projected from the plugin (see `BuiltClient`).
 */

import { z } from "zod";
import { Client } from "../client/client";
import type { ClientConfig } from "../client/config";
import type { CommonBenefitsClient } from "../client/facade";
import type { ResourceConstructor, ResourceMethod } from "../client/resources/base";
import { DEFAULT_FILTERS_MAP, RESOURCE_REGISTRY } from "../client/resources/registry";
import { WidgetBaseSchema, WidgetDefaultFiltersSchema } from "../schemas/widget";
import { GadgetBaseSchema, GadgetDefaultFiltersSchema } from "../schemas/gadget";
import type { ResolvedPluginSchemas } from "./define-plugin";
import type { CustomFilterSchema } from "./filter-type-map";
import type { CustomFilterType, PluginRoutes, SchemaExtensions } from "./plugin-types";
import { withCustomFilters } from "./with-custom-filters";

// ############################################################################
// Type-level resource derivation
// ############################################################################

type WidgetBase = z.infer<typeof WidgetBaseSchema>;
type WidgetDefaultFilters = z.input<typeof WidgetDefaultFiltersSchema>;
type GadgetBase = z.infer<typeof GadgetBaseSchema>;
type GadgetDefaultFilters = z.input<typeof GadgetDefaultFiltersSchema>;

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

/**
 * Loosest filter literal: any operator, any value. Both the ad hoc escape hatch
 * and the upper bound every typed filter must satisfy, so the index signature
 * below preserves (rather than narrows to `never`) the typed keys it overlaps.
 */
type FilterInput = { operator: string; value: unknown };

/** Per-type input for a registered custom filter, falling back to the loose shape. */
type CustomFilterInput<FT> = FT extends CustomFilterType
  ? z.input<CustomFilterSchema<FT>>
  : FilterInput;

/** Registered custom filters bag, typed per declared `filterType`. */
type ResolvedCustomFilters<TMethods> = TMethods extends {
  search: { filters: infer F };
}
  ? F extends Record<string, { filterType: string }>
    ? { [K in keyof F]?: CustomFilterInput<F[K]["filterType"]> }
    : Record<never, never>
  : Record<never, never>;

/**
 * The `filters` bag accepted by `search()`: default and registered-custom keys
 * are typed (full autocomplete and value checking); any other string key is
 * accepted as an ad hoc custom filter. The split into standard vs `customFilters`
 * happens inside `search()`.
 *
 * Tradeoff: the index signature is what lets ad hoc keys through, but it also
 * means a typo'd default key (`wieght`) is not a compile error — it falls
 * through to `customFilters` at runtime and is validated against the generic
 * filter schema. This is irreducible while the split stays invisible behind one
 * flat bag.
 */
type SearchFiltersInput<TDefaults, TCustoms> = TDefaults &
  TCustoms & { [key: string]: FilterInput | undefined };

/** A route's method specs for resource `K`, or `undefined` when none declared. */
type RouteFor<TRoutes extends PluginRoutes, K extends string> = K extends keyof TRoutes
  ? TRoutes[K]
  : undefined;

/** The filters bag a resource's `search` accepts: standard + registered custom + ad hoc. */
type ResolvedSearchFilters<
  TRoutes extends PluginRoutes,
  K extends string,
  TDefaults,
> = SearchFiltersInput<TDefaults, ResolvedCustomFilters<RouteFor<TRoutes, K>>> &
  Record<string, unknown>;

/**
 * Final return type of `getClient(config)`: the {@link CommonBenefitsClient}
 * facade with each slot's item and filter types projected from the plugin's
 * already-bound `TSchemas` / `TRoutes` into the structured resource map. One
 * named entry per resource (no mapped type over a registry); the `item` comes
 * from `schemas`, the `filters` from `routes`.
 */
export type BuiltClient<
  TRoutes extends PluginRoutes,
  TSchemas extends SchemaExtensions,
> = CommonBenefitsClient<{
  widgets: {
    item: ResolvedItemType<TSchemas, "Widget", WidgetBase>;
    filters: ResolvedSearchFilters<TRoutes, "widgets", WidgetDefaultFilters>;
  };
  gadgets: {
    item: ResolvedItemType<TSchemas, "Gadget", GadgetBase>;
    filters: ResolvedSearchFilters<TRoutes, "gadgets", GadgetDefaultFilters>;
  };
}>;

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

    // Every registered resource is always constructed (matching the fixed slots
    // on the typed facade); `routes` only supplies the custom filters for
    // resources that registered any.
    for (const [resourceName, entry] of Object.entries(RESOURCE_REGISTRY)) {
      const routeMethods = (routes ?? {})[resourceName];

      // Resolve each method's item schema by name through the plugin's resolved
      // schemas (rooted in EXTENSIBLE_SCHEMA_MAP); default filters by name
      // through DEFAULT_FILTERS_MAP.
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

// ############################################################################
// Internal helpers
// ############################################################################

/** Builds the registered custom-filters schema from a route's `search.filters`. */
function extractFiltersSchema(routeMethods: unknown): z.ZodTypeAny | undefined {
  if (!routeMethods || typeof routeMethods !== "object") return undefined;
  const search = (routeMethods as { search?: { filters?: Record<string, unknown> } }).search;
  if (!search?.filters || Object.keys(search.filters).length === 0) return undefined;
  return withCustomFilters(
    search.filters as Parameters<typeof withCustomFilters>[0]
  ) as z.ZodTypeAny;
}
