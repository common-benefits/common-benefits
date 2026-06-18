/**
 * The `routes` concern — public API: registering the custom filters a search
 * route accepts (`withCustomFilters`), the route declaration types, and `f`
 * (ergonomic `{operator, value}` builders). Mirrors `py-sdk`'s
 * `extensions/routes.py`.
 *
 * Internal machinery lives alongside: `helpers.ts` (`CUSTOM_FILTER_SCHEMA_MAP`,
 * `CustomFilterSchema`) and `types.ts` (the search-filter projection).
 */

import { z } from "zod";
import { CUSTOM_FILTER_SCHEMA_MAP } from "./helpers";
import type { CustomFilterSpec, WithCustomFiltersResult } from "./types";

export type {
  CustomFilterSpec,
  PluginRoutes,
  RouteMethods,
  RouteMethodSpec,
  WithCustomFiltersResult,
} from "./types";

// ############################################################################
// withCustomFilters()
// ############################################################################

/**
 * Builds a Zod schema for a route's filter bag — each spec's `filterType` is
 * looked up in `CUSTOM_FILTER_SCHEMA_MAP` and made optional (filters are opt-in
 * per request).
 *
 * @example
 * ```ts
 * const FiltersSchema = withCustomFilters({
 *   color:  { filterType: "stringComparison" },
 *   weight: { filterType: "numberRange" },
 * } as const);
 * ```
 */
export function withCustomFilters<const TSpecs extends Record<string, CustomFilterSpec>>(
  specs: TSpecs
): WithCustomFiltersResult<TSpecs> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, spec] of Object.entries(specs)) {
    const schema = CUSTOM_FILTER_SCHEMA_MAP[spec.filterType];
    if (!schema) {
      throw new Error(
        `withCustomFilters: unknown filterType "${spec.filterType}" on field "${key}". ` +
          `Valid filter types are: ${Object.keys(CUSTOM_FILTER_SCHEMA_MAP).join(", ")}`
      );
    }
    shape[key] = schema.optional();
  }
  return z.object(shape) as WithCustomFiltersResult<TSpecs>;
}

// ############################################################################
// Filter literal builders
// ############################################################################

/** Ergonomic builders for `{operator, value}` filter literals. */
export const f = {
  eq: <T>(value: T) => ({ operator: "eq" as const, value }),
  neq: <T>(value: T) => ({ operator: "neq" as const, value }),
  lt: <T>(value: T) => ({ operator: "lt" as const, value }),
  lte: <T>(value: T) => ({ operator: "lte" as const, value }),
  gt: <T>(value: T) => ({ operator: "gt" as const, value }),
  gte: <T>(value: T) => ({ operator: "gte" as const, value }),
  in: <T>(value: T[]) => ({ operator: "in" as const, value }),
  notIn: <T>(value: T[]) => ({ operator: "notIn" as const, value }),
  like: (value: string) => ({ operator: "like" as const, value }),
  notLike: (value: string) => ({ operator: "notLike" as const, value }),
  between: <T>(min: T, max: T) => ({ operator: "between" as const, value: { min, max } }),
  outside: <T>(min: T, max: T) => ({ operator: "outside" as const, value: { min, max } }),
};
