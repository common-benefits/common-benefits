/**
 * The extensible-schema registry — the closed set of protocol models that
 * accept custom-field extensions, mapping each model name to its base Zod
 * schema.
 *
 * This is the extensions-layer counterpart to `client/resources/registry.ts`
 * (which registers resources). Together they are the "add a schema/resource"
 * seam: introducing a real model (e.g. `Program`) means adding an entry here,
 * a resource entry in the client registry, and a facade slot. Keeping these in
 * dedicated, discoverable registry files (rather than scattered across the
 * concern modules) is what lets a consistency guard tie them together.
 *
 * `definePlugin` resolution (`plugin/builder.ts`, `plugin/types.ts`) and the
 * transform author helpers (`transforms/types.ts`) read this to resolve a model
 * name back to the schema it extends. Internal — not part of the public API.
 */

import { GadgetBaseSchema } from "../schemas/gadget";
import { WidgetBaseSchema } from "../schemas/widget";
import type { ExtensibleSchemaName, HasCustomFields } from "./schemas/types";

/** Maps each extensible model to its base Zod schema. */
export const EXTENSIBLE_SCHEMA_MAP = {
  Widget: WidgetBaseSchema,
  Gadget: GadgetBaseSchema,
} as const satisfies Record<ExtensibleSchemaName, HasCustomFields>;
