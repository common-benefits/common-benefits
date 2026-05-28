/**
 * Spot-checks each per-type filter schema accepts its valid `{operator, value}`
 * pairs and rejects mismatched ones.
 */

import { describe, expect, it } from "vitest";
import {
  DateComparisonFilterSchema,
  DateRangeFilterSchema,
  MoneyComparisonFilterSchema,
  MoneyRangeFilterSchema,
  NumberArrayFilterSchema,
  NumberComparisonFilterSchema,
  NumberRangeFilterSchema,
  StringArrayFilterSchema,
  StringComparisonFilterSchema,
} from "../../src/schemas/filters";

describe("filter schemas", () => {
  describe("StringComparisonFilterSchema", () => {
    it("accepts eq", () => {
      expect(() =>
        StringComparisonFilterSchema.parse({ operator: "eq", value: "red" })
      ).not.toThrow();
    });
    it("accepts like", () => {
      expect(() =>
        StringComparisonFilterSchema.parse({ operator: "like", value: "%red%" })
      ).not.toThrow();
    });
    it("rejects in", () => {
      expect(() => StringComparisonFilterSchema.parse({ operator: "in", value: "red" })).toThrow();
    });
    it("rejects array value", () => {
      expect(() =>
        StringComparisonFilterSchema.parse({ operator: "eq", value: ["red"] })
      ).toThrow();
    });
  });

  describe("StringArrayFilterSchema", () => {
    it("accepts in with string[]", () => {
      expect(() =>
        StringArrayFilterSchema.parse({ operator: "in", value: ["red", "blue"] })
      ).not.toThrow();
    });
    it("rejects eq", () => {
      expect(() => StringArrayFilterSchema.parse({ operator: "eq", value: ["red"] })).toThrow();
    });
  });

  describe("NumberComparisonFilterSchema", () => {
    it("accepts lt", () => {
      expect(() => NumberComparisonFilterSchema.parse({ operator: "lt", value: 10 })).not.toThrow();
    });
    it("rejects string value", () => {
      expect(() => NumberComparisonFilterSchema.parse({ operator: "lt", value: "10" })).toThrow();
    });
  });

  describe("NumberRangeFilterSchema", () => {
    it("accepts between with {min,max}", () => {
      expect(() =>
        NumberRangeFilterSchema.parse({ operator: "between", value: { min: 1, max: 10 } })
      ).not.toThrow();
    });
    it("rejects flat value", () => {
      expect(() => NumberRangeFilterSchema.parse({ operator: "between", value: 5 })).toThrow();
    });
  });

  describe("NumberArrayFilterSchema", () => {
    it("accepts in with number[]", () => {
      expect(() =>
        NumberArrayFilterSchema.parse({ operator: "in", value: [1, 2, 3] })
      ).not.toThrow();
    });
    it("rejects string[]", () => {
      expect(() => NumberArrayFilterSchema.parse({ operator: "in", value: ["1"] })).toThrow();
    });
  });

  describe("DateComparisonFilterSchema", () => {
    it("accepts ISO date", () => {
      expect(() =>
        DateComparisonFilterSchema.parse({ operator: "gt", value: "2026-01-01" })
      ).not.toThrow();
    });
    it("accepts ISO datetime", () => {
      expect(() =>
        DateComparisonFilterSchema.parse({ operator: "gt", value: "2026-01-01T00:00:00Z" })
      ).not.toThrow();
    });
    it("rejects non-date string", () => {
      expect(() =>
        DateComparisonFilterSchema.parse({ operator: "gt", value: "not-a-date" })
      ).toThrow();
    });
  });

  describe("DateRangeFilterSchema", () => {
    it("accepts between", () => {
      expect(() =>
        DateRangeFilterSchema.parse({
          operator: "between",
          value: { min: "2026-01-01", max: "2026-12-31" },
        })
      ).not.toThrow();
    });
  });

  describe("MoneyComparisonFilterSchema", () => {
    it("accepts gt with Money", () => {
      expect(() =>
        MoneyComparisonFilterSchema.parse({
          operator: "gt",
          value: { amount: "100.00", currency: "USD" },
        })
      ).not.toThrow();
    });
    it("rejects bare number", () => {
      expect(() => MoneyComparisonFilterSchema.parse({ operator: "gt", value: 100 })).toThrow();
    });
  });

  describe("MoneyRangeFilterSchema", () => {
    it("accepts between with two Money values", () => {
      expect(() =>
        MoneyRangeFilterSchema.parse({
          operator: "between",
          value: {
            min: { amount: "0", currency: "USD" },
            max: { amount: "100.00", currency: "USD" },
          },
        })
      ).not.toThrow();
    });
  });
});
