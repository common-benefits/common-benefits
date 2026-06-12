/**
 * Integration tests for `definePlugin` transforms + client wiring.
 *
 * Covers:
 *   - Client round-trip: custom fields typed on returned items, custom filters
 *     validated at the call site, bad records surfaced as ParsingError.
 *   - Transforms: source -> common -> source round trip for BOTH authoring
 *     paths (hand-written functions on Widget, declarative mappings on Gadget).
 *   - `commonSchema` validation errors on the toCommon side and `sourceSchema`
 *     validation errors on the fromCommon side, merged into `errors`.
 *   - Both authoring paths resolve to the identical two-sided shape.
 *   - Multi-model: Widget and Gadget resolve independently to distinct,
 *     non-interchangeable types (the forcing function for per-model base
 *     resolution).
 *   - Type-level: helper-typed functions infer `source`; resolved `toCommon` /
 *     `fromCommon` are non-optional and two-sided; mappings XOR functions.
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { definePlugin } from "../../src/extensions/define-plugin";
import { f } from "../../src/extensions/filter-helpers";
import type { FromCommon, ToCommon } from "../../src/extensions/transform-helpers";
import { http, HttpResponse, setupServer } from "../utils/mock-fetch";

const BASE_URL = "https://api.example.org";

// ############################################################################
// Shared schemas / specs
// ############################################################################

const LegacyIdValueSchema = z.object({ system: z.string(), id: z.number() });
const SourceWidgetSchema = z.object({ legacy_id: z.number(), legacy_name: z.string() });

const widgetCustomFields = {
  legacyId: { fieldType: "object", value: LegacyIdValueSchema },
  category: { fieldType: "string" },
} as const;

type WidgetTypes = {
  model: "Widget";
  sourceSchema: typeof SourceWidgetSchema;
  customFields: typeof widgetCustomFields;
};

// Hand-written transforms, typed via the helper types: `source` is inferred
// from `sourceSchema` and the return is checked against the resolved common.
const widgetToCommon: ToCommon<WidgetTypes> = (source) => ({
  result: {
    id: "123e4567-e89b-42d3-a456-426614174001",
    name: source.legacy_name,
    color: "red",
    weight: 1,
    customFields: {
      legacyId: {
        name: "legacyId",
        fieldType: "object",
        value: { system: "legacy", id: source.legacy_id },
      },
      category: { name: "category", fieldType: "string", value: "tools" },
    },
  },
  errors: [],
});

const widgetFromCommon: FromCommon<WidgetTypes> = (common) => ({
  result: {
    legacy_id: common.customFields?.legacyId?.value.id ?? 0,
    legacy_name: common.name,
  },
  errors: [],
});

const SourceGadgetSchema = z.object({
  gadget_uuid: z.string().uuid(),
  gadget_label: z.string(),
  gadget_size: z.number(),
  gadget_priority: z.number(),
});

const gadgetCustomFields = {
  priority: { fieldType: "integer", value: z.number().int() },
} as const;

const gadgetMappings = {
  toCommon: {
    id: { field: "gadget_uuid" },
    label: { field: "gadget_label" },
    size: { field: "gadget_size" },
    customFields: {
      priority: {
        value: { field: "gadget_priority" },
        name: "priority",
        fieldType: "integer",
      },
    },
  },
  fromCommon: {
    gadget_uuid: { field: "id" },
    gadget_label: { field: "label" },
    gadget_size: { field: "size" },
    gadget_priority: { field: "customFields.priority.value" },
  },
};

// ############################################################################
// Mock server (client round-trip tests)
// ############################################################################

const goodWidget = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  name: "Red Widget",
  color: "red",
  weight: 5,
  customFields: {
    legacyId: { name: "legacyId", fieldType: "object", value: { system: "old", id: 42 } },
    category: { name: "category", fieldType: "string", value: "tools" },
  },
};

const badWidget = {
  id: "not-a-uuid",
  name: "Broken",
  color: "red",
  weight: 1,
  customFields: null,
};

let lastSearchBody: unknown = undefined;

const server = setupServer(
  http.post("/widgets/search", async ({ request }) => {
    lastSearchBody = await request.json();
    return HttpResponse.json({
      status: 200,
      message: "ok",
      items: [goodWidget, badWidget],
      paginationInfo: { page: 1, pageSize: 2, totalItems: 2, totalPages: 1 },
      sortInfo: { sortBy: "id", sortOrder: "asc" },
      filterInfo: { filters: {} },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  lastSearchBody = undefined;
  server.resetHandlers();
});
afterAll(() => server.close());

// ############################################################################
// The plugin under test: Widget (functions path) + Gadget (mappings path)
// ############################################################################

const plugin = definePlugin({
  meta: { name: "demo", version: "0.0.1", sourceSystem: "legacy" },
  schemas: {
    Widget: {
      customFields: widgetCustomFields,
      sourceSchema: SourceWidgetSchema,
      toCommon: widgetToCommon,
      fromCommon: widgetFromCommon,
    },
    Gadget: {
      customFields: gadgetCustomFields,
      sourceSchema: SourceGadgetSchema,
      mappings: gadgetMappings,
    },
  },
  routes: {
    widgets: {
      search: {
        filters: {
          color: { filterType: "stringComparison" },
          weight: { filterType: "numberRange" },
        },
      },
    },
  },
});

describe("definePlugin — client round-trip", () => {
  it("(1) custom fields appear as typed properties on returned items", async () => {
    const client = plugin.getClient({ baseUrl: BASE_URL });

    const result = await client.widgets.search({ page: 1, filters: { color: f.eq("red") } });

    expect(result.items[0].ok).toBe(true);
    if (result.items[0].ok) {
      expect(result.items[0].data.customFields?.legacyId?.value).toEqual({ system: "old", id: 42 });
      expect(result.items[0].data.customFields?.category?.value).toBe("tools");
    }
  });

  it("(2) custom filters validate at call site (invalid operator rejected before fetch)", async () => {
    const client = plugin.getClient({ baseUrl: BASE_URL });

    await expect(
      client.widgets.search({
        page: 1,
        filters: {
          color: { operator: "in", value: "red" } as unknown as ReturnType<typeof f.eq<string>>,
        },
      })
    ).rejects.toThrow();

    await client.widgets.search({
      page: 1,
      filters: { color: f.eq("red"), weight: f.between(1, 10) },
    });
    expect(lastSearchBody).toMatchObject({
      filters: {
        color: { operator: "eq", value: "red" },
        weight: { operator: "between", value: { min: 1, max: 10 } },
      },
    });
  });

  it("(3) one bad record yields {ok:false, error:ParsingError}", async () => {
    const client = plugin.getClient({ baseUrl: BASE_URL });

    const result = await client.widgets.search({ page: 1 });

    expect(result.items).toHaveLength(2);
    expect(result.items[1].ok).toBe(false);
    if (!result.items[1].ok) {
      expect(result.items[1].error.name).toBe("ParsingError");
      expect(result.items[1].error.handler).toBe("widgets.search");
    }
  });
});

describe("definePlugin — transforms round trip", () => {
  it("(4) Widget (functions path) round-trips source -> common -> source", () => {
    const source = { legacy_id: 99, legacy_name: "Imported" };

    const toCommon = plugin.schemas.Widget.toCommon(source);
    expect(toCommon.errors).toEqual([]);
    expect(toCommon.result.name).toBe("Imported");
    expect(toCommon.result.customFields?.legacyId?.value).toEqual({ system: "legacy", id: 99 });

    const back = plugin.schemas.Widget.fromCommon(toCommon.result);
    expect(back.errors).toEqual([]);
    expect(back.result).toEqual(source);
  });

  it("(5) Gadget (mappings path) round-trips source -> common -> source", () => {
    const source = {
      gadget_uuid: "223e4567-e89b-42d3-a456-426614174002",
      gadget_label: "Gizmo",
      gadget_size: 10,
      gadget_priority: 3,
    };

    const toCommon = plugin.schemas.Gadget.toCommon(source);
    expect(toCommon.errors).toEqual([]);
    expect(toCommon.result.id).toBe(source.gadget_uuid);
    expect(toCommon.result.label).toBe("Gizmo");
    expect(toCommon.result.customFields?.priority?.value).toBe(3);

    const back = plugin.schemas.Gadget.fromCommon(toCommon.result);
    expect(back.errors).toEqual([]);
    expect(back.result).toEqual(source);
  });

  it("(6) both authoring paths resolve to the identical two-sided shape", () => {
    for (const entry of [plugin.schemas.Widget, plugin.schemas.Gadget]) {
      expect(typeof entry.toCommon).toBe("function");
      expect(typeof entry.fromCommon).toBe("function");
      expect(entry.commonSchema).toBeDefined();
      expect(entry.sourceSchema).toBeDefined();
    }
  });
});

describe("definePlugin — output validation merges into errors", () => {
  // Un-annotated inline functions: they still compile, and definePlugin's
  // wrapper still runtime-validates their output (decision D6). The casts feed
  // the wrapper runtime-invalid data the loose types do not catch.
  const looseValidation = definePlugin({
    meta: { name: "loose", version: "0.0.1" },
    schemas: {
      Widget: {
        customFields: widgetCustomFields,
        sourceSchema: SourceWidgetSchema,
        // `id` is type-valid (string) but not a UUID -> fails commonSchema.
        toCommon: () => ({
          result: { id: "not-a-uuid", name: "x", color: "red", weight: 1 },
          errors: [],
        }),
        // `legacy_id` is forced to a string -> fails sourceSchema.
        fromCommon: () => ({
          result: { legacy_id: "oops" as unknown as number, legacy_name: "x" },
          errors: [],
        }),
      },
    },
  });

  it("(7) reports commonSchema failures on the toCommon side with a path", () => {
    const result = looseValidation.schemas.Widget.toCommon({ legacy_id: 1, legacy_name: "x" });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.path === "id")).toBe(true);
  });

  it("(8) reports sourceSchema failures on the fromCommon side with a path", () => {
    const result = looseValidation.schemas.Widget.fromCommon({
      id: "123e4567-e89b-42d3-a456-426614174001",
      name: "x",
      color: "red",
      weight: 1,
    });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.path === "legacy_id")).toBe(true);
  });
});

describe("definePlugin — schema-only entry", () => {
  it("(9) resolves to a schema-only shape with no transform fields", () => {
    const schemaOnly = definePlugin({
      meta: { name: "schema-only", version: "0.0.1" },
      schemas: { Widget: { customFields: widgetCustomFields } },
    });
    expect(schemaOnly.schemas.Widget.commonSchema).toBeDefined();
    // @ts-expect-error toCommon is not present on a schema-only entry
    expect(schemaOnly.schemas.Widget.toCommon).toBeUndefined();
  });
});

// ############################################################################
// Type-level assertions (enforced by `tsc --noEmit` via check:types)
// ############################################################################

describe("definePlugin — type-level", () => {
  it("(10) resolved toCommon / fromCommon are two-sided typed per model", () => {
    // Consumer side: types resolve from each entry's source + customFields.
    const widgetCommon = plugin.schemas.Widget.toCommon({ legacy_id: 1, legacy_name: "x" }).result;
    const widgetLegacyId: number | undefined = widgetCommon.customFields?.legacyId?.value.id;
    const widgetSource: number = plugin.schemas.Widget.fromCommon(widgetCommon).result.legacy_id;

    const gadgetCommon = plugin.schemas.Gadget.toCommon({
      gadget_uuid: "223e4567-e89b-42d3-a456-426614174002",
      gadget_label: "Gizmo",
      gadget_size: 10,
      gadget_priority: 3,
    }).result;
    const gadgetSize: number = gadgetCommon.size;

    expect(widgetLegacyId).toBeDefined();
    expect(typeof widgetSource).toBe("number");
    expect(gadgetSize).toBe(10);
  });

  it("(11) the two models are not interchangeable", () => {
    const gadgetShaped = {
      gadget_uuid: "x",
      gadget_label: "y",
      gadget_size: 1,
      gadget_priority: 1,
    };
    // @ts-expect-error a Gadget source is not a valid Widget source
    plugin.schemas.Widget.toCommon(gadgetShaped);
    expect(true).toBe(true);
  });
});

// Never invoked — exists purely so `tsc` checks that supplying BOTH `mappings`
// and hand-written functions on one entry is a compile error (decision D5).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _xorViolation = () =>
  definePlugin({
    meta: { name: "xor", version: "0.0.1" },
    schemas: {
      Widget: {
        customFields: widgetCustomFields,
        sourceSchema: SourceWidgetSchema,
        mappings: gadgetMappings,
        // @ts-expect-error mappings XOR functions, not both
        toCommon: widgetToCommon,
        // @ts-expect-error mappings XOR functions, not both
        fromCommon: widgetFromCommon,
      },
    },
  });
