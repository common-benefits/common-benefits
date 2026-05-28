/**
 * Round-trip integration test: declare a plugin with custom fields, custom
 * filters, and a source schema; call `plugin.getClient(config).widgets.search`
 * against a stubbed fetch; assert:
 *
 *   1. Custom fields appear as typed properties on returned items (no manual
 *      `schema:` passed at the call site).
 *   2. Custom filters validate at the call site (invalid operator rejected
 *      before fetch).
 *   3. One bad record yields a `{ ok: false, error: ParsingError }` slot.
 *   4. `plugin.schemas.Widget.toCommon` / `.fromCommon` are exposed as
 *      callable functions (stored, not invoked by the SDK).
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { definePlugin } from "../../src/extensions/define-plugin";
import { f } from "../../src/extensions/filter-helpers";
import { http, HttpResponse, setupServer } from "../utils/mock-fetch";

const BASE_URL = "https://api.example.org";

const goodWidget = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  name: "Red Widget",
  color: "red",
  weight: 5,
  customFields: {
    legacyId: {
      name: "legacyId",
      fieldType: "object",
      value: { system: "old", id: 42 },
    },
    category: {
      name: "category",
      fieldType: "string",
      value: "tools",
    },
  },
};

const badWidget = {
  id: "not-a-uuid",
  name: "Broken",
  color: "red",
  weight: 1,
  customFields: null,
};

const LegacyIdValueSchema = z.object({ system: z.string(), id: z.number() });

// Per-test request capture so we can assert the filters round-trip.
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

describe("definePlugin round-trip", () => {
  const SourceWidgetSchema = z.object({
    legacy_id: z.number(),
    legacy_name: z.string(),
  });

  const plugin = definePlugin({
    meta: { name: "demo", version: "0.0.1", sourceSystem: "legacy" },
    schemas: {
      Widget: {
        customFields: {
          legacyId: { fieldType: "object", value: LegacyIdValueSchema },
          category: { fieldType: "string" },
        },
        sourceSchema: SourceWidgetSchema,
        toCommon: (source: unknown) => {
          const s = source as z.infer<typeof SourceWidgetSchema>;
          return {
            id: "123e4567-e89b-42d3-a456-426614174001",
            name: s.legacy_name,
            color: "red",
            weight: 1,
            customFields: {
              legacyId: {
                name: "legacyId",
                fieldType: "object",
                value: { system: "legacy", id: s.legacy_id },
              },
            },
          };
        },
        fromCommon: () => ({ legacy_id: 0, legacy_name: "" }),
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
  } as const);

  it("(1) custom fields appear as typed properties on returned items", async () => {
    const client = plugin.getClient({ baseUrl: BASE_URL });

    const result = await client.widgets.search({
      page: 1,
      filters: { color: f.eq("red") },
    });

    expect(result.items[0].ok).toBe(true);
    if (result.items[0].ok) {
      const legacyId = result.items[0].data.customFields?.legacyId?.value;
      expect(legacyId).toEqual({ system: "old", id: 42 });
      const category = result.items[0].data.customFields?.category?.value;
      expect(category).toBe("tools");
    }
  });

  it("(2) custom filters validate at call site (invalid operator rejected before fetch)", async () => {
    const client = plugin.getClient({ baseUrl: BASE_URL });

    await expect(
      client.widgets.search({
        page: 1,
        // `in` is not a valid operator for stringComparison
        filters: {
          color: { operator: "in", value: "red" } as unknown as ReturnType<typeof f.eq<string>>,
        },
      })
    ).rejects.toThrow();

    // Sanity: a valid filter still passes through, and the request body
    // contains the filter we sent.
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

  it("(4) plugin.schemas.Widget.toCommon / .fromCommon are stored as callable functions", () => {
    expect(typeof plugin.schemas.Widget.toCommon).toBe("function");
    expect(typeof plugin.schemas.Widget.fromCommon).toBe("function");

    const sampleSource = { legacy_id: 99, legacy_name: "Imported" };
    const asCommon = plugin.schemas.Widget.toCommon!(sampleSource) as {
      name: string;
      customFields: { legacyId: { value: { id: number } } };
    };
    expect(asCommon.name).toBe("Imported");
    expect(asCommon.customFields.legacyId.value.id).toBe(99);
  });
});
