/**
 * Shared base for client resources.
 *
 * `Resource<TItem, TFilters>` carries the construction contract and the helpers
 * every resource reuses: per-method schema resolution, filter categorization
 * (standard keys to the top level, everything else to `customFilters`), and the
 * `get` / `list` / filtered-request plumbing. Concrete resources (`Widgets`,
 * `Gadgets`) subclass it, bind their base schema, and add their own verbs —
 * mirroring `py-sdk .../client/resources/base.py`.
 *
 * Schemas are loosely typed here (`ZodTypeAny`); each resource narrows them at
 * the type layer, and the precise per-resource instance types are recovered in
 * `build-get-client.ts`.
 */

import { z } from "zod";
import type { Client } from "../client";
import { ApiError } from "../errors";
import { parseBatch, type ParsedItem } from "../results";
import {
  FilteredSchema,
  OkSchema,
  PaginatedSchema,
  type Filtered,
  type Paginated,
} from "../responses";
import { DefaultFilterSchema } from "../../schemas/filters";

// =============================================================================
// Construction contract
// =============================================================================

/** Resource methods that can be bound to a Zod schema. */
export type ResourceMethod = "get" | "list" | "search";

/** Options accepted by every resource constructor. */
export interface ResourceOptions {
  /** HTTP client used for requests. */
  client: Client;
  /** Override the resource's default base path. */
  basePath?: string;
  /**
   * Per-method item schemas used to parse responses. Each is the plugin's
   * extended `commonSchema` (from `withCustomFields()`) or the model's base
   * schema; a method can bind a different schema than another. A method falls
   * back to the resource's own base schema when omitted.
   */
  itemSchemas?: Partial<Record<ResourceMethod, z.ZodTypeAny>>;
  /** Protocol-defined ("standard") filters for the resource's search route. */
  defaultFiltersSchema?: z.ZodTypeAny;
  /** Registered custom filters (`withCustomFilters()` output), when the plugin declared any. */
  customFiltersSchema?: z.ZodTypeAny;
}

/** Constructor signature shared by all resource classes. */
export type ResourceConstructor = new (options: ResourceOptions) => object;

// =============================================================================
// Result types
// =============================================================================

/** Paginated, per-item-parsed result (bad rows surface as `{ ok: false, error }`). */
export type ListResult<T> = Omit<Paginated<unknown>, "items"> & {
  /** Per-item parse results. */
  items: ParsedItem<T>[];
  /** Flat list of parse errors (empty when all items parsed). */
  parseErrors: ReturnType<typeof parseBatch>["errors"];
};

/** List result plus the sort/filter info a filtered verb returns. */
export type SearchResult<T, F> = ListResult<T> &
  Pick<Filtered<unknown, F>, "filterInfo" | "sortInfo">;

// =============================================================================
// Method option bags
// =============================================================================

export interface ListOptions<TOut> {
  /** Specific page to fetch (disables auto-pagination when set) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Maximum items across all pages */
  maxItems?: number;
  /** Abort signal */
  signal?: AbortSignal;
  /** Override the item schema for this call only (defaults to the bound schema). */
  schema?: z.ZodType<TOut>;
}

export interface FilteredRequestOptions<
  TOut,
  TFilters extends Record<string, unknown>,
> extends ListOptions<TOut> {
  /** Optional free-text query. */
  query?: string;
  /** Flat filter bag; categorized into standard vs `customFilters` before the request. */
  filters?: TFilters;
  /**
   * The verb's standard-filters schema (its keys route to the top level).
   * Defaults to the resource's search default filters.
   */
  standardFiltersSchema?: z.ZodTypeAny;
  /**
   * The verb's registered custom-filters schema. Defaults to the resource's
   * registered custom filters. Unregistered keys still pass through.
   */
  customFiltersSchema?: z.ZodTypeAny;
  /** Extra top-level body fields merged into the request (e.g. history's `since`). */
  extra?: Record<string, unknown>;
}

// =============================================================================
// Resource base
// =============================================================================

