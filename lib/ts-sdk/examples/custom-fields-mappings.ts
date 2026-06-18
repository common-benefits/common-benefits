/**
 * Scenario 2 - custom fields + declarative mappings.
 *
 * AUTHOR: attach custom fields and compile source <-> common transforms from declarative
 * `mappings` (no hand-written functions).
 * CONSUMER: run `toCommon` / `fromCommon`, read the typed custom field, and round-trip.
 *
 * Run: `pnpm dlx tsx examples/custom-fields-mappings.ts` (or `pnpm run examples` for all).
 */

import { definePlugin } from "../src";
import { SAMPLE_WIDGET_SOURCE, SourceWidgetSchema, check, widgetCustomFields } from "./source";

// --- Author -----------------------------------------------------------------------------
export const mappingsPlugin = definePlugin({
  meta: { name: "widget mappings plugin", version: "0.1.0", sourceSystem: "acme-widgets" },
  schemas: {
    Widget: {
      customFields: widgetCustomFields,
      sourceSchema: SourceWidgetSchema,
      mappings: {
        toCommon: {
          id: { field: "widget_id" },
          name: { field: "widget_name" },
          color: { field: "colour" },
          weight: { field: "legacy_weight" },
          customFields: {
            legacyRef: {
              name: { const: "legacyRef" },
              fieldType: { const: "object" },
              value: { system: { field: "legacy_system" }, id: { field: "legacy_id" } },
            },
            category: {
              name: { const: "category" },
              fieldType: { const: "string" },
              value: { field: "category" },
            },
          },
        },
        fromCommon: {
          widget_id: { field: "id" },
          widget_name: { field: "name" },
          colour: { field: "color" },
          legacy_weight: { field: "weight" },
          legacy_system: { field: "customFields.legacyRef.value.system" },
          legacy_id: { field: "customFields.legacyRef.value.id" },
          category: { field: "customFields.category.value" },
        },
      },
    },
  },
});

// --- Consumer ---------------------------------------------------------------------------
export async function demo(): Promise<void> {
  console.log("Scenario 2 - custom fields + declarative mappings");

  const result = mappingsPlugin.schemas.Widget.toCommon(SAMPLE_WIDGET_SOURCE);
  check("toCommon had no errors", result.errors.length === 0);

  const id: number | undefined = result.result.customFields?.legacyRef?.value.id; // typed: number
  check("legacyRef.value.id typed number == 42", id === 42);

  const back = mappingsPlugin.schemas.Widget.fromCommon(result.result);
  check("round-trips back to legacy_id == 42", back.result.legacy_id === 42);
}

demo().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
