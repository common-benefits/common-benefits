/**
 * Widgets resource.
 *
 * Dummy resource used to validate the client + extension scaffolding. Will be
 * replaced by a Programs resource once the TypeSpec `GET /programs/search`
 * route lands.
 *
 * `defaultItemSchema` and `filtersSchema` are injected by `buildGetClient()`
 * — callers don't pass a `schema:` argument at the call site.
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
import { WidgetBaseSchema } from "../../schemas/widget";

// =============================================================================
// Type aliases
// =============================================================================

type WidgetBase = z.infer<typeof WidgetBaseSchema>;

/** Zod schema whose `.parse()` output is at least a `WidgetBase`. */
type WidgetSchema<TOutput extends WidgetBase = WidgetBase> = z.ZodType<TOutput>;

/** Zod schema validating a `filters` bag. */
type FiltersSchema<TFilters extends Record<string, unknown>> = z.ZodType<TFilters>;

// =============================================================================
// Options
// =============================================================================

export interface ListOptions<TOut extends WidgetBase = WidgetBase> {
  /** Specific page to fetch (disables auto-pagination when set) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Maximum items across all pages */
  maxItems?: number;
  /** Abort signal */
  signal?: AbortSignal;
  /**
   * Override the schema used to parse items for this call only. Defaults to the
   * schema bound at build time (the base schema, or a plugin's extended schema).
   */
  schema?: WidgetSchema<TOut>;
}

export interface SearchOptions<
  TOut extends WidgetBase = WidgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> extends ListOptions<TOut> {
  /** Optional free-text query */
  query?: string;
  /** Per-route filter bag (validated against `filtersSchema` when provided) */
  filters?: TFilters;
}

// =============================================================================
// Results
// =============================================================================

/** Result of `widgets.list`: paginated, per-item parsed. */
export type WidgetsListResult<T> = Omit<Paginated<unknown>, "items"> & {
  /** Per-item parse results — bad rows surface as `{ ok: false, error }`. */
  items: ParsedItem<T>[];
  /** Flat list of parse errors (empty when all items parsed). */
  parseErrors: ReturnType<typeof parseBatch>["errors"];
};

/** Result of `widgets.search`: list result + sort/filter info. */
export type WidgetsSearchResult<T, F> = WidgetsListResult<T> &
  Pick<Filtered<unknown, F>, "filterInfo" | "sortInfo">;

// =============================================================================
// Resource
// =============================================================================

/** Constructor options for {@link Widgets}. */
export interface WidgetsOptions<
  TItem extends WidgetBase = WidgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  client: Client;
  /** Override the default `/widgets` path. */
  basePath?: string;
  /** Schema used to parse individual items (defaults to {@link WidgetBaseSchema}). */
  defaultItemSchema?: WidgetSchema<TItem>;
  /** Zod schema validating the `filters` bag on `search()`. */
  filtersSchema?: FiltersSchema<TFilters>;
}

/**
 * Widgets resource — `get`, `list`, `search`.
 *
 * Generic over the parsed item type (`TItem`) and the filters bag (`TFilters`)
 * so `buildGetClient()` can return a typed instance whose items expose typed
 * `customFields` and whose `search({ filters })` autocompletes the configured
 * filter names.
 */