export abstract class Resource<
  TItem,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  protected readonly client: Client;
  protected readonly basePath: string;
  protected readonly itemSchemas: Partial<Record<ResourceMethod, z.ZodTypeAny>>;
  protected readonly defaultFiltersSchema: z.ZodTypeAny | undefined;
  protected readonly customFiltersSchema: z.ZodTypeAny | undefined;

  constructor(options: ResourceOptions, defaultBasePath: string) {
    this.client = options.client;
    this.basePath = options.basePath ?? defaultBasePath;
    this.itemSchemas = options.itemSchemas ?? {};
    this.defaultFiltersSchema = options.defaultFiltersSchema;
    this.customFiltersSchema = options.customFiltersSchema;
  }

  /** Fallback item schema used when a method binds none. */
  protected abstract baseSchema(): z.ZodTypeAny;

  /**
   * Resolve the schema for a method: an explicit per-call override, else the
   * method's bound schema, else the resource's base schema.
   */
  protected schemaFor<TOut = TItem>(
    method: ResourceMethod,
    override?: z.ZodType<TOut>
  ): z.ZodType<TOut> {
    return (override ??
      this.itemSchemas[method] ??
      this.baseSchema()) as unknown as z.ZodType<TOut>;
  }

  /**
   * Split a flat filter bag into the protocol request shape. Keys named in
   * `standardSchema` go to the top level of `filters`; every other key
   * (registered custom filters and ad hoc ones alike) nests under
   * `filters.customFilters`. Standard keys validate against `standardSchema`,
   * registered custom keys against their declared schema, and ad hoc keys
   * against the generic `DefaultFilterSchema`. Invalid filters throw.
   */
  protected categorizeFilters(
    filters: Record<string, unknown>,
    standardSchema: z.ZodTypeAny | undefined,
    customSchema: z.ZodTypeAny | undefined
  ): Record<string, unknown> {
    const standardShape = standardSchema instanceof z.ZodObject ? standardSchema.shape : {};
    const customShape = (customSchema instanceof z.ZodObject ? customSchema.shape : {}) as Record<
      string,
      z.ZodTypeAny
    >;
    const standardKeys = new Set(Object.keys(standardShape));

    const standardInput: Record<string, unknown> = {};
    const customInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (standardKeys.has(key)) standardInput[key] = value;
      else customInput[key] = value;
    }

    const standard =
      standardSchema instanceof z.ZodObject
        ? (standardSchema.parse(standardInput) as Record<string, unknown>)
        : standardInput;

    const customFilters: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(customInput)) {
      const member = customShape[key];
      customFilters[key] = member ? member.parse(value) : DefaultFilterSchema.parse(value);
    }

    const out: Record<string, unknown> = { ...standard };
    if (Object.keys(customFilters).length > 0) out.customFilters = customFilters;
    return out;
  }

  /**
   * Zod schema for parsing the `filterInfo.filters` the server echoes back:
   * the standard filters plus a `customFilters` record.
   */
  protected responseFilterSchema(standardSchema: z.ZodTypeAny | undefined): z.ZodTypeAny {
    const base = standardSchema instanceof z.ZodObject ? standardSchema : z.object({});
    return base.extend({
      customFilters: z.record(z.string(), DefaultFilterSchema).nullish(),
    });
  }

  /**
   * Fetch a single item by id. Throws if the response fails to parse.
   */
  protected async getOne<TOut = TItem>(id: string, override?: z.ZodType<TOut>): Promise<TOut> {
    const schema = this.schemaFor("get", override);
    const path = `${this.basePath}/${id}`;
    const response = await this.client.get(path);
    if (!response.ok) {
      throw new ApiError(`Failed to get ${path}: ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        path,
      });
    }
    const json = await response.json();
    const envelope = OkSchema(schema).parse(json);
    return envelope.data as TOut;
  }

  /**
   * List items with auto-pagination. Per-record parse failures are reported via
   * `items[i].ok === false` and aggregated in `parseErrors`.
   */
  protected async listMany<TOut = TItem>(
    label: string,
    options?: ListOptions<TOut>
  ): Promise<ListResult<TOut>> {
    const schema = this.schemaFor("list", options?.schema);

    if (options?.page !== undefined) {
      const params: Record<string, number> = { page: options.page };
      if (options.pageSize) params.pageSize = options.pageSize;

      const response = await this.client.get(this.basePath, { params, signal: options.signal });
      if (!response.ok) {
        throw new ApiError(`Failed to ${label}: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          path: this.basePath,
        });
      }
      const json = await response.json();
      const envelope = PaginatedSchema(z.unknown()).parse(json);
      const parsed = parseBatch(schema, envelope.items, label);
      return { ...envelope, items: parsed.items, parseErrors: parsed.errors };
    }

    const envelope = await this.client.fetchMany(this.basePath, {
      page: options?.page,
      pageSize: options?.pageSize,
      maxItems: options?.maxItems,
      signal: options?.signal,
    });
    const parsed = parseBatch(schema, envelope.items, label);
    return { ...envelope, items: parsed.items, parseErrors: parsed.errors };
  }

  /**
   * Run a filtered POST verb (e.g. `search`, `history`): categorize + validate
   * `filters`, merge any `extra` body fields, send the request, and parse rows
   * the same way `list` does. Reused by every filterable method so each verb
   * gets identical categorize / passthrough / validate behavior with its own
   * standard-filter set.
   */
  protected async filteredRequest<TOut = TItem>(
    path: string,
    label: string,
    options?: FilteredRequestOptions<TOut, TFilters>
  ): Promise<SearchResult<TOut, TFilters>> {
    const schema = this.schemaFor("search", options?.schema);
    const standardSchema = options?.standardFiltersSchema ?? this.defaultFiltersSchema;
    const customSchema = options?.customFiltersSchema ?? this.customFiltersSchema;

    const body: Record<string, unknown> = { ...options?.extra };
    if (options?.query) body.search = options.query;
    if (options?.filters) {
      body.filters = this.categorizeFilters(options.filters, standardSchema, customSchema);
    }

    if (options?.page !== undefined) {
      const requestBody = {
        ...body,
        pagination: {
          page: options.page,
          ...(options.pageSize ? { pageSize: options.pageSize } : {}),
        },
      };
      const response = await this.client.post(path, requestBody, { signal: options.signal });
      if (!response.ok) {
        throw new ApiError(`Failed to ${label}: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          path,
        });
      }
      const json = await response.json();
      const envelope = FilteredSchema(z.unknown(), this.responseFilterSchema(standardSchema)).parse(
        json
      );
      const parsed = parseBatch(schema, envelope.items, label);
      return {
        ...envelope,
        items: parsed.items,
        parseErrors: parsed.errors,
      } as SearchResult<TOut, TFilters>;
    }

    const envelope = await this.client.fetchMany(path, {
      method: "POST",
      body,
      page: options?.page,
      pageSize: options?.pageSize,
      maxItems: options?.maxItems,
      signal: options?.signal,
    });
    const parsed = parseBatch(schema, envelope.items, label);
    const filterInfo = (envelope as unknown as { filterInfo?: { filters: TFilters } }).filterInfo;
    const sortInfo = (envelope as unknown as { sortInfo?: unknown }).sortInfo;
    return {
      ...envelope,
      items: parsed.items,
      parseErrors: parsed.errors,
      filterInfo: filterInfo as SearchResult<TOut, TFilters>["filterInfo"],
      sortInfo: sortInfo as SearchResult<TOut, TFilters>["sortInfo"],
    };
  }
}
