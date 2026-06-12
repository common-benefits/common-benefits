/**
 * Mapping-runtime utilities for declarative bidirectional transforms.
 *
 * This module is the pure, Zod-free core: `transformWithMapping()` walks a
 * declarative mapping spec and produces a transformed object. It is used by the
 * `@internal buildTransforms()` in `../extensions/build-transforms`, but can
 * also be imported on its own.
 *
 * Ported from the CommonGrants SDK (`lib/ts-sdk/src/extensions/transformation.ts`),
 * renamed `transformFromMapping` -> `transformWithMapping` to match the website
 * module's public convention, and with the website module's `depth` / `maxDepth`
 * recursion guard added as a safety net for third-party mappings.
 *
 * ## Null handling (three-state contract)
 *
 * Optional fields carry three distinct states, each preserved through every
 * built-in handler rather than collapsing `null` into `undefined`:
 *
 * - **absent** — "not provided" (publisher did not supply this data)
 * - **`null`** — "doesn't apply" (publisher actively asserts irrelevant for this record)
 * - **value** — "has a value"
 *
 * `fieldValue` / `getFromPath` pass terminal `null` through verbatim; the
 * coercing handlers (`numberToString`, `stringToNumber`, `switchOnValue`)
 * return `null` on `null` source. Custom-handler authors should do the same.
 * This is the canonical description — handlers below note only their own
 * departures from it.
 */

// ############################################################################
// Public type - Handler
// ############################################################################

/**
 * Handler signature for transform mapping handlers.
 *
 * - First arg: the source data being transformed (where field paths resolve from).
 * - Second arg: the handler argument from the mapping spec.
 * - Return: the transformed value.
 *
 * @remarks
 * One contract custom-handler authors should respect:
 *
 * **Do not throw `Error`s whose `.message` embeds source data when that data may
 * contain PII.** `buildTransforms()` wraps a handler exception's message
 * verbatim into the resulting `TransformError.message`, which is enumerable on
 * `Error.prototype` and rendered by `util.inspect` / `console.log(err)`. The
 * built-in `stringToNumber` handler follows this rule by throwing a generic
 * "cannot convert source value to a number" message.
 */
export type Handler = (data: unknown, arg: unknown) => unknown;

// ############################################################################
// Public utilities - getFromPath, handlers, transformWithMapping
// ############################################################################

/**
 * Extract a value from an object using dot-notation.
 *
 * Walks the path through nested objects. Returns the default when any
 * intermediate step is missing or non-object.
 *
 * Null handling: a terminal `null` is returned verbatim (preserves "doesn't
 * apply" at the leaf); a `null` intermediate step short-circuits to
 * `defaultValue` (typically `undefined`) — a null parent makes its children
 * "not provided" by extension. Authors needing richer per-leaf null semantics
 * inside a null parent should write a custom handler.
 *
 * @example
 * ```ts
 * getFromPath({ a: { b: 1 } }, "a.b");  // 1
 * getFromPath({ a: { b: 1 } }, "a.c");  // undefined (absent)
 * getFromPath({ a: null }, "a");        // null   (terminal null preserved)
 * getFromPath({ a: null }, "a.b");      // undefined (intermediate null → absent)
 * getFromPath({ a: 1 }, "");            // { a: 1 } (empty path returns input)
 * ```
 */
