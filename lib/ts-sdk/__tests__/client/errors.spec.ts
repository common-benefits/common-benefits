import { describe, expect, it } from "vitest";
import { ParsingError, isParsingError } from "../../src/client/errors";

describe("ParsingError", () => {
  it("carries path / handler / sourceValue / cause", () => {
    const cause = new Error("zod failure");
    const err = new ParsingError("bad item", {
      path: "items[3].customFields.legacyId",
      handler: "widgets.search",
      sourceValue: { legacyId: "not-a-number" },
      cause,
    });

    expect(err.message).toBe("bad item");
    expect(err.path).toBe("items[3].customFields.legacyId");
    expect(err.handler).toBe("widgets.search");
    expect(err.sourceValue).toEqual({ legacyId: "not-a-number" });
    expect(err.cause).toBe(cause);
  });

  it("isParsingError narrows correctly", () => {
    expect(isParsingError(new ParsingError("x"))).toBe(true);
    expect(isParsingError(new Error("x"))).toBe(false);
    expect(isParsingError(null)).toBe(false);
  });
});
