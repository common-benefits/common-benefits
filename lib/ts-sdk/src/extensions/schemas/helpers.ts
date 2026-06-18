/**
 * Internal machinery for the `schemas` concern — not part of the public API.
 *
 * `EXTENSIBLE_SCHEMA_MAP` is the closed registry of extensible models, used by
 * the plugin builder/resolution and the transform helpers to resolve a model
 * name back to the base schema it extends. Adding a model here (plus a facade
 * slot + registry entry) is the "add a resource" seam.
 */

import { GadgetBaseSchema } from "../../schemas/gadget";
import { WidgetBaseSchema } from "../../schemas/widget";
import type { ExtensibleSchemaName, HasCustomFields } from "./types";

/** Maps each extensible model to its base Zod schema. */
export const EXTENSIBLE_SCHEMA_MAP = {
  Widget: WidgetBaseSchema,
  Gadget: GadgetBaseSchema,
} as const satisfies Record<ExtensibleSchemaName, HasCustomFields>;
