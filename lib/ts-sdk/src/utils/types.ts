/**
 * Shared primitive types for the `utils/` layer.
 *
 * Kept Zod-free so `utils/transformation.ts` and its consumers can be imported
 * without pulling in the schema/validation stack.
 */

/** A JSON-serializable value. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
