/**
 * Scenario 3 - custom fields + hand-written transform functions.
 *
 * AUTHOR: attach custom fields and provide hand-written `toCommon` / `fromCommon`, typed with
 * the `ToCommon` / `FromCommon` helpers so `source` is inferred and the return is checked.
 * CONSUMER: run the transforms, read the typed custom field, and round-trip.
 *
 * Run: `pnpm dlx tsx examples/custom-fields-functions.ts` (or `pnpm run examples` for all).
 */

import { definePlugin, type FromCommon, type ToCommon } from "../src";
import { SAMPLE_GADGET_SOURCE, SourceGadgetSchema, check, gadgetCustomFields } from "./source";

// --- Author -----------------------------------------------------------------------------
type GadgetTypes = {
  model: "Gadget";
  sourceSchema: typeof SourceGadgetSchema;
  customFields: typeof gadgetCustomFields;
};

// `source` is inferred from `sourceSchema`; the return is checked against the resolved common.
const gadgetToCommon: ToCommon<GadgetTypes> = (source) => ({
  result: {
    id: source.gadget_id,
    label: source.gadget_label,
    size: source.gadget_dimension,
    customFields: {
      priority: { name: "priority", fieldType: "integer", value: source.gadget_priority },
    },
  },
  errors: [],
});

const gadgetFromCommon: FromCommon<GadgetTypes> = (common) => ({
  result: {
    gadget_id: common.id,
    gadget_label: common.label,
    gadget_dimension: common.size,
    gadget_priority: common.customFields?.priority?.value ?? 0,
  },
  errors: [],
});

export const functionsPlugin = definePlugin({
  meta: { name: "gadget functions plugin", version: "0.1.0", sourceSystem: "acme-gadgets" },
  schemas: {
    Gadget: {
      customFields: gadgetCustomFields,
      sourceSchema: SourceGadgetSchema,
      toCommon: gadgetToCommon,
      fromCommon: gadgetFromCommon,
    },
  },
});

// --- Consumer ---------------------------------------------------------------------------
export async function demo(): Promise<void> {
  console.log("Scenario 3 - custom fields + hand-written transforms");

  const result = functionsPlugin.schemas.Gadget.toCommon(SAMPLE_GADGET_SOURCE);
  const priority: number | undefined = result.result.customFields?.priority?.value; // typed: number
  check("priority.value typed number == 3", priority === 3);

  const back = functionsPlugin.schemas.Gadget.fromCommon(result.result);
  check("round-trips back to gadget_priority == 3", back.result.gadget_priority === 3);
}

demo().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
