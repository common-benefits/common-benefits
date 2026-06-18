/**
 * Scenario 4 - declarative mappings, no custom fields.
 *
 * AUTHOR: map a source system onto the bare common model (no custom fields attached).
 * CONSUMER: run `toCommon` and read the mapped base fields.
 *
 * Run: `pnpm dlx tsx examples/mappings-only.ts` (or `pnpm run examples` for all scenarios).
 */

import { definePlugin } from "../src";
import { SAMPLE_WIDGET_SOURCE, SourceWidgetSchema, check } from "./source";

// --- Author -----------------------------------------------------------------------------
export const barePlugin = definePlugin({
  meta: { name: "bare widget plugin", version: "0.1.0", sourceSystem: "acme-widgets" },
  schemas: {
    Widget: {
      sourceSchema: SourceWidgetSchema,
      mappings: {
        toCommon: {
          id: { field: "widget_id" },
          name: { field: "widget_name" },
          color: { field: "colour" },
          weight: { field: "legacy_weight" },
        },
        fromCommon: {
          widget_id: { field: "id" },
          widget_name: { field: "name" },
          colour: { field: "color" },
          legacy_weight: { field: "weight" },
        },
      },
    },
  },
});

// --- Consumer ---------------------------------------------------------------------------
export async function demo(): Promise<void> {
  console.log("Scenario 4 - mappings, no custom fields");

  const result = barePlugin.schemas.Widget.toCommon(SAMPLE_WIDGET_SOURCE);
  check("widget_name mapped to name", result.result.name === "Conservation widget");
}

demo().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
