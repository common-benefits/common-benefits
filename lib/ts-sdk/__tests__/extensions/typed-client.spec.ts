/**
 * Type-level gate for the fixed-slot client facade (TS-3).
 *
 * Proves the structured `ResourceTypeMap` projection preserves what the old
 * mapped-type approach gave us — no autocomplete or type-safety regression:
 *   (a) registered + standard filter keys are value-typed at the call site;
 *   (b) unregistered (ad hoc) keys still pass through;
 *   (c) returned rows carry the plugin's typed custom fields;
 *   (d) both fixed slots (`widgets`, `gadgets`) are present and typed, including
 *       the gadget `history` verb.
 *
 * These assertions are checked by `tsc --noEmit` (`__tests__` is in the tsconfig
 * include), so a regression fails `check:types` in CI. `expectTypeOf` is a
 * runtime no-op; `_filterCallSiteGate` is never invoked (no network).
 */

import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { definePlugin } from "../../src/extensions/define-plugin";
import { f } from "../../src/extensions/filter-helpers";
import type { Gadgets } from "../../src/client/resources/gadgets";
import type { Widgets } from "../../src/client/resources/widgets";

const widgetCustomFields = {
  legacyId: { fieldType: "object", value: z.object({ system: z.string(), id: z.number() }) },
  category: { fieldType: "string" },
} as const;

const plugin = definePlugin({
  meta: { name: "demo", version: "0.0.1" },
  schemas: { Widget: { customFields: widgetCustomFields } },
  routes: {
    widgets: { search: { filters: { tags: { filterType: "stringArray" } } } },
  },
});

void plugin; // built only for its type below; referenced here to satisfy lint

type Built = ReturnType<typeof plugin.getClient>;
type WidgetData = Extract<
  Awaited<ReturnType<Built["widgets"]["search"]>>["items"][number],
  { ok: true }
>["data"];
type GadgetData = Extract<
  Awaited<ReturnType<Built["gadgets"]["search"]>>["items"][number],
  { ok: true }
>["data"];
type WidgetCustomFields = NonNullable<WidgetData["customFields"]>;

describe("typed client facade — fixed slots, structured map", () => {
  it("(d) exposes both fixed resource slots, each typed", () => {
    expectTypeOf<Built["widgets"]>().toExtend<Widgets<WidgetData, Record<string, unknown>>>();
    expectTypeOf<Built["gadgets"]>().toExtend<Gadgets<GadgetData, Record<string, unknown>>>();
    expectTypeOf<Built["gadgets"]["history"]>().toBeFunction();
  });

  it("(c) returned rows are concretely typed (no widening to `any`)", () => {
    expectTypeOf<WidgetData["color"]>().toEqualTypeOf<string>();
    expectTypeOf<WidgetData["weight"]>().toEqualTypeOf<number>();
    expectTypeOf<GadgetData["label"]>().toEqualTypeOf<string>();
    expectTypeOf<GadgetData["size"]>().toEqualTypeOf<number>();
    // The plugin's extended `customFields` slot reaches the client row as a typed
    // object (not `any`). The typed `value` is asserted by property access in
    // `_customFieldValueGate` below (that is how consumers read it, and it is
    // fully typed).
    expectTypeOf<WidgetCustomFields>().not.toBeAny();
  });
});

// (a)/(b) — call-site filter typing. Never invoked; `tsc` checks the body.
async function _filterCallSiteGate(client: Built) {
  // Standard (color, weight), registered custom (tags), and ad hoc (region) keys
  // are all accepted; the standard/registered ones are value-typed.
  await client.widgets.search({
    filters: {
      color: f.eq("red"),
      weight: f.between(1, 10),
      tags: f.in(["a", "b"]),
      region: f.in(["PA"]),
    },
  });

  // @ts-expect-error a known string-comparison key rejects a number-range value
  await client.widgets.search({ filters: { color: f.between(1, 10) } });

  // The gadget history verb takes its own filters plus a `since` body field.
  await client.gadgets.history({
    since: "2026-01-01T00:00:00Z",
    filters: { actor: f.eq("alice") },
  });
}
void _filterCallSiteGate;

// (c, cont.) The plugin's typed custom-field value reaches the call site, read
// the way a consumer reads it. Dot access (`cf.legacyId.value`), bracket access
// by literal name (`cf["legacyId"].value`), and a const-literal key all type the
// value from the spec's schema; only a dynamic `string` key falls back to the
// base `CustomField` (`value: unknown`), which is correct — a runtime string
// can't be narrowed to a specific field. NOTE: pulling the value out by
// type-level extraction through the ParsedItem union (`Extract<…items[number],
// { ok: true }>["data"]` then an indexed-access type) reads as `unknown`; that
// is a type-extraction artifact, not the value consumers get. Never invoked.
async function _customFieldValueGate(client: Built) {
  const result = await client.widgets.search();
  const row = result.items[0];
  if (row.ok) {
    expectTypeOf(row.data.customFields?.legacyId?.value).toEqualTypeOf<
      { system: string; id: number } | undefined
    >();
    expectTypeOf(row.data.customFields?.category?.value).toEqualTypeOf<string | undefined>();
  }
}
void _customFieldValueGate;
