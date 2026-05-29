import { describe, expect, it } from "vitest";
import { expectZodMatchesJsonSchema } from "../../helper";
import { paginatedBodyParams, paginatedQueryParams, paginatedResultsInfo } from "@/schemas";

describe("paginatedQueryParams schema", () => {
  it("validates a minimal page request", () => {
    expect(() => paginatedQueryParams.parse({})).not.toThrow();
    expect(() => paginatedQueryParams.parse({ page: 1, pageSize: 100 })).not.toThrow();
  });

  it("rejects page < 1", () => {
    expect(() => paginatedQueryParams.parse({ page: 0 })).toThrow();
    expect(() => paginatedQueryParams.parse({ pageSize: 0 })).toThrow();
  });

  it("matches PaginatedQueryParams.yaml", async () => {
    await expectZodMatchesJsonSchema(paginatedQueryParams, "PaginatedQueryParams.yaml");
  });
});

describe("paginatedBodyParams schema", () => {
  it("matches PaginatedBodyParams.yaml", async () => {
    await expectZodMatchesJsonSchema(paginatedBodyParams, "PaginatedBodyParams.yaml");
  });
});

describe("paginatedResultsInfo schema", () => {
  it("validates a results-info value", () => {
    expect(() =>
      paginatedResultsInfo.parse({
        page: 1,
        pageSize: 20,
        totalItems: 100,
        totalPages: 5,
      })
    ).not.toThrow();
  });

  it("matches PaginatedResultsInfo.yaml", async () => {
    await expectZodMatchesJsonSchema(paginatedResultsInfo, "PaginatedResultsInfo.yaml");
  });
});
