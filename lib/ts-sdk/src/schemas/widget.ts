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
