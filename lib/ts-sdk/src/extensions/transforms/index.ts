/**
 * The `transforms` concern: the `(result, errors)` transform contract, the
 * structured `TransformError`, the author helper types, and the `@internal`
 * `buildTransforms` compiler. Mirrors `py-sdk`'s `extensions/transforms.py`
 * (with the result/error contract from its `types.py`).
 */

export { TransformError } from "./types";
export type { TransformResult, TransformTypes, CommonOf, ToCommon, FromCommon } from "./types";
export { buildTransforms } from "./builder";
export type { BuildTransformsOptions, RawTransforms } from "./builder";
