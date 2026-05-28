import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Client } from "../../src/client/client";
import { Widgets } from "../../src/client/resources/widgets";
import { http, HttpResponse, setupServer } from "../utils/mock-fetch";

const BASE_URL = "https://api.example.org";

const goodWidget = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  name: "Widget A",
  color: "red",
  weight: 5,
  customFields: null,
};

const badWidget = {
  id: "not-a-uuid",
  name: "Broken",
  color: "blue",
  weight: 2,
  customFields: null,
};

const server = setupServer(
  http.get("/widgets/:id", () =>
    HttpResponse.json({ status: 200, message: "ok", data: goodWidget })
  ),
  http.post("/widgets/search", () =>
    HttpResponse.json({
      status: 200,
      message: "ok",
      items: [goodWidget, badWidget],
      paginationInfo: { page: 1, pageSize: 2, totalItems: 2, totalPages: 1 },
      sortInfo: { sortBy: "id", sortOrder: "asc" },
      filterInfo: { filters: {} },
    })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Widgets resource", () => {
  it("get() parses a single widget", async () => {
    const client = new Client({ baseUrl: BASE_URL });
    const widgets = new Widgets({ client });

    const widget = await widgets.get("123e4567-e89b-42d3-a456-426614174001");

    expect(widget.id).toBe(goodWidget.id);
    expect(widget.name).toBe(goodWidget.name);
  });

  it("search() returns ParsedItem[] and tolerates one bad record", async () => {
    const client = new Client({ baseUrl: BASE_URL });
    const widgets = new Widgets({ client });

    const result = await widgets.search({ page: 1 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].ok).toBe(true);
    if (result.items[0].ok) {
      expect(result.items[0].data.id).toBe(goodWidget.id);
    }

    expect(result.items[1].ok).toBe(false);
    if (!result.items[1].ok) {
      expect(result.items[1].error.handler).toBe("widgets.search");
      expect(result.items[1].error.path).toBe("items[1]");
    }
    expect(result.parseErrors).toHaveLength(1);
  });
});
