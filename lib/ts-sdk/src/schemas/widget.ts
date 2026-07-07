/**
 * Dummy `Widget` base schema for the client / extension scaffolding.
 *
 * Stands in for the real `Program` schema until the TypeSpec
 * `GET /programs/search` route is emitted. The shape mirrors the protocol's
 * extensible-model pattern: it carries a few base fields and a `customFields`
 * slot that `withCustomFields()` can replace with a typed version.
 *
 * When the Program integration lands, swap callers off `WidgetBaseSchema`
 * onto `ProgramBaseSchema` and delete this file.
 */

import { z } from "zod";
import { CustomFieldSchema } from "./fields";
import { NumberRangeFilterSchema, StringComparisonFilterSchema } from "./filters";

export const WidgetBaseSchema = z.object({
  /** Unique identifier for the widget */
  id: z.string().uuid(),

  /** Human-readable widget name */
  name: z.string(),

  /** Widget color (used as a sample filterable string field) */
  color: z.string(),

  /** Widget weight (used as a sample filterable number field) */
  weight: z.number(),

  /** Adopter-defined custom fields, keyed by field name */
  customFields: z.record(z.string(), CustomFieldSchema).nullish(),
});

/**
 * Protocol-defined ("standard") search filters for the widgets route.
 *
 * Stands in for the real `Program` default filters until the TypeSpec
 * `GET /programs/search` route is emitted (mirrors the upstream CommonGrants
 * `OppDefaultFiltersSchema`). Every member is optional: a search request
 * supplies any subset. `search()` routes the keys named here to the top level
 * of the request body's `filters`; everything else nests under `customFilters`.
 */
export const WidgetDefaultFiltersSchema = z.object({
  /** Filter by widget color */
  color: StringComparisonFilterSchema.nullish(),

  /** Filter by widget weight range */
  weight: NumberRangeFilterSchema.nullish(),
});
