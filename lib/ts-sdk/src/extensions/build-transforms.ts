/**
 * `buildTransforms()` — compile a pair of declarative mapping objects into raw
 * `(toCommon, fromCommon)` callables.
 *
 * This is an **`@internal`** helper that `definePlugin()` calls for the mappings
 * authoring path. It is NOT the public author surface and does not return a
 * bundle the author spreads into `definePlugin`. It is exported only so tests
 * can drive it directly.
 *
 * Responsibility: compile mappings into raw transform functions (value +
 * handler-level errors) and validate the mapping structure at build time.
 * Runtime output validation (`safeParse` against `commonSchema` / `sourceSchema`)
 * is NOT done here — `definePlugin` wraps both authoring paths in a single
 * validation step so they behave identically.
 *
 * Each direction is author-provided — this utility never inverts one into the
 * other, because many-to-one handlers like `match` are not reversible.
 */

import { z } from "zod";

import {
  DEFAULT_HANDLERS,
  HandlerError,
  transformWithMapping,
  type Handler,
} from "../utils/transformation";
import { TransformError, type TransformResult } from "./transform-types";

// ############################################################################
// Internal - mapping structure validation
// ############################################################################

/**
 * Walk the mapping tree and throw on structural malformation.
 *
 * Each node must be a primitive (`string` / `number` / `boolean` / `null` /
 * `undefined`) or a plain object. Arrays and class instances are rejected.
 *
 * Handler arguments are runtime-only and skipped — they may legitimately be
 * arrays, deeply nested specs, or anything else the handler accepts.
 *
 * Sibling keys at a handler-dispatch node are rejected here. The runtime walker
 * is first-key-wins, so `{ field: "x", const: "fallback" }` would silently drop
 * `const` — almost always an author typo — so fail loud at build time instead.
 * The low-level `transformWithMapping` walker stays lenient so programmatic
 * callers composing partial mappings aren't forced into the strict shape.
 *
 * @internal
 */
function validateMapping(mapping: unknown, knownHandlers: Set<string>, path = ""): void {
  if (mapping === null || mapping === undefined) return;
  const t = typeof mapping;
  if (t === "string" || t === "number" || t === "boolean") return;

  if (t !== "object" || Array.isArray(mapping)) {
    throw new Error(
      `Invalid mapping node at '${path}': expected object, string, number, boolean, or null, got ${
        Array.isArray(mapping) ? "array" : t
      }`
    );
  }

  // A handler invocation must be the sole key in its node — see the function
  // docstring above for the first-key-wins rationale.
  const nodeKeys = Object.keys(mapping as Record<string, unknown>);
  const handlerKeys = nodeKeys.filter((k) => knownHandlers.has(k));
  if (handlerKeys.length > 0 && nodeKeys.length > 1) {
    const siblings = nodeKeys.filter((k) => !knownHandlers.has(k)).sort();
    throw new Error(
      `Invalid mapping node at '${path === "" ? "<root>" : path}': handler key '${
        handlerKeys[0]
      }' cannot have sibling keys ${JSON.stringify(siblings)}. ` +
        `A handler invocation must be the only key in its dict.`
    );
  }

  for (const [key, value] of Object.entries(mapping as Record<string, unknown>)) {
    const childPath = path === "" ? key : `${path}.${key}`;
    if (knownHandlers.has(key)) {
      // Handler invocation — argument is runtime-only, do not recurse.
      continue;
    }
    validateMapping(value, knownHandlers, childPath);
  }
}

/**
 * Validate that every top-level output key in `mapping` that is not a known
 * handler name is a real field on `schema`.
 *
 * Only runs when `schema` is an instance of `z.ZodObject` — when it is not
 * (e.g. `ZodRecord`, `ZodUnion`), returns without error. In practice all
 * schemas produced by `withCustomFields()` and the base schemas are
 * `ZodObject`s, so the fallback is a safety net, not an expected code path.
 *
 * Run for BOTH directions when the corresponding schema is supplied (the
 * CommonGrants SDK validated only the common side).
 *
 * @internal
 */
