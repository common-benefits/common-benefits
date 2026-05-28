import { describe, expect, it } from "vitest";
import { expectZodMatchesJsonSchema } from "../../helper";
import { sortOrder } from "@/schemas";

describe("sortOrder schema", () => {
  it("accepts asc and desc", () => {
    expect(sortOrder.parse("asc")).toBe("asc");
    expect(sortOrder.parse("desc")).toBe("desc");
  });

  it("rejects other values", () => {
    expect(() => sortOrder.parse("ascending")).toThrow();
  });

  it("matches SortOrder.yaml", async () => {
    await expectZodMatchesJsonSchema(sortOrder, "SortOrder.yaml");
  });
});
