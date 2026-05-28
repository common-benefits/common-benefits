/**
 * Per-record parsed-result helpers.
 *
 * `parseBatch()` runs `schema.safeParse` over an array of unknown items and
 * returns a mixed-success array of {@link ParsedItem}s plus a flat
 * `errors[]` list. Resource methods that fan out over many items
 * (e.g. `widgets.search`) use this so one bad record can't fail the response.
 */

import { z } from "zod";
import { ParsingError } from "./errors";

/** Result of attempting to parse one item against a schema. */
export type ParsedItem<T> =
  | { ok: true; data: T }
  | { ok: false; error: ParsingError; raw: unknown };

/** Output of {@link parseBatch}: per-item results plus a flat list of errors. */
export interface ParseBatchResult<T> {
  items: ParsedItem<T>[];
  errors: ParsingError[];
}

/**
 * Parses one item against a schema. Returns a {@link ParsedItem} discriminated
 * on `ok`; never throws on parse failure.
 */
export function safeParseItem<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  options: { handler: string; path?: string }
): ParsedItem<z.infer<S>> {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data as z.infer<S> };
  }
  const error = new ParsingError(result.error.message, {
    path: options.path,
    handler: options.handler,
    sourceValue: raw,
    cause: result.error,
  });
  return { ok: false, error, raw };
}

/**
 * Parses each item in `items` against `schema`. Returns a {@link ParseBatchResult}
 * with all successes and failures preserved; the caller decides whether to
 * surface the bad rows or throw on `errors.length > 0`.
 */
export function parseBatch<S extends z.ZodTypeAny>(
  schema: S,
  items: unknown[],
  handler: string
): ParseBatchResult<z.infer<S>> {
  const parsed: ParsedItem<z.infer<S>>[] = [];
  const errors: ParsingError[] = [];
  items.forEach((raw, index) => {
    const result = safeParseItem(schema, raw, {
      handler,
      path: `items[${index}]`,
    });
    parsed.push(result);
    if (!result.ok) errors.push(result.error);
  });
  return { items: parsed, errors };
}
