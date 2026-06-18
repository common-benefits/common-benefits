/**
 * Types for the `routes` concern: the filter vocabulary and spec, the per-route
 * filter declarations a plugin registers (`PluginRoutes` / `RouteMethods`), the
 * `withCustomFilters` result type, and the projection that turns a route's
 * registered filters into the typed `filters` bag a resource's `search` accepts.
 */

import type { z } from "zod";
import type { CustomFilterSchema } from "./helpers";

// ############################################################################
// Filter vocabulary (moved here from the shared extensions/types.ts + specs.ts)
// ############################################################################

/**
 * The narrow set of filter families adopters can attach to a search route. Each
 * key mirrors a per-type filter schema name (e.g. `"stringComparison"` ↔
 * `StringComparisonFilterSchema`). `integer` flows through `numberComparison`.
 */
export type CustomFilterType =
  | "stringComparison"
  | "stringArray"
  | "numberComparison"
  | "numberArray"
  | "numberRange"
  | "dateComparison"
  | "dateRange"
  | "moneyComparison"
  | "moneyRange";

/** Specification for a custom filter on a search route. */
export interface CustomFilterSpec {
  /** Optional display name (defaults to the record key). */
  name?: string;
  /** The filter family — drives operator + value validation. */
  filterType: CustomFilterType;
  /** Optional description. */
  description?: string;
}

// ############################################################################
// Route declarations
// ############################################################################

/** Per-method route configuration (currently only `search` has filter specs). */
export interface RouteMethodSpec {
  /** Custom filter specs keyed by filter name. */
  filters?: Record<string, CustomFilterSpec>;
}

/** Map of method-name to its spec; currently only `"search"` is meaningful. */
export type RouteMethods = Partial<Record<"search", RouteMethodSpec>>;

/**
 * Top-level routes declaration.
 *
 * @example
 * ```ts
 * const routes = {
 *   widgets: { search: { filters: { region: { filterType: "stringArray" } } } },
 * } satisfies PluginRoutes;
 * ```
 */
export type PluginRoutes = Partial<Record<string, RouteMethods>>;

// ############################################################################
// withCustomFilters result
// ############################################################################

/**
 * The Zod schema produced by `withCustomFilters`. For each key in `TSpecs`, the
 * corresponding filter schema is made optional (filters are opt-in per request).
 */
export type WithCustomFiltersResult<TSpecs extends Record<string, CustomFilterSpec>> = z.ZodObject<{
  [K in keyof TSpecs]: TSpecs[K]["filterType"] extends CustomFilterType
    ? z.ZodOptional<CustomFilterSchema<TSpecs[K]["filterType"]>>
    : z.ZodOptional<z.ZodTypeAny>;
}>;

// ############################################################################
// Search-filter projection (route filters -> the bag `search()` accepts)
// ############################################################################

/**
 * Loosest filter literal: any operator, any value. Both the ad hoc escape hatch
 * and the upper bound every typed filter must satisfy, so the index signature
 * below preserves (rather than narrows to `never`) the typed keys it overlaps.
 */
export type FilterInput = { operator: string; value: unknown };

/** Per-type input for a registered custom filter, falling back to the loose shape. */
export type CustomFilterInput<FT> = FT extends CustomFilterType
  ? z.input<CustomFilterSchema<FT>>
  : FilterInput;

/** Registered custom filters bag, typed per declared `filterType`. */
export type ResolvedCustomFilters<TMethods> = TMethods extends { search: { filters: infer F } }
  ? F extends Record<string, { filterType: string }>
    ? { [K in keyof F]?: CustomFilterInput<F[K]["filterType"]> }
    : Record<never, never>
  : Record<never, never>;

/**
 * The `filters` bag accepted by `search()`: default and registered-custom keys
 * are typed (full autocomplete and value checking); any other string key is
 * accepted as an ad hoc custom filter. The split into standard vs `customFilters`
 * happens inside `search()`.
 */
export type SearchFiltersInput<TDefaults, TCustoms> = TDefaults &
  TCustoms & { [key: string]: FilterInput | undefined };

/** A route's method specs for resource `K`, or `undefined` when none declared. */
export type RouteFor<TRoutes extends PluginRoutes, K extends string> = K extends keyof TRoutes
  ? TRoutes[K]
  : undefined;

/** The filters bag a resource's `search` accepts: standard + registered custom + ad hoc. */
export type ResolvedSearchFilters<
  TRoutes extends PluginRoutes,
  K extends string,
  TDefaults,
> = SearchFiltersInput<TDefaults, ResolvedCustomFilters<RouteFor<TRoutes, K>>> &
  Record<string, unknown>;
