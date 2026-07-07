/**
 * `utils/` entry point — the pure, Zod-free mapping runtime.
 *
 * Public API:
 * - `transformWithMapping()` — walk a declarative mapping spec
 * - `getFromPath()` — dot-notation lookup with three-state null handling
 * - `DEFAULT_HANDLERS` — built-in mapping handlers
 * - `Handler` / `JsonValue` types
 */

export {
  transformWithMapping,
  getFromPath,
  DEFAULT_HANDLERS,
  type Handler,
  type TransformWithMappingOptions,
} from "./transformation";

export type { JsonValue } from "./types";
