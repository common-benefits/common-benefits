/**
 * Client configuration types and helpers.
 *
 * Env-var names use the `CB_` prefix (CommonBenefits) so they don't collide
 * with the upstream CommonGrants SDK in environments that have both installed.
 */

import type { AuthMethod } from "./auth";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_ITEMS = 1000;

const ENV_BASE_URL = "CB_API_BASE_URL";
const ENV_TIMEOUT = "CB_API_TIMEOUT";
const ENV_PAGE_SIZE = "CB_API_PAGE_SIZE";
const ENV_MAX_ITEMS = "CB_API_LIST_ITEMS_LIMIT";

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration options for the CommonBenefits client.
 *
 * Values can be provided directly or via environment variables:
 * - `CB_API_BASE_URL` - Base URL of the API
 * - `CB_API_TIMEOUT` - Request timeout in milliseconds
 * - `CB_API_PAGE_SIZE` - Default page size for list operations
 * - `CB_API_LIST_ITEMS_LIMIT` - Maximum items to fetch when auto-paginating
 */
export interface ClientConfig {
  /** Base URL of the API (e.g., "https://api.example.org"). Falls back to CB_API_BASE_URL env var. */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000). Falls back to CB_API_TIMEOUT env var. */
  timeout?: number;
  /** Default page size for list operations (default: 100). Falls back to CB_API_PAGE_SIZE env var. */
  pageSize?: number;
  /** Maximum items to fetch when auto-paginating (default: 1000). Falls back to CB_API_LIST_ITEMS_LIMIT env var. */
  maxItems?: number;
  /** Authentication method for outgoing requests. */
  auth?: AuthMethod;
}

/** Resolved configuration with all defaults applied. */
export interface ResolvedConfig {
  baseUrl: string;
  timeout: number;
  pageSize: number;
  maxItems: number;
}

// =============================================================================
// Helper functions
// =============================================================================

function getEnv(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}

function getEnvInt(name: string): number | undefined {
  const value = getEnv(name);
  if (value === undefined) return undefined;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

// =============================================================================
// Config resolver
// =============================================================================

/**
 * Resolves client config with defaults and environment variable fallbacks.
 *
 * @throws {Error} If baseUrl is not provided and CB_API_BASE_URL is not set
 * @throws {Error} If baseUrl is not a valid URL using http:// or https://
 */
export function resolveConfig(config: ClientConfig): ResolvedConfig {
  const baseUrl = config.baseUrl ?? getEnv(ENV_BASE_URL);
  if (!baseUrl) {
    throw new Error(
      "baseUrl is required. Set it in config or via CB_API_BASE_URL environment variable."
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Invalid baseUrl: "${baseUrl}". Must be a valid URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("baseUrl must use http:// or https://");
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    timeout: config.timeout ?? getEnvInt(ENV_TIMEOUT) ?? DEFAULT_TIMEOUT,
    pageSize: config.pageSize ?? getEnvInt(ENV_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE,
    maxItems: config.maxItems ?? getEnvInt(ENV_MAX_ITEMS) ?? DEFAULT_MAX_ITEMS,
  };
}
