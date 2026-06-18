/**
 * Scenario 5 - custom fields + a registered custom filter.
 *
 * AUTHOR: register a custom filter on the widgets search route via `routes`.
 * CONSUMER: get a typed client and call `widgets.search({ filters })`: the standard `color`
 * key routes to the top level, the registered `region` and an ad hoc `tier` pass through to
 * `customFilters`, and rows are typed as the plugin's Widget model.
 *
 * Stubs `globalThis.fetch` so it runs offline.
 * Run: `pnpm dlx tsx examples/custom-filters.ts` (or `pnpm run examples` for all scenarios).
 */

import { definePlugin, f } from "../src";
import { check, widgetCustomFields } from "./source";

// --- Author -----------------------------------------------------------------------------
export const routesPlugin = definePlugin({
  meta: { name: "widget routes plugin", version: "0.1.0", sourceSystem: "acme-widgets" },
  schemas: { Widget: { customFields: widgetCustomFields } },
  routes: {
    widgets: {
      // `color` is a protocol DEFAULT filter (not declared here); `region` is the custom
      // filter this plugin registers. Both registered and ad hoc keys nest under
      // `customFilters` in the request body.
      search: { filters: { region: { filterType: "stringArray" } } },
    },
  },
});

// --- Consumer ---------------------------------------------------------------------------
let lastSearchBody: unknown;

function stubFetch(): void {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith("/widgets/search")) {
      lastSearchBody = init?.body ? JSON.parse(String(init.body)) : undefined;
    }
    return new Response(
      JSON.stringify({
        status: 200,
        message: "ok",
        items: [
          { id: "123e4567-e89b-42d3-a456-426614174001", name: "Red", color: "red", weight: 5 },
        ],
        paginationInfo: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
        sortInfo: { sortBy: "id", sortOrder: "asc" },
        filterInfo: { filters: {} },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;
}

export async function demo(): Promise<void> {
  console.log("Scenario 5 - custom fields + a registered custom filter");
  stubFetch();

  const client = routesPlugin.getClient({ baseUrl: "https://api.example.org" });
  const result = await client.widgets.search({
    page: 1,
    filters: {
      color: f.eq("red"), // standard -> top level
      region: f.in(["PA", "NJ"]), // registered custom -> customFilters
      tier: f.eq("gold"), // ad hoc -> customFilters (passthrough)
    },
  });
  // Rows are typed as the plugin's Widget model, no call-site annotations.
  const firstName: string | undefined = result.items[0]?.ok ? result.items[0].data.name : undefined;
  check("search returned a typed row", firstName === "Red");

  const filters = (lastSearchBody as { filters?: Record<string, unknown> })?.filters ?? {};
  const customFilters = (filters.customFilters as Record<string, unknown>) ?? {};
  check("standard color routed to the top level", "color" in filters && !("region" in filters));
  check(
    "region (registered) + tier (ad hoc) -> customFilters",
    "region" in customFilters && "tier" in customFilters
  );
}

demo().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
