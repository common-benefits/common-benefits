/**
 * `buildTransforms()` — compile a pair of declarative mapping objects into raw
 * `(toCommon, fromCommon)` callables.
 *
 * `@internal` helper `definePlugin()` calls for the mappings authoring path. It
 * compiles mappings into raw transform functions (value + handler-level errors)
 * and validates the mapping structure at build time. Runtime output validation
 * (`safeParse` against the schemas) is layered on by `definePlugin` so both
 * authoring paths behave identically. Exported only so tests can drive it.
 */

import { z } from "zod";
import {
  DEFAULT_HANDLERS,
  HandlerError,
  transformWithMapping,
  type Handler,
} from "../../utils/transformation";
import { TransformError, type TransformResult } from "./types";

// ############################################################################
// Internal - mapping structure validation
// ############################################################################

/**
 * Walk the mapping tree and throw on structural malformation. Each node must be
 * a primitive or a plain object; arrays and class instances are rejected.
 * Handler arguments are runtime-only and skipped. Sibling keys at a
 * handler-dispatch node are rejected (the runtime walker is first-key-wins, so
 * `{ field: "x", const: "fallback" }` would silently drop `const`).
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
    if (knownHandlers.has(key)) continue;
    validateMapping(value, knownHandlers, childPath);
  }
}

/**
 * Validate that every top-level output key in `mapping` that is not a known
 * handler name is a real field on `schema`. Only runs for `z.ZodObject` schemas
 * (all schemas from `withCustomFields()` and the base schemas qualify).
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
   * {@link DEFAULT_HANDLERS} raise a `TypeError` at build time.
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
 * @throws TypeError when custom handler names collide with built-in defaults.
 * @throws Error when either mapping is structurally malformed or maps to an
 *   unknown top-level output field.
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
