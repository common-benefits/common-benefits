/**
 * The filter registry — the closed set of filter families a search route can
 * accept, mapping each family to its value schema (in the schemas layer). This
 * map is the single source of truth: `CustomFilterType` is *derived* from its
 * keys and `CustomFilterSchema` looks up a family's schema, so all three stay in
 * lockstep. Adding a family is one entry here. Internal — not part of the public API.
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

/** Map of filter family → per-type Zod filter schema (the single source of truth). */
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
} as const satisfies Record<string, z.ZodTypeAny>;

/** The filter families adopters can attach to a search route — derived from the map. */
export type CustomFilterType = keyof typeof CUSTOM_FILTER_SCHEMA_MAP;

/** Looks up the Zod filter schema for a given `CustomFilterType`. */
export type CustomFilterSchema<K extends CustomFilterType> = (typeof CUSTOM_FILTER_SCHEMA_MAP)[K];
