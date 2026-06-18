/**
 * Shared sample data for the examples: source-system schemas (`SourceWidget`,
 * `SourceGadget`) standing in for an adopter's legacy shapes, and the typed
 * custom-field specs a plugin author declares (`widgetCustomFields`,
 * `gadgetCustomFields`). Mirrors `py-sdk`'s `examples/source.py`.
 */

import { z } from "zod";

// --- Typed custom-field value schema ----------------------------------------------------

/** A structured custom-field value (proves OBJECT-typed custom fields). */
export const LegacyRefSchema = z.object({ system: z.string(), id: z.number() });

// --- Custom-field specs an author declares ----------------------------------------------

export const widgetCustomFields = {
  legacyRef: { fieldType: "object", value: LegacyRefSchema },
  category: { fieldType: "string" },
} as const;

export const gadgetCustomFields = {
  priority: { fieldType: "integer", value: z.number().int() },
} as const;

// --- Legacy source-system schemas -------------------------------------------------------

/** An adopter's native widget record, with field names that differ from the protocol. */
export const SourceWidgetSchema = z.object({
  widget_id: z.string(),
  widget_name: z.string(),
  colour: z.string(),
  legacy_weight: z.number(),
  legacy_system: z.string(),
  legacy_id: z.number(),
  category: z.string(),
});

/** An adopter's native gadget record. */
export const SourceGadgetSchema = z.object({
  gadget_id: z.string(),
  gadget_label: z.string(),
  gadget_dimension: z.number(),
  gadget_priority: z.number(),
});

export const SAMPLE_WIDGET_SOURCE: z.infer<typeof SourceWidgetSchema> = {
  // a valid UUID, since the common Widget schema validates `id` as a UUID
  widget_id: "123e4567-e89b-42d3-a456-426614174001",
  widget_name: "Conservation widget",
  colour: "green",
  legacy_weight: 12.5,
  legacy_system: "legacy",
  legacy_id: 42,
  category: "eco",
};

export const SAMPLE_GADGET_SOURCE: z.infer<typeof SourceGadgetSchema> = {
  gadget_id: "223e4567-e89b-42d3-a456-426614174002",
  gadget_label: "Sprocket",
  gadget_dimension: 3.0,
  gadget_priority: 3,
};

/** Tiny PASS/FAIL line, shared by the scenario demos. */
export function check(label: string, ok: boolean): void {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${label}`);
}
