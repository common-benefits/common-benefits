/**
 * The `transforms` concern — public API: the `(result, errors)` transform
 * contract, the structured `TransformError`, the author helper types
 * (`ToCommon` / `FromCommon`), and `buildTransforms` (compile declarative
 * mappings, with the `handlers` option for custom mapping handlers). Mirrors
 * `py-sdk`'s `extensions/transforms.py` (result/error contract from its `types.py`).
 */

export { TransformError } from "./types";
export type { TransformResult, TransformTypes, CommonOf, ToCommon, FromCommon } from "./types";
export { buildTransforms } from "./builder";
export type { BuildTransformsOptions, RawTransforms } from "./builder";
