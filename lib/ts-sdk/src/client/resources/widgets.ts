/**
 * Widgets resource.
 *
 * Dummy resource used to validate the client + extension scaffolding. Will be
 * replaced by a Programs resource once the TypeSpec `GET /programs/search`
 * route lands.
 *
 * Per-method `itemSchemas`, `defaultFiltersSchema`, and `customFiltersSchema`
 * are injected by `buildGetClient()`, so callers don't pass a `schema:` argument
 * at the call site (though `get`/`list`/`search` still accept a one-off override).
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
import { DefaultFilterSchema } from "../../schemas/filters";
import type { ResourceMethod, ResourceOptions } from "./base";

// =============================================================================
// Type aliases
// =============================================================================

type WidgetBase = z.infer<typeof WidgetBaseSchema>;

/** Zod schema whose `.parse()` output is at least a `WidgetBase`. */
type WidgetSchema<TOutput extends WidgetBase = WidgetBase> = z.ZodType<TOutput>;

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
  /**
   * Flat filter bag. `search()` routes protocol default filters to the top
   * level and nests custom filters (registered or ad hoc) under `customFilters`.
   */
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

/**
 * Widgets resource — `get`, `list`, `search`.
 *
 * Generic over the parsed item type (`TItem`) and the filters bag (`TFilters`)
 * so `buildGetClient()` can return a typed instance whose items expose typed
 * `customFields` and whose `search({ filters })` autocompletes the configured
 * default and custom filter names.
 */
export class Widgets<
  TItem extends WidgetBase = WidgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  private readonly client: Client;
  private readonly basePath: string;
  /** Per-method item schemas; a method falls back to {@link WidgetBaseSchema}. */
  private readonly itemSchemas: Partial<Record<ResourceMethod, z.ZodTypeAny>>;
  /** Protocol default-filters schema; its keys route to the top level of `filters`. */
  private readonly defaultFiltersSchema: z.ZodTypeAny | undefined;
  /** Registered custom-filters schema (`withCustomFilters()` output), if any. */
  private readonly customFiltersSchema: z.ZodTypeAny | undefined;

  constructor(options: ResourceOptions) {
    this.client = options.client;
    this.basePath = options.basePath ?? "/widgets";
    this.itemSchemas = options.itemSchemas ?? {};
    this.defaultFiltersSchema = options.defaultFiltersSchema;
    this.customFiltersSchema = options.customFiltersSchema;
  }

  /**
   * Resolve the schema for a method: an explicit per-call override, else the
   * method's bound schema, else the base schema.
   */
  private schemaFor<TOut extends WidgetBase>(
    method: ResourceMethod,
    override?: WidgetSchema<TOut>
  ): WidgetSchema<TOut> {
    return (override ??
      this.itemSchemas[method] ??
      WidgetBaseSchema) as unknown as WidgetSchema<TOut>;
  }

  /**
   * Split a flat filter bag into the protocol request shape, invisibly to the
   * caller. Keys matching the resource's protocol default filters go to the top
   * level of `filters`; every other key (registered custom filters and ad hoc
   * ones alike) nests under `filters.customFilters`.
   *
   * Validation, before the request is sent: standard keys against the
   * default-filters schema; registered custom keys against their declared
   * schema; ad hoc keys against the generic `DefaultFilterSchema`. Invalid
   * filters throw.
   */
  private categorizeFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const defaultShape =
      this.defaultFiltersSchema instanceof z.ZodObject ? this.defaultFiltersSchema.shape : {};
    const customShape = (
      this.customFiltersSchema instanceof z.ZodObject ? this.customFiltersSchema.shape : {}
    ) as Record<string, z.ZodTypeAny>;
    const defaultKeys = new Set(Object.keys(defaultShape));

    const standardInput: Record<string, unknown> = {};
    const customInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (defaultKeys.has(key)) standardInput[key] = value;
      else customInput[key] = value;
    }

    const standard =
      this.defaultFiltersSchema instanceof z.ZodObject
        ? (this.defaultFiltersSchema.parse(standardInput) as Record<string, unknown>)
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
   * the default filters plus a `customFilters` record.
   */
  private responseFilterSchema(): z.ZodTypeAny {
    const base =
      this.defaultFiltersSchema instanceof z.ZodObject ? this.defaultFiltersSchema : z.object({});
    return base.extend({
      customFilters: z.record(z.string(), DefaultFilterSchema).nullish(),
    });
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
    const schema = this.schemaFor("get", options?.schema);
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
    const schema = this.schemaFor("list", options?.schema);

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
   * Search widgets. Categorizes `filters` into standard vs custom and validates
   * each before sending the request (see {@link categorizeFilters}); surfaces
   * per-record parse failures the same way `list()` does.
   */
  async search<TOut extends WidgetBase = TItem>(
    options?: SearchOptions<TOut, TFilters>
  ): Promise<WidgetsSearchResult<TOut, TFilters>> {
    const schema = this.schemaFor("search", options?.schema);
    const body: Record<string, unknown> = {};
    if (options?.query) body.search = options.query;
    if (options?.filters) {
      body.filters = this.categorizeFilters(options.filters);
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
      const envelope = FilteredSchema(z.unknown(), this.responseFilterSchema()).parse(json);
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
