/**
 * Error types thrown by the SDK.
 *
 * `ParsingError` is the narrow Zod-parse-or-validation failure. Inspired by
 * the "PluginError" sketch in ADR 0022 but renamed because this is specifically
 * about schema parsing — not plugin lifecycle errors in general.
 */

// =============================================================================
// ParsingError
// =============================================================================

/** Options used to construct a {@link ParsingError}. */
export interface ParsingErrorOptions {
  /** Dot/bracket path to the offending value, e.g. `"items[3].customFields.legacyId"`. */
  path?: string;
  /** Identifier for the parse site, e.g. `"Widget.parse"` or `"widgets.search"`. */
  handler?: string;
  /** The raw value that failed to parse. */
  sourceValue?: unknown;
  /** Underlying error (typically a ZodError). */
  cause?: unknown;
}

/**
 * Raised when a value fails to parse against its Zod schema.
 *
 * `ParsedItem` and {@link parseBatch} surface this per-record so a single bad
 * row doesn't take down a whole search response.
 */
export class ParsingError extends Error {
  readonly path?: string;
  readonly handler?: string;
  readonly sourceValue?: unknown;
  readonly cause?: unknown;

  constructor(message: string, options: ParsingErrorOptions = {}) {
    super(message);
    this.name = "ParsingError";
    this.path = options.path;
    this.handler = options.handler;
    this.sourceValue = options.sourceValue;
    this.cause = options.cause;
  }
}

/** Type guard for {@link ParsingError}. */
export function isParsingError(value: unknown): value is ParsingError {
  return value instanceof ParsingError;
}

// =============================================================================
// ApiError
// =============================================================================

/** Raised when the API returns a non-2xx HTTP status. */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly path: string;
  readonly body?: unknown;

  constructor(
    message: string,
    options: { status: number; statusText: string; path: string; body?: unknown }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.path = options.path;
    this.body = options.body;
  }
}