function validateOutputPaths(
  direction: "toCommon" | "fromCommon",
  mapping: Record<string, unknown>,
  knownHandlers: Set<string>,
  schema: z.ZodTypeAny
): void {
  if (!(schema instanceof z.ZodObject)) return;
  const validNames = new Set(Object.keys(schema.shape));
  const outputKeys = Object.keys(mapping).filter((k) => !knownHandlers.has(k));
  const invalid = outputKeys.filter((k) => !validNames.has(k));
  if (invalid.length === 0) return;
  throw new Error(
    `buildTransforms (${direction}): unknown output fields ${JSON.stringify(invalid.sort())} for schema. ` +
      `If these are custom fields, map them under the top-level "customFields" key ` +
      `(e.g. { customFields: { yourField: ... } }), not as top-level keys, and declare them in schemas[Object].customFields. ` +
      `Otherwise check the field name.`
  );
}

// ############################################################################
// Public (@internal) - buildTransforms
// ############################################################################

/** Options accepted by {@link buildTransforms}. */
export interface BuildTransformsOptions {
  /** Declarative mappings, one per direction. */
  mappings: {
    toCommon: Record<string, unknown>;
    fromCommon: Record<string, unknown>;
  };
  /**
   * Custom handlers registered for this call only. Name collisions with
   * {@link DEFAULT_HANDLERS} raise a `TypeError` at build time rather than
   * silently shadowing the default.
   */
  handlers?: Map<string, Handler>;
  /** Optional source schema — used only for build-time output-path validation of `fromCommon`. */
  sourceSchema?: z.ZodTypeAny;
  /** Optional common schema — used only for build-time output-path validation of `toCommon`. */
  commonSchema?: z.ZodTypeAny;
}

/** Raw (unvalidated) transform callables compiled from declarative mappings. */
export interface RawTransforms {
  /** Transform source → common; result is the raw transformed value plus handler errors. */
  toCommon: (source: unknown) => TransformResult<unknown>;
  /** Transform common → source; result is the raw transformed value plus handler errors. */
  fromCommon: (common: unknown) => TransformResult<unknown>;
}

/**
 * Compile a pair of declarative mapping objects into raw `(toCommon, fromCommon)`
 * callables.
 *
 * @remarks
 * The returned functions report handler-level failures only — runtime output
 * validation is layered on by `definePlugin`. Handler failures short-circuit
 * the mapping walk on the first failure, so `errors` carries exactly one
 * `TransformError` even when several fields would have failed.
 *
 * @throws TypeError when custom handler names collide with built-in defaults.
 * @throws Error when either mapping is structurally malformed (sibling keys on
 *   a handler-dispatch node) or maps to an unknown top-level output field.
 *
 * @internal
 */
export function buildTransforms(options: BuildTransformsOptions): RawTransforms {
  const { mappings, handlers, sourceSchema, commonSchema } = options;

  if (handlers) {
    const collisions = [...handlers.keys()].filter((k) => DEFAULT_HANDLERS.has(k));
    if (collisions.length > 0) {
      throw new TypeError(
        `buildTransforms: handler names collide with defaults: ${JSON.stringify(collisions.sort())}`
      );
    }
  }

  const merged = new Map([...DEFAULT_HANDLERS, ...(handlers ?? [])]);
  const known = new Set(merged.keys());

  // Validate mapping structure up front so malformed mappings fail at build
  // time, not on first invocation.
  validateMapping(mappings.toCommon, known);
  validateMapping(mappings.fromCommon, known);
  if (commonSchema !== undefined) {
    validateOutputPaths("toCommon", mappings.toCommon, known, commonSchema);
  }
  if (sourceSchema !== undefined) {
    validateOutputPaths("fromCommon", mappings.fromCommon, known, sourceSchema);
  }

  const runMapping = (
    data: unknown,
    mapping: Record<string, unknown>
  ): TransformResult<unknown> => {
    try {
      return { result: transformWithMapping(data, mapping, { handlers: merged }), errors: [] };
    } catch (exc) {
      if (exc instanceof HandlerError) {
        const cause = exc.cause;
        return {
          result: {},
          errors: [
            new TransformError(cause instanceof Error ? cause.message : String(cause), {
              handler: exc.handler,
              sourceValue: data,
              cause,
            }),
          ],
        };
      }
      return {
        result: {},
        errors: [
          new TransformError(exc instanceof Error ? exc.message : String(exc), {
            sourceValue: data,
            cause: exc,
          }),
        ],
      };
    }
  };

  return {
    toCommon: (source: unknown) => runMapping(source, mappings.toCommon),
    fromCommon: (common: unknown) => runMapping(common, mappings.fromCommon),
  };
}
