/**
 * The `routes` concern: registering the custom filters a search route accepts.
 * `withCustomFilters` builds the runtime Zod schema for a route's filter bag
 * from `CustomFilterSpec`s, `CUSTOM_FILTER_SCHEMA_MAP` bridges a filter family to
 * its value schema (in the schemas layer), and `f` builds `{operator, value}`
 * literals ergonomically. Mirrors `py-sdk`'s `extensions/routes.py`.
 */

import { z } from "zod";
import {
  DateComparisonFilterSchema,
  DateRangeFilterSchema,
  MoneyComparisonFilterSchema,
  MoneyRangeFilterSchema,
  NumberArrayFilterSchema,
  NumberComparisonFilterSchema,
  NumberRangeFilterSchema,
  StringArrayFilterSchema,
  StringComparisonFilterSchema,
} from "../../schemas/filters";
import type { CustomFilterSpec } from "../specs";
import type { CustomFilterType } from "../types";
import type { WithCustomFiltersResult } from "./types";

export type {
  CustomFilterInput,
  FilterInput,
  PluginRoutes,
  ResolvedCustomFilters,
  ResolvedSearchFilters,
  RouteFor,
  RouteMethods,
  RouteMethodSpec,
  SearchFiltersInput,
  WithCustomFiltersResult,
} from "./types";

// ############################################################################
// Filter family -> value schema (bridges to the schemas layer)
// ############################################################################

/**
 * Map of `CustomFilterType` → per-type Zod filter schema. `withCustomFilters()`
 * reads from this to build the runtime schema for a route's filter bag. Adding a
 * `CustomFilterType` requires the union member in `../types` plus an entry here.
 */
export const CUSTOM_FILTER_SCHEMA_MAP = {
  stringComparison: StringComparisonFilterSchema,
  stringArray: StringArrayFilterSchema,
  numberComparison: NumberComparisonFilterSchema,
  numberArray: NumberArrayFilterSchema,
  numberRange: NumberRangeFilterSchema,
  dateComparison: DateComparisonFilterSchema,
  dateRange: DateRangeFilterSchema,
  moneyComparison: MoneyComparisonFilterSchema,
  moneyRange: MoneyRangeFilterSchema,
} as const satisfies Record<CustomFilterType, z.ZodTypeAny>;

/** Looks up the Zod filter schema for a given `CustomFilterType`. */
export type CustomFilterSchema<K extends CustomFilterType> = (typeof CUSTOM_FILTER_SCHEMA_MAP)[K];

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
