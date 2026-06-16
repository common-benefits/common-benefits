/**
 * End-to-end plugin demo for `@common-benefits/sdk`.
 *
 * Run from `lib/ts-sdk`:
 *
 *   pnpm dlx tsx examples/plugin-demo.ts
 *
 * Stubs `globalThis.fetch` so it runs offline — no API needed.
 *
 * What this demonstrates:
 *
 *   1. `definePlugin()` bundles schema extensions (custom fields), route
 *      declarations (custom filters), and source-system transforms.
 *   2. `plugin.getClient(config)` returns a `Client` with typed resources
 *      already wired up — no manual `schema:` passthrough at the call site.
 *   3. The `f.*` filter helpers turn `{ operator, value }` literals into
 *      readable call-site code.
 *   4. Per-record parse failures surface as `ParsedItem` slots so one bad
 *      row doesn't fail the whole search response.
 *   5. `plugin.schemas.Widget.toCommon` / `.fromCommon` are stored on the
 *      plugin for adopters to invoke at their own integration boundary.
 */

import { z } from "zod";
import { definePlugin, f } from "../src";

// ----------------------------------------------------------------------------
// 1. Declare a plugin
// ----------------------------------------------------------------------------

// (a) A custom-field value schema — typed access lives on `item.customFields.legacyId.value.id`.
const LegacyIdValueSchema = z.object({
  system: z.string(),
  id: z.number(),
});

// (b) A source-system schema — e.g. the shape an upstream legacy API actually returns.
const LegacyWidgetSchema = z.object({
  legacy_id: z.number(),
  legacy_name: z.string(),
  legacy_color: z.string(),
});

const widgetsPlugin = definePlugin({
  meta: { name: "demo-plugin", version: "0.0.1", sourceSystem: "legacy" },

  schemas: {
    Widget: {
      // Custom fields → typed `customFields` slot on returned items.
      customFields: {
        legacyId: { fieldType: "object", value: LegacyIdValueSchema },
        category: { fieldType: "string" },
      },

      // Source-system schema + transforms. The SDK stores these on
      // `plugin.schemas.Widget` but does NOT invoke them automatically —
      // adopters call them at the integration boundary they own.
      sourceSchema: LegacyWidgetSchema,
      toCommon: (source: unknown) => {
        const s = source as z.infer<typeof LegacyWidgetSchema>;
        return {
          result: {
            id: "123e4567-e89b-42d3-a456-426614174001",
            name: s.legacy_name,
            color: s.legacy_color,
            weight: 1,
            customFields: {
              legacyId: {
                name: "legacyId",
                fieldType: "object",
                value: { system: "legacy", id: s.legacy_id },
              },
            },
          },
          errors: [],
        };
      },
      fromCommon: () => ({
        result: { legacy_id: 0, legacy_name: "", legacy_color: "" },
        errors: [],
      }),
    },
  },

  routes: {
    widgets: {
      search: {
        // Custom filters → typed, validated `search({ filters })` bag.
        filters: {
          color: { filterType: "stringComparison" },
          weight: { filterType: "numberRange" },
          tags: { filterType: "stringArray" },
        },
      },
    },
  },
});

// ----------------------------------------------------------------------------
// 2. Stub fetch so the demo runs offline
// ----------------------------------------------------------------------------

const goodWidget = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  name: "Red Widget",
  color: "red",
  weight: 5,
  customFields: {
    legacyId: {
      name: "legacyId",
      fieldType: "object",
      value: { system: "legacy", id: 42 },
    },
    category: {
      name: "category",
      fieldType: "string",
      value: "tools",
    },
  },
};

// Intentionally malformed — `id` isn't a valid UUID. This row should surface
// as `{ ok: false, error: ParsingError }` while the rest of the page parses.
const badWidget = {
  id: "not-a-uuid",
  name: "Broken Widget",
  color: "blue",
  weight: 2,
  customFields: null,
};

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? "GET").toUpperCase();
  if (url.endsWith("/widgets/search") && method === "POST") {
    return new Response(
      JSON.stringify({
        status: 200,
        message: "ok",
        items: [goodWidget, badWidget],
        paginationInfo: { page: 1, pageSize: 2, totalItems: 2, totalPages: 1 },
        sortInfo: { sortBy: "id", sortOrder: "asc" },
        filterInfo: { filters: {} },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify({ error: "no handler", url, method }), { status: 404 });
}) as typeof fetch;

// ----------------------------------------------------------------------------
// 3. Build a client and call .widgets.search()
// ----------------------------------------------------------------------------

async function main() {
  const client = widgetsPlugin.getClient({ baseUrl: "https://api.example.org" });

  // Filter helpers (`f.eq`, `f.between`, `f.in`, ...) turn `{operator, value}`
  // literals into readable call-site code. The route's filter schema (built
  // from the plugin's filter spec) validates this bag before any HTTP traffic.
  const result = await client.widgets.search({
    page: 1,
    filters: {
      color: f.eq("red"),
      weight: f.between(1, 100),
      tags: f.in(["new", "featured"]),
    },
  });

  console.log("─── Search returned", result.items.length, "row(s) ───");

  // Per-row parse results. `ok: true` rows have `.data` typed against the
  // extended schema (custom fields appear as typed properties). `ok: false`
  // rows expose the `ParsingError` without taking down the whole response.
  for (const item of result.items) {
    if (item.ok) {
      console.log("  ✔ parsed:", {
        id: item.data.id,
        name: item.data.name,
        legacyId: item.data.customFields?.legacyId?.value, // typed: { system, id }
        category: item.data.customFields?.category?.value, // typed: string
      });
    } else {
      console.log("  ✘ parse error:", {
        path: item.error.path,
        handler: item.error.handler,
        rawId: (item.raw as { id?: unknown }).id,
      });
    }
  }

  if (result.parseErrors.length > 0) {
    console.log("  ↳ aggregated parse errors:", result.parseErrors.length);
  }

  // ----------------------------------------------------------------------------
  // 4. The plugin's transforms are stored — invoke them yourself at the
  //    integration boundary.
  // ----------------------------------------------------------------------------

  console.log("\n─── Source-system transforms ───");
  const sampleSource = { legacy_id: 99, legacy_name: "Imported", legacy_color: "green" };
  const asCommon = widgetsPlugin.schemas.Widget.toCommon(sampleSource);
  console.log("  toCommon(sampleSource):", asCommon.result, "errors:", asCommon.errors.length);

  // ----------------------------------------------------------------------------
  // 5. Filter validation catches malformed inputs before the request.
  // ----------------------------------------------------------------------------

  console.log("\n─── Filter validation (call-site) ───");
  try {
    await client.widgets.search({
      page: 1,
      // `in` is not a valid operator for `stringComparison` — Zod rejects this
      // before any fetch is sent.
      filters: { color: { operator: "in", value: "red" } } as never,
    });
  } catch (err) {
    console.log("  ✔ invalid filter rejected before fetch:", (err as Error).message.split("\n")[0]);
  }
}

main().catch((err) => {
  console.error("demo failed:", err);
  process.exit(1);
});
