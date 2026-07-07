/**
 * Widgets resource — `get`, `list`, `search`.
 *
 * Dummy resource used to validate the client + extension scaffolding. Will be
 * replaced by a Programs resource once the TypeSpec `GET /programs/search`
 * route lands.
 *
 * The shared `get` / `list` / filtered-request plumbing lives on {@link Resource};
 * this class binds the Widget base schema and exposes the public verbs. Generic
 * over the parsed item type (`TItem`) and the filters bag (`TFilters`) so
 * `buildGetClient()` returns a typed instance whose items expose typed
 * `customFields` and whose `search({ filters })` autocompletes the configured
 * default and custom filter names.
 */

import { z } from "zod";
import { WidgetBaseSchema } from "../../schemas/widget";
import {
  Resource,
  type FilteredRequestOptions,
  type ListOptions,
  type ListResult,
  type ResourceOptions,
  type SearchResult,
} from "./base";

type WidgetBase = z.infer<typeof WidgetBaseSchema>;

/** Zod schema whose `.parse()` output is at least a `WidgetBase`. */
type WidgetSchema<TOutput extends WidgetBase = WidgetBase> = z.ZodType<TOutput>;

export type SearchOptions<
  TOut extends WidgetBase = WidgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> = Pick<
  FilteredRequestOptions<TOut, TFilters>,
  "page" | "pageSize" | "maxItems" | "signal" | "schema" | "query" | "filters"
>;

/** Result of `widgets.list`: paginated, per-item parsed. */
export type WidgetsListResult<T> = ListResult<T>;

/** Result of `widgets.search`: list result + sort/filter info. */
export type WidgetsSearchResult<T, F> = SearchResult<T, F>;

export class Widgets<
  TItem extends WidgetBase = WidgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> extends Resource<TItem, TFilters> {
  constructor(options: ResourceOptions) {
    super(options, "/widgets");
  }

  protected baseSchema(): z.ZodTypeAny {
    return WidgetBaseSchema;
  }

  /**
   * Fetch a single widget by id. Throws if the response fails to parse. Pass
   * `options.schema` to parse this call with a one-off schema.
   */
  async get<TOut extends WidgetBase = TItem>(
    id: string,
    options?: { schema?: WidgetSchema<TOut> }
  ): Promise<TOut> {
    return this.getOne(id, options?.schema);
  }

  /** List widgets with auto-pagination; per-record parse failures are isolated. */
  async list<TOut extends WidgetBase = TItem>(
    options?: ListOptions<TOut>
  ): Promise<WidgetsListResult<TOut>> {
    return this.listMany("widgets.list", options);
  }

  /**
   * Search widgets. Categorizes `filters` into standard vs custom and validates
   * each before sending; surfaces per-record parse failures like `list()`.
   */
  async search<TOut extends WidgetBase = TItem>(
    options?: SearchOptions<TOut, TFilters>
  ): Promise<WidgetsSearchResult<TOut, TFilters>> {
    return this.filteredRequest(`${this.basePath}/search`, "widgets.search", options);
  }
}
