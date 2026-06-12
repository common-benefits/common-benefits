/**
 * Helper types for typing hand-written `toCommon` / `fromCommon` functions.
 *
 * A flat, multi-key `definePlugin({ schemas })` cannot infer per-entry
 * `TCommon` to type-check an inline function, so authors annotate their
 * hand-written functions with these helper types to recover full param
 * inference (`source` typed from `sourceSchema`) and return checking (against
 * the resolved common type). The resolved consumer-facing types that
 * `definePlugin` produces are always correct regardless of whether the author
 * uses these.
 *
 * Each helper takes a single named type argument (`{ model, sourceSchema,
 * customFields }`) so the call site is self-describing and `customFields` is
 * clearly the field specs being passed, not a prebuilt common schema.
 */

import { z } from "zod";
import {
  EXTENSIBLE_SCHEMA_MAP,
  type CustomFieldSpec,
  type ExtensibleSchemaName,
} from "./plugin-types";
import type { TransformResult } from "./transform-types";
import type { WithCustomFieldsResult } from "./with-custom-fields";

/**
 * The named type argument for {@link ToCommon} / {@link FromCommon}.
 *
 * `model` selects the base schema from `EXTENSIBLE_SCHEMA_MAP`, so `CommonOf`
 * resolves the correct common type per model rather than assuming a single
 * hardcoded base. `customFields` is optional; when omitted, the common type is
 * the model's base schema.
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
    ? z.infer<WithCustomFieldsResult<BaseSchemaOf<T>, T["customFields"]>>
    : z.infer<BaseSchemaOf<T>>;

/** Type for a hand-written `toCommon`: `source` typed from `sourceSchema`, return checked. */
export type ToCommon<T extends TransformTypes> = (
  source: z.infer<T["sourceSchema"]>
) => TransformResult<CommonOf<T>>;

/** Type for a hand-written `fromCommon`: `common` typed from the resolved common type. */
export type FromCommon<T extends TransformTypes> = (
  common: CommonOf<T>
) => TransformResult<z.infer<T["sourceSchema"]>>;
