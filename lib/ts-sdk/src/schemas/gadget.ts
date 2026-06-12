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
