/**
 * Low-level HTTP client.
 *
 * Exposes `fetch / get / post / fetchMany`. Resources (`widgets`, etc.) are
 * attached by `buildGetClient()` at construction time — this class itself
 * doesn't know about any specific resources.
 */

import { Auth, buildAuthHeaders, type AuthMethod } from "./auth";
import { type ClientConfig, type ResolvedConfig, resolveConfig } from "./config";
import { ApiError } from "./errors";
import type { Paginated } from "./responses";

// =============================================================================
// Options interfaces
// =============================================================================

export interface GetOptions {
  /** Query parameters appended to the URL */
  params?: Record<string, string | number | boolean>;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface PostOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface FetchManyOptions {
  /** Starting page number (default: 1) */
  page?: number;
  /** Items per page (uses client default if not specified) */
  pageSize?: number;
  /** Maximum total items to fetch (uses client default if not specified) */
  maxItems?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** HTTP method (default: "GET") */
  method?: "GET" | "POST";
  /** Request body for POST requests (pagination merged in) */
  body?: Record<string, unknown>;
}

// =============================================================================
// Client class
// =============================================================================

/**
 * HTTP client for a CommonBenefits-compliant API.
 *
 * Use {@link buildGetClient} or `plugin.getClient(config)` to obtain a client
 * with typed resources already attached. Constructing `Client` directly gives
 * you only the HTTP primitives.
 */
export class Client {
  private readonly config: ResolvedConfig;
  private readonly auth: AuthMethod;

  constructor(options: ClientConfig) {
    this.config = resolveConfig(options);
    this.auth = options.auth ?? Auth.none();
  }

  // =============================================================================
  // fetch / get / post
  // =============================================================================

  async fetch(path: string, init?: RequestInit): Promise<Response> {
    const url = this.url(path);
    const headers = {
      "Content-Type": "application/json",
      ...buildAuthHeaders(this.auth),
      ...init?.headers,
    };

    return fetch(url, {
      ...init,
      headers,
      signal: init?.signal ?? AbortSignal.timeout(this.config.timeout),
    });
  }

  async get(path: string, options?: GetOptions): Promise<Response> {
    let fullPath = path;

    if (options?.params && Object.keys(options.params).length > 0) {
      const url = new URL(this.url(path));
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, String(value));
      }
      fullPath = url.pathname + url.search;
    }

    return this.fetch(fullPath, {
      method: "GET",
      signal: options?.signal,
    });
  }

  async post(path: string, body: unknown, options?: PostOptions): Promise<Response> {
    return this.fetch(path, {
      method: "POST",
      body: JSON.stringify(body),
      signal: options?.signal,
    });
  }

  // =============================================================================
  // fetchMany - auto-pagination
  // =============================================================================

  /**
   * Fetches every page of a paginated endpoint and aggregates the raw items.
   *
   * Returns items as `unknown[]` — the caller (typically a resource method)
   * parses them through the appropriate schema using {@link parseBatch} so
   * one bad row can't fail the whole response.
   */
  async fetchMany(path: string, options?: FetchManyOptions): Promise<Paginated<unknown>> {
    const pageSize = options?.pageSize ?? this.config.pageSize;
    const maxItems = options?.maxItems ?? this.config.maxItems;
    const method = options?.method ?? "GET";
    const startPage = options?.page ?? 1;

    const firstResult = await this.fetchOnePage(path, method, startPage, pageSize, options);
    const firstPageJson = firstResult.json;
    const allItems: unknown[] = [...firstResult.items.slice(0, maxItems)];

    let currentPage = startPage + 1;
    let lastResult = firstResult;
    while (allItems.length < maxItems && !lastResult.isLastPage) {
      lastResult = await this.fetchOnePage(path, method, currentPage, pageSize, options);

      const remainingCapacity = maxItems - allItems.length;
      allItems.push(...lastResult.items.slice(0, remainingCapacity));

      if (lastResult.isLastPage || allItems.length >= maxItems) break;
      currentPage++;
    }

    return {
      ...firstPageJson,
      items: allItems,
      paginationInfo: {
        ...firstPageJson.paginationInfo,
        page: 1,
        pageSize: allItems.length,
      },
    };
  }

  // =============================================================================
  // Internals
  // =============================================================================

  private async fetchOnePage(
    path: string,
    method: "GET" | "POST",
    currentPage: number,
    pageSize: number,
    options?: FetchManyOptions
  ): Promise<{
    json: Paginated<unknown>;
    items: unknown[];
    isLastPage: boolean;
  }> {
    let response: Response;

    if (method === "POST") {
      const requestBody = {
        ...options?.body,
        pagination: { page: currentPage, pageSize },
      };
      response = await this.post(path, requestBody, { signal: options?.signal });
    } else {
      response = await this.get(path, {
        params: { page: currentPage, pageSize },
        signal: options?.signal,
      });
    }

    if (!response.ok) {
      throw new ApiError(`Failed to fetch ${path}: ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        path,
      });
    }

    const json = (await response.json()) as Paginated<unknown>;
    const { items: rawItems, paginationInfo } = json;

    const totalPages = paginationInfo.totalPages ?? undefined;
    const isLastPage =
      rawItems.length < pageSize ||
      (totalPages !== undefined && currentPage >= totalPages) ||
      rawItems.length === 0;

    return { json, items: rawItems, isLastPage };
  }

  /** Constructs the full URL for an API path. */
  url(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.config.baseUrl}${normalizedPath}`;
  }

  /** Gets the resolved client configuration. */
  getConfig(): ResolvedConfig {
    return { ...this.config };
  }
}
