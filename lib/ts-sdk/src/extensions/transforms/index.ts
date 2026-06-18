/**
 * The `transforms` concern — public API: the `(result, errors)` transform
 * contract, the structured `TransformError`, and the author helper types
 * (`ToCommon` / `FromCommon`). Mirrors `py-sdk`'s `extensions/transforms.py`
 * (with the result/error contract from its `types.py`).
 *
 * The `@internal buildTransforms` compiler lives in `builder.ts` (tests import
 * it directly); it is not part of the public API.
 */

export { TransformError } from "./types";
export type { TransformResult, TransformTypes, CommonOf, ToCommon, FromCommon } from "./types";
