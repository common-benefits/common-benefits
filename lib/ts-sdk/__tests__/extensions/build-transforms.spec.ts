/**
 * Unit tests for the `@internal buildTransforms` mapping compiler.
 *
 * Covers: raw round-trip compilation, handler-throw -> single `TransformError`,
 * build-time structural validation (sibling keys), build-time output-path
 * validation for BOTH directions, and custom-handler collision detection.
 * Runtime Zod output validation is NOT done here — that lives in `definePlugin`.
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildTransforms } from "../../src/extensions/build-transforms";
import { TransformError } from "../../src/extensions/transform-types";
import { getFromPath, type Handler } from "../../src/utils/transformation";

describe("buildTransforms — compilation", () => {
  it("compiles a raw bidirectional round trip with no errors", () => {
    const { toCommon, fromCommon } = buildTransforms({
      mappings: {
        toCommon: { id: { field: "uid" }, label: { field: "name" } },
        fromCommon: { uid: { field: "id" }, name: { field: "label" } },
      },
    });

    const forward = toCommon({ uid: "u1", name: "Foo" });
    expect(forward.errors).toEqual([]);
    expect(forward.result).toEqual({ id: "u1", label: "Foo" });

    const back = fromCommon(forward.result);
    expect(back.errors).toEqual([]);
    expect(back.result).toEqual({ uid: "u1", name: "Foo" });
  });

  it("registers custom handlers for this call", () => {
    const join: Handler = (data, spec) => {
      const s = (spec ?? {}) as { fields?: string[]; sep?: string };
      return (s.fields ?? []).map((p) => getFromPath(data, p)).join(s.sep ?? " ");
    };
    const { toCommon } = buildTransforms({
      mappings: {
        toCommon: { label: { join: { fields: ["a", "b"], sep: "-" } } },
        fromCommon: {},
      },
      handlers: new Map([["join", join]]),
    });
    expect(toCommon({ a: "x", b: "y" }).result).toEqual({ label: "x-y" });
  });
});

describe("buildTransforms — handler failures", () => {
  it("wraps a handler throw into a single TransformError with the handler name", () => {
    const { toCommon } = buildTransforms({
      mappings: { toCommon: { n: { stringToNumber: "s" } }, fromCommon: {} },
    });
    const result = toCommon({ s: "not-a-number" });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(TransformError);
    expect(result.errors[0].handler).toBe("stringToNumber");
  });
});

describe("buildTransforms — build-time validation", () => {
  it("throws on sibling keys at a handler-dispatch node", () => {
    expect(() =>
      buildTransforms({
        mappings: { toCommon: { out: { field: "x", const: "y" } }, fromCommon: {} },
      })
    ).toThrow(/sibling keys/);
  });

  it("throws on an unknown top-level output field for the common schema (toCommon)", () => {
    expect(() =>
      buildTransforms({
        mappings: {
          toCommon: { id: { field: "x" }, bogus: { field: "y" } },
          fromCommon: {},
        },
        commonSchema: z.object({ id: z.string() }),
      })
    ).toThrow(/toCommon.*unknown output fields/s);
  });

  it("throws on an unknown top-level output field for the source schema (fromCommon)", () => {
    expect(() =>
      buildTransforms({
        mappings: {
          toCommon: {},
          fromCommon: { uid: { field: "id" }, bogus: { field: "z" } },
        },
        sourceSchema: z.object({ uid: z.string() }),
      })
    ).toThrow(/fromCommon.*unknown output fields/s);
  });

  it("throws a TypeError when a custom handler name collides with a default", () => {
    expect(() =>
      buildTransforms({
        mappings: { toCommon: {}, fromCommon: {} },
        handlers: new Map([["field", () => 1]]),
      })
    ).toThrow(TypeError);
  });
});
