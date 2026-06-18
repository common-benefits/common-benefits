/**
 * Scenario 1 - custom fields only (no transforms).
 *
 * AUTHOR: register typed custom fields on Widget via `definePlugin` (no source, no transforms).
 * CONSUMER: parse a record with the resolved schema and read the typed custom-field value.
 *
 * Run: `pnpm dlx tsx examples/custom-fields.ts` (or `pnpm run examples` for all scenarios).
 */

import { definePlugin } from "../src";
import { check, widgetCustomFields } from "./source";

// --- Author -----------------------------------------------------------------------------
export const schemaOnlyPlugin = definePlugin({
  meta: { name: "schema-only widget plugin", version: "0.1.0", sourceSystem: "acme-widgets" },
  schemas: { Widget: { customFields: widgetCustomFields } },
});

// --- Consumer ---------------------------------------------------------------------------
export async function demo(): Promise<void> {
  console.log("Scenario 1 - custom fields only");

  const record = {
    id: "123e4567-e89b-42d3-a456-426614174001",
    name: "Direct",
    color: "blue",
    weight: 1,
    customFields: {
      legacyRef: { name: "legacyRef", fieldType: "object", value: { system: "legacy", id: 7 } },
    },
  };
  // `commonSchema` is the (custom-field-extended) Zod schema; `.parse` returns the typed model.
  const widget = schemaOnlyPlugin.schemas.Widget.commonSchema.parse(record);
  const id: number | undefined = widget.customFields?.legacyRef?.value.id; // typed: number
  check("legacyRef.value.id typed number == 7", id === 7);
}

demo().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
