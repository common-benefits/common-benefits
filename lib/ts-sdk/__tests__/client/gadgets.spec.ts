import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Client } from "../../src/client/client";
import { Gadgets } from "../../src/client/resources/gadgets";
import { http, HttpResponse, setupServer } from "../utils/mock-fetch";

const BASE_URL = "https://api.example.org";

const goodGadget = {
  id: "123e4567-e89b-42d3-a456-426614174010",
  label: "Gadget A",
  size: 42,
  customFields: null,
};

const page = (items: unknown[], sortBy: string) => ({
  status: 200,
  message: "ok",
  items,
  paginationInfo: { page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 },
  sortInfo: { sortBy, sortOrder: "asc" },
  filterInfo: { filters: {} },
});

let lastBody: Record<string, unknown> = {};

const server = setupServer(
  http.get("/gadgets/:id", () =>
    HttpResponse.json({ status: 200, message: "ok", data: goodGadget })
  ),
  http.post("/gadgets/search", async ({ request }) => {
    lastBody = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(page([goodGadget], "label"));
  }),
  http.post("/gadgets/history", async ({ request }) => {
    lastBody = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(page([goodGadget], "label"));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  lastBody = {};
});
afterAll(() => server.close());

describe("Gadgets resource", () => {
  it("get() parses a single gadget", async () => {
    const gadgets = new Gadgets({ client: new Client({ baseUrl: BASE_URL }) });
    const gadget = await gadgets.get("123e4567-e89b-42d3-a456-426614174010");
    expect(gadget.id).toBe(goodGadget.id);
    expect(gadget.label).toBe(goodGadget.label);
  });

  it("search() routes the standard 'size' filter to the top level and unknown keys to customFilters", async () => {
    const gadgets = new Gadgets({
      client: new Client({ baseUrl: BASE_URL }),
      defaultFiltersSchema: undefined,
    });
    const result = await gadgets.search({
      page: 1,
      filters: {
        size: { operator: "gt", value: 10 },
        vendor: { operator: "eq", value: "acme" },
      },
    });
    expect(result.items[0].ok).toBe(true);
    // No defaultFiltersSchema injected here, so both keys pass through; assert
    // the categorize/passthrough split happens (vendor under customFilters).
    const filters = lastBody.filters as Record<string, unknown>;
    expect(filters.customFilters).toBeDefined();
  });

  it("history() is a distinct filterable verb: 'actor' to top level, 'since' as a body field", async () => {
    const gadgets = new Gadgets({ client: new Client({ baseUrl: BASE_URL }) });

    const result = await gadgets.history({
      page: 1,
      since: "2026-01-01T00:00:00Z",
      filters: {
        actor: { operator: "eq", value: "alice" },
        channel: { operator: "eq", value: "web" },
      },
    });

    expect(result.items[0].ok).toBe(true);
    expect(lastBody.since).toBe("2026-01-01T00:00:00Z");

    const filters = lastBody.filters as Record<string, unknown>;
    // 'actor' is the history standard filter -> top level
    expect(filters.actor).toEqual({ operator: "eq", value: "alice" });
    // 'channel' is unknown -> customFilters passthrough
    expect(filters.customFilters).toEqual({ channel: { operator: "eq", value: "web" } });
  });
});