export class Widgets<
  TItem extends WidgetBase = WidgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  private readonly client: Client;
  private readonly basePath: string;
  private readonly itemSchema: WidgetSchema<TItem>;
  private readonly filtersSchema: FiltersSchema<TFilters> | undefined;

  constructor(options: WidgetsOptions<TItem, TFilters>) {
    this.client = options.client;
    this.basePath = options.basePath ?? "/widgets";
    this.itemSchema = (options.defaultItemSchema ??
      (WidgetBaseSchema as unknown as WidgetSchema<TItem>)) as WidgetSchema<TItem>;
    this.filtersSchema = options.filtersSchema;
  }

  /**
   * Fetch a single widget by id. Throws if the response fails to parse.
   *
   * Pass `options.schema` to parse this call with a one-off schema; otherwise
   * the schema bound at build time is used.
   */
  async get<TOut extends WidgetBase = TItem>(
    id: string,
    options?: { schema?: WidgetSchema<TOut> }
  ): Promise<TOut> {
    const schema = (options?.schema ?? this.itemSchema) as unknown as WidgetSchema<TOut>;
    const response = await this.client.get(`${this.basePath}/${id}`);
    if (!response.ok) {
      throw new ApiError(`Failed to get widget ${id}: ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        path: `${this.basePath}/${id}`,
      });
    }

    const json = await response.json();
    const envelope = OkSchema(schema).parse(json);
    return envelope.data as TOut;
  }

  /**
   * List widgets with auto-pagination. Per-record parse failures are reported
   * via `items[i].ok === false` and aggregated in `parseErrors`.
   */
  async list<TOut extends WidgetBase = TItem>(
    options?: ListOptions<TOut>
  ): Promise<WidgetsListResult<TOut>> {
    const schema = (options?.schema ?? this.itemSchema) as unknown as WidgetSchema<TOut>;

    if (options?.page !== undefined) {
      const params: Record<string, number> = { page: options.page };
      if (options.pageSize) params.pageSize = options.pageSize;

      const response = await this.client.get(this.basePath, {
        params,
        signal: options.signal,
      });
      if (!response.ok) {
        throw new ApiError(`Failed to list widgets: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          path: this.basePath,
        });
      }
      const json = await response.json();
      const envelope = PaginatedSchema(z.unknown()).parse(json);
      const parsed = parseBatch(schema, envelope.items, "widgets.list");
      return {
        ...envelope,
        items: parsed.items,
        parseErrors: parsed.errors,
      };
    }

    const envelope = await this.client.fetchMany(this.basePath, {
      page: options?.page,
      pageSize: options?.pageSize,
      maxItems: options?.maxItems,
      signal: options?.signal,
    });
    const parsed = parseBatch(schema, envelope.items, "widgets.list");
    return {
      ...envelope,
      items: parsed.items,
      parseErrors: parsed.errors,
    };
  }

  /**
   * Search widgets. Validates `filters` against the bound `filtersSchema`
   * before sending the request; surfaces per-record parse failures the same
   * way `list()` does.
   */
  async search<TOut extends WidgetBase = TItem>(
    options?: SearchOptions<TOut, TFilters>
  ): Promise<WidgetsSearchResult<TOut, TFilters>> {
    const schema = (options?.schema ?? this.itemSchema) as unknown as WidgetSchema<TOut>;
    const body: Record<string, unknown> = {};
    if (options?.query) body.search = options.query;
    if (options?.filters) {
      if (this.filtersSchema) {
        body.filters = this.filtersSchema.parse(options.filters);
      } else {
        body.filters = options.filters;
      }
    }

    const path = `${this.basePath}/search`;

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
        throw new ApiError(`Failed to search widgets: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          path,
        });
      }
      const json = await response.json();
      const filterSchema = this.filtersSchema ?? z.unknown();
      const envelope = FilteredSchema(z.unknown(), filterSchema).parse(json);
      const parsed = parseBatch(schema, envelope.items, "widgets.search");
      return {
        ...envelope,
        items: parsed.items,
        parseErrors: parsed.errors,
      } as WidgetsSearchResult<TOut, TFilters>;
    }

    const envelope = await this.client.fetchMany(path, {
      method: "POST",
      body,
      page: options?.page,
      pageSize: options?.pageSize,
      maxItems: options?.maxItems,
      signal: options?.signal,
    });
    const parsed = parseBatch(schema, envelope.items, "widgets.search");
    const filterInfo = (envelope as unknown as { filterInfo?: { filters: TFilters } }).filterInfo;
    const sortInfo = (envelope as unknown as { sortInfo?: unknown }).sortInfo;
    return {
      ...envelope,
      items: parsed.items,
      parseErrors: parsed.errors,
      filterInfo: filterInfo as WidgetsSearchResult<TOut, TFilters>["filterInfo"],
      sortInfo: sortInfo as WidgetsSearchResult<TOut, TFilters>["sortInfo"],
    };
  }
}
