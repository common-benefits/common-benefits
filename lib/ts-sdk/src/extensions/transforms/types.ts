/**
 * Types for the transform concern: the unconditional `(result, errors)` return
 * shape, the structured `TransformError`, and the author-facing helper types
 * (`ToCommon` / `FromCommon`) that recover full inference for hand-written
 * transforms. Re-exported from `./index`.
 */

import { z } from "zod";
import { EXTENSIBLE_SCHEMA_MAP, type ExtensibleSchemaName } from "../registry";
import type { CustomFieldSpec, SchemaWithCustomFields } from "../schemas";

// ############################################################################
// Result + error
// ############################################################################

/**
 * Unconditional return shape for `toCommon` / `fromCommon`. `result` is the
 * transformed value (may be partial on error); `errors` is the aggregated
 * `TransformError` list, empty on full success. Consumers apply their own
 * strict-vs-lenient rule.
 */
export interface TransformResult<T> {
  result: T;
  errors: TransformError[];
}

/**
 * Structured transformation error.
 *
 * @remarks
 * **The SDK does not redact by default.** `sourceValue`, `cause`, and (on the
 * Zod-validation path) `message` may carry source data — adopters whose source
 * data contains PII must redact before logging.
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
    options?: { path?: string; handler?: string; sourceValue?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = "TransformError";
    this.path = options?.path;
    this.handler = options?.handler;
    this.sourceValue = options?.sourceValue;
    this.cause = options?.cause;
  }
}

// ############################################################################
// Author helper types for hand-written transforms
// ############################################################################

/**
 * The named type argument for {@link ToCommon} / {@link FromCommon}. `model`
 * selects the base schema from `EXTENSIBLE_SCHEMA_MAP`; `customFields` is
 * optional (when omitted, the common type is the model's base schema).
 */
export interface TransformTypes {
  /** The extensible model this transform targets (selects the base schema). */
  model: ExtensibleSchemaName;
  /** The source-system Zod schema. */
  sourceSchema: z.ZodTypeAny;
  /** The custom field specs declared on the entry (NOT a prebuilt common schema). */
  customFields?: Record<string, CustomFieldSpec>;
}

/** Base schema for the model named by `T["model"]`. */
type BaseSchemaOf<T extends TransformTypes> = (typeof EXTENSIBLE_SCHEMA_MAP)[T["model"]];

/**
 * The common type for `T`, resolved exactly as `definePlugin` builds
 * `commonSchema`: the model's base schema, extended via `withCustomFields` when
 * `customFields` is present.
 */
export type CommonOf<T extends TransformTypes> =
  T["customFields"] extends Record<string, CustomFieldSpec>
    ? z.infer<SchemaWithCustomFields<BaseSchemaOf<T>, T["customFields"]>>
    : z.infer<BaseSchemaOf<T>>;

/** Type for a hand-written `toCommon`: `source` typed from `sourceSchema`, return checked. */
export type ToCommon<T extends TransformTypes> = (
  source: z.infer<T["sourceSchema"]>
) => TransformResult<CommonOf<T>>;

/** Type for a hand-written `fromCommon`: `common` typed from the resolved common type. */
export type FromCommon<T extends TransformTypes> = (
  common: CommonOf<T>
) => TransformResult<z.infer<T["sourceSchema"]>>;
