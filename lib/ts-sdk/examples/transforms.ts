/**
 * Example: declarative bidirectional transforms via `definePlugin`.
 *
 * Demonstrates, in order:
 *   1. The standalone, Zod-free `transformWithMapping` runtime.
 *   2. A `definePlugin` entry using declarative `mappings` (Widget) — compiled
 *      behind the scenes by the `@internal buildTransforms`.
 *   3. A second entry using hand-written `toCommon` / `fromCommon` functions
 *      (Gadget) typed with the `ToCommon` / `FromCommon` helper types.
 *   4. Both directions runtime-validated by `definePlugin`'s wrapper, with a
 *      deliberate failure showing errors surfacing on `TransformResult.errors`.
 *   5. The identical consumer interface across both authoring paths.
 *
 * Both entries resolve to the same two-sided shape regardless of how they were
 * authored: `toCommon(source) -> TransformResult<common>` and
 * `fromCommon(common) -> TransformResult<source>`.
 */

import { z } from "zod";

import { definePlugin, transformWithMapping, type FromCommon, type ToCommon } from "../src";

// ############################################################################
// Step 1 — Standalone mapping runtime (no Zod, no plugin)
// ############################################################################

const standalone = transformWithMapping(
  { widget_status: "posted", widget_amount: 1000 },
  {
    status: { field: "widget_status" },
    amount: { value: { field: "widget_amount" }, currency: "USD" },
  }
);
console.log("=== standalone transformWithMapping ===");
console.log(JSON.stringify(standalone, null, 2));

// ############################################################################
// Step 2 — Widget: declarative mappings path
// ############################################################################

const SourceWidgetSchema = z.object({
  data: z.object({
    widget_uuid: z.string(),
    widget_name: z.string(),
    widget_color: z.string(),
    widget_weight: z.number(),
    legacy_id: z.number(),
  }),
});

const widgetCustomFields = {
  legacyId: {
    fieldType: "integer",
    value: z.number().int(),
    description: "Numeric ID from the legacy database (round-trip preserved).",
  },
} as const;

const widgetMappings = {
  toCommon: {
    id: { field: "data.widget_uuid" },
    name: { field: "data.widget_name" },
    color: { field: "data.widget_color" },
    weight: { field: "data.widget_weight" },
    customFields: {
      legacyId: { value: { field: "data.legacy_id" }, name: "legacyId", fieldType: "integer" },
    },
  },
  fromCommon: {
    data: {
      widget_uuid: { field: "id" },
      widget_name: { field: "name" },
      widget_color: { field: "color" },
      widget_weight: { field: "weight" },
      legacy_id: { field: "customFields.legacyId.value" },
    },
  },
};

// ############################################################################
// Step 3 — Gadget: hand-written functions typed via the helper types
// ############################################################################

const SourceGadgetSchema = z.object({
  gadget_uuid: z.string().uuid(),
  gadget_label: z.string(),
  gadget_size: z.number(),
  gadget_priority: z.number(),
});

const gadgetCustomFields = {
  priority: { fieldType: "integer", value: z.number().int() },
} as const;

type GadgetTypes = {
  model: "Gadget";
  sourceSchema: typeof SourceGadgetSchema;
  customFields: typeof gadgetCustomFields;
};

// `source` is inferred from `sourceSchema`; the return is checked against the
// resolved common type. No builder, no `as any`.
const gadgetToCommon: ToCommon<GadgetTypes> = (source) => ({
  result: {
    id: source.gadget_uuid,
    label: source.gadget_label,
    size: source.gadget_size,
    customFields: {
      priority: { name: "priority", fieldType: "integer", value: source.gadget_priority },
    },
  },
  errors: [],
});

const gadgetFromCommon: FromCommon<GadgetTypes> = (common) => ({
  result: {
    gadget_uuid: common.id,
    gadget_label: common.label,
    gadget_size: common.size,
    gadget_priority: common.customFields?.priority?.value ?? 0,
  },
  errors: [],
});

// ############################################################################
// Step 4 — One plugin, two authoring paths
// ############################################################################

const plugin = definePlugin({
  meta: { name: "demo", version: "0.1.0", sourceSystem: "legacy" },
  schemas: {
    Widget: {
      customFields: widgetCustomFields,
      sourceSchema: SourceWidgetSchema,
      mappings: widgetMappings,
    },
    Gadget: {
      customFields: gadgetCustomFields,
      sourceSchema: SourceGadgetSchema,
      toCommon: gadgetToCommon,
      fromCommon: gadgetFromCommon,
    },
  },
});

function report(
  label: string,
  result: { result: unknown; errors: { path?: string; message: string }[] }
): void {
  console.log(`\n=== ${label} ===`);
  if (result.errors.length > 0) {
    console.log(
      `errors: ${result.errors.map((e) => `[${e.path ?? "?"}] ${e.message}`).join("; ")}`
    );
  }
  console.log(JSON.stringify(result.result, null, 2));
}

// --- Widget (mappings) round trip --------------------------------------------
const widgetSource = {
  data: {
    widget_uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    widget_name: "Red Widget",
    widget_color: "red",
    widget_weight: 5,
    legacy_id: 12345,
  },
};
const widgetCommon = plugin.schemas.Widget.toCommon(widgetSource);
report("Widget toCommon (source → common)", widgetCommon);
report(
  "Widget fromCommon (common → source)",
  plugin.schemas.Widget.fromCommon(widgetCommon.result)
);

// --- Gadget (functions) round trip -------------------------------------------
const gadgetSource = {
  gadget_uuid: "223e4567-e89b-42d3-a456-426614174002",
  gadget_label: "Gizmo",
  gadget_size: 10,
  gadget_priority: 3,
};
const gadgetCommon = plugin.schemas.Gadget.toCommon(gadgetSource);
report("Gadget toCommon (source → common)", gadgetCommon);
report(
  "Gadget fromCommon (common → source)",
  plugin.schemas.Gadget.fromCommon(gadgetCommon.result)
);

// ############################################################################
// Step 5 — Validation surfaces errors (does not throw)
// ############################################################################

// A Gadget source whose UUID is malformed: the transform runs, but the
// wrapper's safeParse against `commonSchema` flags `id`, surfacing on
// `errors` rather than throwing.
const invalid = plugin.schemas.Gadget.toCommon({
  gadget_uuid: "not-a-uuid",
  gadget_label: "Bad",
  gadget_size: 1,
  gadget_priority: 1,
});
report("Gadget toCommon with an invalid UUID (errors reported, no throw)", invalid);
console.log(`\n✓ reported ${invalid.errors.length} validation error(s) without throwing`);
