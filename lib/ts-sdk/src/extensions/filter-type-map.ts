/**
 * Map of `CustomFilterType` → per-type Zod filter schema.
 *
 * `withCustomFilters()` reads from this map to build the runtime Zod schema for
 * a route's filter bag. Adding a new `CustomFilterType` requires adding both
 * the union member in `plugin-types.ts` and a matching entry here.
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
} from "../schemas/filters";
import type { CustomFilterType } from "./plugin-types";

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
