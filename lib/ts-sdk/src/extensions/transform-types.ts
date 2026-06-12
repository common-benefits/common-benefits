/**
 * Result and error types for the transform layer.
 *
 * Kept out of `src/utils/` so the pure mapping runtime stays Zod-free and
 * error-policy-free. Ported from the CommonGrants SDK `extensions/types.ts`
 * with `PluginError` renamed to `TransformError` (it pairs with
 * `TransformResult` rather than reading like a plugin-wide error).
 */

/**
 * Unconditional return shape for `toCommon` / `fromCommon`.
 *
 * `result` is the transformed value (may be partial on handler error or
 * validation failure). `errors` is the aggregated `TransformError` list, empty
 * on full success.
 *
 * Consumers apply their own strict-vs-lenient rule — strict adopters treat any
 * non-empty `errors` as failure; lenient adopters use `result` despite warnings
 * and inspect `errors` for context.
 */
export interface TransformResult<T> {
  result: T;
  errors: TransformError[];
}

/**
 * Structured transformation error.
 *
 * Carries field path, handler name, source value, and underlying cause so
 * consumers can reason about failures programmatically without parsing error text.
 *
 * @remarks
 * **The SDK does not redact by default.**
 * `sourceValue` and `cause` are plain enumerable fields and flow through
 * `JSON.stringify(err)`, `util.inspect(err)`, and any logger that enumerates
 * own properties. When populated by `buildTransforms()`, `sourceValue` is the
 * entire input record passed to `toCommon` / `fromCommon` — not just the value
 * at the failing field — so adopters whose source data may contain PII must
 * redact before logging.
 *
 * `TransformError.message` is data-bearing on the Zod-validation path
 * (`definePlugin`'s `safeParse` wrapper): Zod's default error map embeds the
 * received runtime value into `issue.message`, which flows verbatim into
 * `TransformError.message`. Adopters whose source data may contain PII must
 * redact `message` alongside `sourceValue` and `cause`.
 */
export class TransformError extends Error {
  /** Dot-notation field path where the error occurred, if known. */
  path?: string;
  /** Name of the handler that raised, if applicable. */
  handler?: string;
  /** The source value that triggered the error (may contain PII — redact before logging). */
  sourceValue?: unknown;
  /** Underlying cause of the error, if any (may contain PII — redact before logging). */
  cause?: unknown;

  constructor(
    message: string,
    options?: {
      path?: string;
      handler?: string;
      sourceValue?: unknown;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "TransformError";
    this.path = options?.path;
    this.handler = options?.handler;
    this.sourceValue = options?.sourceValue;
    this.cause = options?.cause;
  }
}
