/**
 * The extensible-schema registry — the closed set of protocol models that
 * accept custom-field extensions, mapping each model name to its base Zod
 * schema. This map is the single source of truth: `ExtensibleSchemaName` is
 * *derived* from its keys, so the two can never drift.
 *
 * This is the extensions-layer counterpart to `client/resources/registry.ts`
 * (which registers resources). Together they are the "add a schema/resource"
 * seam: introducing a real model (e.g. `Program`) means adding an entry here,
 * a resource entry in the client registry, and a facade slot.
 *
 * `definePlugin` resolution (`plugin/builder.ts`, `plugin/types.ts`) and the
 * transform author helpers (`transforms/types.ts`) read this to resolve a model
 * name back to the schema it extends. Internal — not part of the public API.
 */

import { GadgetBaseSchema } from "../schemas/gadget";
import { WidgetBaseSchema } from "../schemas/widget";
import type { HasCustomFields } from "./schemas/types";

/** Maps each extensible model to its base Zod schema (the single source of truth). */
export const EXTENSIBLE_SCHEMA_MAP = {
  Widget: WidgetBaseSchema,
  Gadget: GadgetBaseSchema,
} as const satisfies Record<string, HasCustomFields>;

/** Names of base models that support custom-field extensions — derived from the map. */
export type ExtensibleSchemaName = keyof typeof EXTENSIBLE_SCHEMA_MAP;
