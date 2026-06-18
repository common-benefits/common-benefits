/**
 * Dummy `Gadget` base schema — a second extensible model used purely as
 * scaffolding to prove the transform surface is not bound to a single hardcoded
 * base (see the transforms plan, Task 9).
 *
 * Its shape deliberately differs from `Widget` (`label` / `size` instead of
 * `name` / `color` / `weight`) so that a consumer reading
 * `plugin.schemas.Widget` vs `plugin.schemas.Gadget` gets distinct, correct,
 * non-interchangeable types. Remove this once a real second extensible model
 * (e.g. `Program`) lands.
 */

import { z } from "zod";
import { CustomFieldSchema } from "./fields";
import { NumberComparisonFilterSchema, StringComparisonFilterSchema } from "./filters";

export const GadgetBaseSchema = z.object({
  /** Unique identifier for the gadget */
  id: z.string().uuid(),

  /** Human-readable gadget label */
  label: z.string(),

  /** Gadget size (a sample numeric field distinct from Widget's `weight`) */
  size: z.number(),

  /** Adopter-defined custom fields, keyed by field name */
  customFields: z.record(z.string(), CustomFieldSchema).nullish(),
});

/**
 * Protocol-defined ("standard") search filters for the gadgets route.
 *
 * Mirrors `WidgetDefaultFiltersSchema` but with a single numeric comparison
 * filter, so the two placeholder resources exercise distinct standard-filter
 * shapes (Widget: string + range; Gadget: number comparison).
 */
export const GadgetDefaultFiltersSchema = z.object({
  /** Filter by gadget size */
  size: NumberComparisonFilterSchema.nullish(),
});

/**
 * Standard filters for the gadgets `history` verb — a second filterable method
 * on the same resource, with its own standard-filter set distinct from search.
 */
export const GadgetHistoryFiltersSchema = z.object({
  /** Filter history entries by the actor who made the change */
  actor: StringComparisonFilterSchema.nullish(),
});
