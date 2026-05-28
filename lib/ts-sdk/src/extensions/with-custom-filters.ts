/**
 * `withCustomFilters()` — build a Zod schema for a route's filter bag from a
 * `Record<string, CustomFilterSpec>`.
 *
 * Looks up each spec's `filterType` in `CUSTOM_FILTER_SCHEMA_MAP` and produces
 * `z.object({ [key]: <schema>.optional(), ... })`. Used by `buildGetClient()`
 * to validate `search({ filters })` payloads before they hit the wire.
 */

import { z } from "zod";
import { CUSTOM_FILTER_SCHEMA_MAP, type CustomFilterSchema } from "./filter-type-map";
import type { CustomFilterSpec, CustomFilterType } from "./plugin-types";

// ############################################################################
// Public type - WithCustomFiltersResult
// ############################################################################

/**
 * The Zod schema produced by {@link withCustomFilters}.
 *
 * For each key in `TSpecs`, the corresponding filter schema is made optional
 * (filters are opt-in per request).
 */
export type WithCustomFiltersResult<TSpecs extends Record<string, CustomFilterSpec>> = z.ZodObject<{
  [K in keyof TSpecs]: TSpecs[K]["filterType"] extends CustomFilterType
    ? z.ZodOptional<CustomFilterSchema<TSpecs[K]["filterType"]>>
    : z.ZodOptional<z.ZodTypeAny>;
}>;

// ############################################################################
// Public function - withCustomFilters()
// ############################################################################

/**
 * Builds a Zod schema for a route's filter bag.
 *
 * @example
 * ```ts
 * const FiltersSchema = withCustomFilters({
 *   color:  { filterType: "stringComparison" },
 *   weight: { filterType: "numberRange" },
 * } as const);
 *
 * FiltersSchema.parse({ color: { operator: "eq", value: "red" } });
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
