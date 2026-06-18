/**
 * Gadgets resource — `get`, `list`, `search`, `history`.
 *
 * A second placeholder resource that proves the client surface is not bound to
 * a single resource, and demonstrates a filterable verb other than `search`:
 * `history` POSTs to `${basePath}/history` with its own standard-filter set
 * (`actor`) and a non-filter `since` body field. Mirrors
 * `py-sdk .../client/resources/gadgets.py`.
 */

import { z } from "zod";
import { GadgetBaseSchema, GadgetHistoryFiltersSchema } from "../../schemas/gadget";
import {
  Resource,
  type ListOptions,
  type ListResult,
  type ResourceOptions,
  type SearchResult,
} from "./base";

type GadgetBase = z.infer<typeof GadgetBaseSchema>;

type GadgetSchema<TOutput extends GadgetBase = GadgetBase> = z.ZodType<TOutput>;

export interface GadgetSearchOptions<
  TOut extends GadgetBase = GadgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> extends ListOptions<TOut> {
  query?: string;
  filters?: TFilters;
}

/** Filters accepted by the `history` verb (standard key: `actor`). */
export interface GadgetHistoryOptions<
  TOut extends GadgetBase = GadgetBase,
> extends ListOptions<TOut> {
  /** Only return history entries at or after this ISO datetime. */
  since?: string;
  /** Flat filter bag; `actor` routes to the top level, everything else to `customFilters`. */
  filters?: Record<string, unknown>;
}

export class Gadgets<
  TItem extends GadgetBase = GadgetBase,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> extends Resource<TItem, TFilters> {
  constructor(options: ResourceOptions) {
    super(options, "/gadgets");
  }

  protected baseSchema(): z.ZodTypeAny {
    return GadgetBaseSchema;
  }

  async get<TOut extends GadgetBase = TItem>(
    id: string,
    options?: { schema?: GadgetSchema<TOut> }
  ): Promise<TOut> {
    return this.getOne(id, options?.schema);
  }

  async list<TOut extends GadgetBase = TItem>(
    options?: ListOptions<TOut>
  ): Promise<ListResult<TOut>> {
    return this.listMany("gadgets.list", options);
  }

  async search<TOut extends GadgetBase = TItem>(
    options?: GadgetSearchOptions<TOut, TFilters>
  ): Promise<SearchResult<TOut, TFilters>> {
    return this.filteredRequest(`${this.basePath}/search`, "gadgets.search", options);
  }

  /**
   * A second filterable verb: the gadget's change history. Routes the `actor`
   * standard filter to the top level and any other key to `customFilters`, and
   * sends `since` as an extra top-level body field.
   */
  async history<TOut extends GadgetBase = TItem>(
    options?: GadgetHistoryOptions<TOut>
  ): Promise<SearchResult<TOut, TFilters>> {
    return this.filteredRequest(`${this.basePath}/history`, "gadgets.history", {
      ...options,
      filters: options?.filters as TFilters | undefined,
      standardFiltersSchema: GadgetHistoryFiltersSchema,
      customFiltersSchema: undefined,
      extra: options?.since !== undefined ? { since: options.since } : undefined,
    });
  }
}