export function getFromPath<T = unknown>(
  data: unknown,
  path: string,
  defaultValue: T | undefined = undefined
): T | undefined {
  if (path === "") return data as T;
  const parts = path.split(".");
  let cursor: unknown = data;
  for (const part of parts) {
    if (typeof cursor !== "object" || cursor === null) return defaultValue;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor === undefined ? defaultValue : (cursor as T);
}

/**
 * `field` handler — pluck a value by dot-notation path.
 */
export function fieldValue(data: unknown, fieldPath: unknown): unknown {
  return getFromPath(data, String(fieldPath ?? ""));
}

/**
 * `const` handler — return a fixed literal value, ignoring source data.
 */
export function constValue(_data: unknown, value: unknown): unknown {
  return value;
}

/**
 * `match` / `switch` handler — case-based lookup on a field's value.
 *
 * Spec shape: `{ field: "path", case: { sourceValue: targetValue, ... }, default?: any }`.
 * Returns the mapped value if `data[field]` is a `case` key, otherwise `default`
 * (or undefined when no default is provided).
 *
 * Only string source values are candidate lookup keys: a non-string `val`
 * short-circuits to `default`. `case: { "1": "yes" }` does not match a source
 * value of `1`. Authors who need to map non-string source values should coerce
 * upstream (e.g. via a custom handler that `String()`-coerces before
 * dispatching `match`).
 *
 * Null handling. When the source field resolves to an explicit `null`, the
 * handler returns `case["null"]` if the author opted in to target-side
 * translation, otherwise passes `null` through unchanged. `default` is NOT
 * consulted for `null` source — `default` is for unrecognized values, not for
 * the publisher's "doesn't apply" assertion; use `case: { "null": ... }` for a
 * target-side sentinel. (See the module-level null-handling note.)
 *
 * A missing field resolves to `undefined` via `getFromPath`, which fails the
 * string-only guard and falls through to `default`.
 *
 * If `field` is omitted or `""`, `getFromPath` returns the entire `data`
 * object — non-string, so the handler falls back to `default`. A `match` spec
 * with no `field` is functionally equivalent to `const: <default>`; prefer
 * `const` for clarity when the constant case is what you want.
 *
 * `match` is the canonical handler name; `switch` is provided as a convenience
 * alias — both point at the same handler function.
 *
 * @throws Error when `spec` is not a non-null object. The walker wraps this as
 *   a `HandlerError`; `buildTransforms` surfaces it as a `TransformError` with
 *   `handler: "match"`.
 */
export function switchOnValue(data: unknown, spec: unknown): unknown {
  if (typeof spec !== "object" || spec === null || Array.isArray(spec)) {
    throw new Error("match/switch handler: spec must be an object");
  }
  const s = spec as { field?: string; case?: Record<string, unknown>; default?: unknown };
  const val = getFromPath(data, s.field ?? "");
  const lookup = new Map(Object.entries(s.case ?? {}));
  // null source = publisher asserts "doesn't apply."
  // Author opts in to target-side translation via a `"null"` case key.
  // Otherwise pass null through unchanged — do NOT fall through to default,
  // which is for unrecognized values, not for publisher assertions.
  if (val === null) {
    return lookup.has("null") ? lookup.get("null") : null;
  }
  if (typeof val === "string" && lookup.has(val)) {
    return lookup.get(val);
  }
  return s.default;
}

/**
 * `numberToString` handler — pluck a value and coerce it to string via `String()`.
 *
 * Null handling: absent → `undefined`; `null` source → `null` (`String(null)`
 * is bypassed so the literal "null" never lands in output); value →
 * `String(val)`. (See the module-level null-handling note.)
 *
 * The handler is named for its primary use case (numeric source values) but the
 * coercion is `String()`, so booleans (`"true"` / `"false"`), arrays
 * (`"a,b,c"`), and other non-null values pass through unchanged.
 */
export function numberToString(data: unknown, fieldPath: unknown): string | null | undefined {
  const val = getFromPath(data, String(fieldPath ?? ""));
  if (val === undefined) return undefined;
  if (val === null) return null;
  return String(val);
}

/**
 * `stringToNumber` handler — pluck a value, coerce to an integer when the
 * string is a pure integer, otherwise fall back to a general `Number()`
 * coercion. Non-numeric inputs throw.
 *
 * Null handling: absent → `undefined`; `null` source → `null` (no coercion
 * attempted); value → coerced via the integer / float / safe-integer rules
 * below. (See the module-level null-handling note.)
 *
 * Empty and whitespace-only strings throw — `Number("")` and `Number("  ")`
 * both coerce to `0` in JavaScript, which would silently turn an
 * implicit-absent CSV cell into a real zero on the transformed side. An
 * integer-shaped string outside the safe-integer range also throws rather than
 * silently losing precision.
 */
export function stringToNumber(data: unknown, fieldPath: unknown): number | null | undefined {
  const val = getFromPath(data, String(fieldPath ?? ""));
  if (val === undefined) return undefined;
  if (val === null) return null;
  const s = String(val).trim();
  // Empty / whitespace-only strings would otherwise coerce to 0 via `Number()`.
  if (s === "") {
    throw new Error("stringToNumber: cannot convert source value to a number");
  }
  // Integer-shaped strings parse as integers; anything else falls through to
  // `Number(s)`. The integer branch pins the int-vs-float distinction at the
  // call site.
  if (/^-?\d+$/.test(s)) {
    const n = Number(s);
    // Outside the safe-integer range, `Number(s)` silently loses precision
    // (e.g. `"9999999999999999999"` → `1e19`). Reject rather than corrupt.
    if (Number.isFinite(n) && Number.isSafeInteger(n)) return n;
    throw new Error("stringToNumber: cannot convert source value to a number");
  }
  const f = Number(s);
  if (Number.isFinite(f)) return f;
  // Don't embed the source value in the error message — it could be PII when
  // transforming applicant data. The handler name and cause flow into
  // `TransformError` separately for programmatic reasoning.
  throw new Error("stringToNumber: cannot convert source value to a number");
}

/**
 * Raised when a handler function throws. Carries the handler name for attribution.
 *
 * `buildTransforms()` catches this and wraps it as a `TransformError`, so
 * callers of the public `toCommon` / `fromCommon` pair will not see
 * `HandlerError` directly. The class is **internal**: not re-exported from the
 * package barrel. Tests that drive `transformWithMapping` directly import it
 * from this file for `instanceof` checks.
 */
export class HandlerError extends Error {
  readonly handler: string;
  readonly cause: unknown;
  constructor(handler: string, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = "HandlerError";
    this.handler = handler;
    this.cause = cause;
  }
}

/**
 * Registry of built-in mapping handlers.
 *
 * `match` is the canonical name; `switch` is a convenience alias — both point
 * at the same handler function.
 */
export const DEFAULT_HANDLERS: Map<string, Handler> = new Map([
  ["const", constValue],
  ["field", fieldValue],
  ["match", switchOnValue],
  ["numberToString", numberToString],
  ["stringToNumber", stringToNumber],
  ["switch", switchOnValue],
]);

/**
 * Options for {@link transformWithMapping}.
 */
export interface TransformWithMappingOptions {
  /** Handler registry. Defaults to {@link DEFAULT_HANDLERS}. */
  handlers?: Map<string, Handler>;
  /**
   * Maximum recursion depth before the walker throws. A safety net for
   * deeply nested (possibly third-party) mappings. Defaults to 500.
   */
  maxDepth?: number;
}

/**
 * Transform a data object according to a declarative mapping spec.
 *
 * The mapping is a nested object where:
 * - Primitive leaves (string, number, boolean, null) pass through as literals.
 * - Object nodes whose first key is a registered handler dispatch to that
 *   handler with `(data, handlerArg)`. The handler's return value is the
 *   transformed node. Sibling keys on a handler-dispatch node are silently
 *   ignored here — only the first key is read, so `{ field: "x", const: "fallback" }`
 *   drops `const`. This low-level walker stays lenient; callers entering
 *   through `buildTransforms()` get a stricter `validateMapping` pass that
 *   rejects the shape at build time.
 * - Object nodes whose first key is not a handler are treated as output
 *   shapes — each child is transformed recursively. A child that transforms to
 *   `undefined` (absent source) is omitted from the output object; `null`
 *   ("doesn't apply") is written as a present key. So absent → missing key,
 *   `null` → present `null`, value → present value.
 *
 * @example
 * ```ts
 * transformWithMapping(
 *   { opportunity_status: "posted", opportunity_amount: 1000 },
 *   {
 *     status: { field: "opportunity_status" },
 *     amount: { value: { field: "opportunity_amount" }, currency: "USD" },
 *   }
 * );
 * // => { status: "posted", amount: { value: 1000, currency: "USD" } }
 * ```
 *
 * @throws {@link HandlerError} when a registered handler throws.
 * @throws Error when the mapping nests deeper than `maxDepth`.
 */
export function transformWithMapping(
  data: unknown,
  mapping: unknown,
  options: TransformWithMappingOptions = {}
): unknown {
  const handlers = options.handlers ?? DEFAULT_HANDLERS;
  const maxDepth = options.maxDepth ?? 500;

  const transformNode = (node: unknown, depth: number): unknown => {
    // Sanity check against stack overflow from deeply nested mappings, a
    // concern when running this on third-party mappings.
    if (depth > maxDepth) {
      throw new Error("Maximum transformation depth exceeded.");
    }

    // Primitives, null, and arrays pass through as literals. Arrays in handler
    // args are opaque to the walker by design — handlers own their own shape.
    if (typeof node !== "object" || node === null || Array.isArray(node)) {
      return node;
    }

    const entries = Object.entries(node as Record<string, unknown>);
    if (entries.length === 0) return {};

    // Check the first key. If it names a handler, dispatch with the handler
    // argument. Otherwise treat the node as an output shape and recurse over
    // every child.
    const [firstKey] = entries[0];
    if (handlers.has(firstKey)) {
      const handlerFn = handlers.get(firstKey)!;
      const handlerArg = (node as Record<string, unknown>)[firstKey];
      try {
        return handlerFn(data, handlerArg);
      } catch (exc) {
        throw new HandlerError(firstKey, exc);
      }
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      // Three-state: a child that transforms to `undefined` (absent source) is
      // omitted entirely rather than written as `out[k] = undefined`, so the
      // object carries all three states — absent → key omitted, `null` →
      // present `null`, value → present. This matches what `JSON.stringify`
      // produces on the wire (it drops `undefined` keys).
      const child = transformNode(v, depth + 1);
      if (child !== undefined) {
        out[k] = child;
      }
    }
    return out;
  };

  return transformNode(mapping, 0);
}
