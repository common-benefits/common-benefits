/**
 * Unit tests for the pure mapping runtime (`src/utils/transformation.ts`).
 *
 * Covers: each built-in handler, three-state null handling, the depth guard,
 * sibling-key leniency at the walker level, and `getFromPath` edge cases. This
 * module has no Zod dependency, so neither do these tests.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_HANDLERS,
  HandlerError,
  getFromPath,
  transformWithMapping,
  type Handler,
} from "../../src/utils/transformation";

describe("getFromPath", () => {
  it("walks nested dot paths", () => {
    expect(getFromPath({ a: { b: 1 } }, "a.b")).toBe(1);
  });

  it("returns the default when a step is absent", () => {
    expect(getFromPath({ a: { b: 1 } }, "a.c")).toBeUndefined();
    expect(getFromPath({ a: { b: 1 } }, "a.c", "fallback")).toBe("fallback");
  });

  it("preserves a terminal null", () => {
    expect(getFromPath({ a: null }, "a")).toBeNull();
  });

  it("short-circuits an intermediate null to the default", () => {
    expect(getFromPath({ a: null }, "a.b")).toBeUndefined();
  });

  it("returns the whole input for an empty path", () => {
    const data = { a: 1 };
    expect(getFromPath(data, "")).toBe(data);
  });
});

describe("transformWithMapping — built-in handlers", () => {
  it("field plucks by dot path", () => {
    expect(transformWithMapping({ x: { y: 7 } }, { out: { field: "x.y" } })).toEqual({ out: 7 });
  });

  it("const returns a literal, ignoring source", () => {
    expect(transformWithMapping({ x: 1 }, { out: { const: "fixed" } })).toEqual({ out: "fixed" });
  });

  it("match maps a recognized case", () => {
    const mapping = {
      out: { match: { field: "status", case: { posted: "open" }, default: "custom" } },
    };
    expect(transformWithMapping({ status: "posted" }, mapping)).toEqual({ out: "open" });
  });

  it("match falls back to default for an unrecognized value", () => {
    const mapping = {
      out: { match: { field: "status", case: { posted: "open" }, default: "custom" } },
    };
    expect(transformWithMapping({ status: "archived" }, mapping)).toEqual({ out: "custom" });
  });

  it("match passes null through unless a null case key opts in", () => {
    const passthrough = { out: { match: { field: "status", case: { posted: "open" } } } };
    expect(transformWithMapping({ status: null }, passthrough)).toEqual({ out: null });

    const opted = { out: { match: { field: "status", case: { null: "n/a" } } } };
    expect(transformWithMapping({ status: null }, opted)).toEqual({ out: "n/a" });
  });

  it("switch is an alias of match", () => {
    expect(DEFAULT_HANDLERS.get("switch")).toBe(DEFAULT_HANDLERS.get("match"));
  });

  it("numberToString coerces values but preserves the three states", () => {
    expect(transformWithMapping({ n: 5 }, { out: { numberToString: "n" } })).toEqual({ out: "5" });
    expect(transformWithMapping({ n: null }, { out: { numberToString: "n" } })).toEqual({
      out: null,
    });
    // absent => undefined => key omitted
    expect(transformWithMapping({}, { out: { numberToString: "n" } })).toEqual({});
  });

  it("stringToNumber parses integers and floats", () => {
    expect(transformWithMapping({ s: "42" }, { out: { stringToNumber: "s" } })).toEqual({
      out: 42,
    });
    expect(transformWithMapping({ s: "3.5" }, { out: { stringToNumber: "s" } })).toEqual({
      out: 3.5,
    });
  });

  it("stringToNumber preserves null and absent", () => {
    expect(transformWithMapping({ s: null }, { out: { stringToNumber: "s" } })).toEqual({
      out: null,
    });
    expect(transformWithMapping({}, { out: { stringToNumber: "s" } })).toEqual({});
  });

  it("stringToNumber throws on empty and non-numeric strings", () => {
    expect(() => transformWithMapping({ s: "" }, { out: { stringToNumber: "s" } })).toThrow(
      HandlerError
    );
    expect(() => transformWithMapping({ s: "abc" }, { out: { stringToNumber: "s" } })).toThrow(
      HandlerError
    );
  });

  it("wraps handler exceptions as HandlerError carrying the handler name", () => {
    try {
      transformWithMapping({ s: "abc" }, { out: { stringToNumber: "s" } });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HandlerError);
      expect((err as HandlerError).handler).toBe("stringToNumber");
    }
  });
});

describe("transformWithMapping — output shape & three-state null", () => {
  it("builds nested output shapes and literals", () => {
    const result = transformWithMapping(
      { opportunity_status: "posted", opportunity_amount: 1000 },
      {
        status: { field: "opportunity_status" },
        amount: { value: { field: "opportunity_amount" }, currency: "USD" },
      }
    );
    expect(result).toEqual({ status: "posted", amount: { value: 1000, currency: "USD" } });
  });

  it("omits keys whose child transforms to undefined (absent) but keeps null (doesn't apply)", () => {
    const result = transformWithMapping(
      { present: 1, applies: null },
      {
        present: { field: "present" },
        missing: { field: "not_there" },
        applies: { field: "applies" },
      }
    );
    expect(result).toEqual({ present: 1, applies: null });
    expect(Object.keys(result as object)).not.toContain("missing");
  });
});

describe("transformWithMapping — leniency & guards", () => {
  it("is first-key-wins at the walker level (sibling keys ignored)", () => {
    // The low-level walker reads only the first key; `const` sibling is dropped.
    const result = transformWithMapping({ x: "real" }, { out: { field: "x", const: "ignored" } });
    expect(result).toEqual({ out: "real" });
  });

  it("throws once the mapping nests past maxDepth", () => {
    // Build a mapping nested deeper than the (lowered) maxDepth.
    let nested: Record<string, unknown> = { field: "x" };
    for (let i = 0; i < 6; i++) nested = { child: nested };
    expect(() => transformWithMapping({ x: 1 }, nested, { maxDepth: 3 })).toThrow(
      /Maximum transformation depth/
    );
  });

  it("honors a custom handler registry", () => {
    const handlers = new Map<string, Handler>([["upper", (_d, arg) => String(arg).toUpperCase()]]);
    const result = transformWithMapping({}, { out: { upper: "hi" } }, { handlers });
    expect(result).toEqual({ out: "HI" });
  });
});
