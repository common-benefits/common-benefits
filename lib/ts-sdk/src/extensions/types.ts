/**
 * Shared extension vocabulary: the extensible-model key type, the field/filter
 * type tags, and the runtime object shape the custom-field helpers read. These
 * are the cross-concern primitives that `schemas`, `routes`, `plugin`, and
 * `transforms` all build on.
 */

import { z } from "zod";
import { CustomFieldSchema, CustomFieldTypeEnum } from "../schemas/fields";

/** JSON-schema type tag for a custom field's value. */
export type CustomFieldType = z.infer<typeof CustomFieldTypeEnum>;

/**
 * The narrow set of filter families adopters can attach to a search route.
 *
 * Each key mirrors the corresponding per-type filter schema name (e.g.
 * `"stringComparison"` ↔ `StringComparisonFilterSchema`). `integer` flows
 * through `numberComparison`; `boolean` is omitted until a real use case shows up.
 */
export type CustomFilterType =
  | "stringComparison"
  | "stringArray"
  | "numberComparison"
  | "numberArray"
  | "numberRange"
  | "dateComparison"
  | "dateRange"
  | "moneyComparison"
  | "moneyRange";

/**
 * Names of base models that support custom-field extensions. For this
 * scaffolding the dummy `Widget` / `Gadget` schemas are registered; when the
 * Programs route lands, `"Program"` joins.
 */
export type ExtensibleSchemaName = "Widget" | "Gadget";

type CustomField = z.infer<typeof CustomFieldSchema>;

/** Runtime object with an optional `customFields` property. */
export interface ExtensibleObject {
  customFields?: Record<string, CustomField> | null;
}
