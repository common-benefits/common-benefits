import { describe, expect, it } from "vitest";
import { f } from "../../src/extensions/filter-helpers";
import {
  NumberRangeFilterSchema,
  StringArrayFilterSchema,
  StringComparisonFilterSchema,
} from "../../src/schemas/filters";

describe("f.* filter helpers", () => {
  it("eq/neq produce the right literal shape", () => {
    expect(f.eq("red")).toEqual({ operator: "eq", value: "red" });
    expect(f.neq(5)).toEqual({ operator: "neq", value: 5 });
  });

  it("lt/lte/gt/gte produce the right literal shape", () => {
    expect(f.lt(10)).toEqual({ operator: "lt", value: 10 });
    expect(f.lte(10)).toEqual({ operator: "lte", value: 10 });
    expect(f.gt(0)).toEqual({ operator: "gt", value: 0 });
    expect(f.gte(0)).toEqual({ operator: "gte", value: 0 });
  });

  it("in/notIn wrap an array", () => {
    expect(f.in(["a", "b"])).toEqual({ operator: "in", value: ["a", "b"] });
    expect(f.notIn([1, 2])).toEqual({ operator: "notIn", value: [1, 2] });
  });

  it("like/notLike take a string", () => {
    expect(f.like("%red%")).toEqual({ operator: "like", value: "%red%" });
    expect(f.notLike("x")).toEqual({ operator: "notLike", value: "x" });
  });

  it("between/outside wrap min/max", () => {
    expect(f.between(1, 10)).toEqual({ operator: "between", value: { min: 1, max: 10 } });
    expect(f.outside(0, 5)).toEqual({ operator: "outside", value: { min: 0, max: 5 } });
  });

  it("round-trips through StringComparisonFilterSchema", () => {
    expect(() => StringComparisonFilterSchema.parse(f.eq("red"))).not.toThrow();
    expect(() => StringComparisonFilterSchema.parse(f.like("%red%"))).not.toThrow();
  });

  it("round-trips through NumberRangeFilterSchema", () => {
    expect(() => NumberRangeFilterSchema.parse(f.between(1, 10))).not.toThrow();
  });

  it("round-trips through StringArrayFilterSchema", () => {
    expect(() => StringArrayFilterSchema.parse(f.in(["a", "b"]))).not.toThrow();
  });
});
