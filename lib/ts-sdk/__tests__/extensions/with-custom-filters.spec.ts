import { describe, expect, it } from "vitest";
import { withCustomFilters } from "../../src/extensions/with-custom-filters";

describe("withCustomFilters", () => {
  it("builds a Zod schema for each declared filter, made optional", () => {
    const Schema = withCustomFilters({
      color: { filterType: "stringComparison" },
      weight: { filterType: "numberRange" },
      tags: { filterType: "stringArray" },
    } as const);

    expect(() =>
      Schema.parse({
        color: { operator: "eq", value: "red" },
        weight: { operator: "between", value: { min: 1, max: 10 } },
        tags: { operator: "in", value: ["a", "b"] },
      })
    ).not.toThrow();

    expect(() => Schema.parse({})).not.toThrow();
    expect(() => Schema.parse({ color: { operator: "eq", value: "blue" } })).not.toThrow();
  });

  it("rejects a filter value that does not match its declared filterType", () => {
    const Schema = withCustomFilters({
      color: { filterType: "stringComparison" },
    } as const);

    expect(() => Schema.parse({ color: { operator: "in", value: "red" } })).toThrow();
    expect(() => Schema.parse({ color: { operator: "eq", value: 5 } })).toThrow();
  });

  it("throws on unknown filterType during schema construction", () => {
    expect(() =>
      withCustomFilters({
        color: { filterType: "unknownType" as unknown as "stringComparison" },
      })
    ).toThrow(/unknown filterType/);
  });
});
