/**
 * Internal machinery for the `routes` concern — not part of the public API.
 *
 * `CUSTOM_FILTER_SCHEMA_MAP` bridges a filter family to its value schema (in the
 * schemas layer); `withCustomFilters` reads it to build a route's filter Zod
 * schema. Adding a `CustomFilterType` requires the union member in `./types`
 * plus an entry here.
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
import type { CustomFilterType } from "./types";

/** Map of `CustomFilterType` → per-type Zod filter schema. */
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
