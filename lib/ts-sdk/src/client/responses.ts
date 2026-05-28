/**
 * Generic response envelope types and Zod schemas.
 *
 * `Ok<T>`, `Paginated<T>`, `Sorted<T>`, `Filtered<T,F>` mirror the protocol's
 * success-response envelopes. The companion `OkSchema(...)`, `PaginatedSchema(...)`,
 * etc. factories produce Zod schemas wrapping a caller-supplied item schema.
 */

import { z } from "zod";

// ############################################################################
// Pagination + sorting metadata
// ############################################################################

export const PaginatedResultsInfoSchema = z.object({
  /** Current page number (indexing starts at 1) */
  page: z.number().int().min(1),

  /** Number of items per page (0 when the page is empty) */
  pageSize: z.number().int().min(0),

  /** Total number of items across all pages */
  totalItems: z.number().int().nullish(),

  /** Total number of pages */
  totalPages: z.number().int().nullish(),
});

export const SortOrderEnum = z.enum(["asc", "desc"]);

export const SortedResultsInfoSchema = z.object({
  /** The field results are sorted by, or "custom" if an implementation-defined sort key is used */
  sortBy: z.string(),

  /** Implementation-defined sort key used to sort the results, if applicable */
  customSortBy: z.string().nullish(),

  /** The order in which the results are sorted */
  sortOrder: SortOrderEnum,

  /** Non-fatal errors that occurred during sorting */
  errors: z.array(z.string()).nullish(),
});

/** Pagination parameters allowed in request bodies. */
export const PaginatedBodyParamsSchema = z.object({
  page: z.number().int().min(1).nullish().default(1),
  pageSize: z.number().int().min(1).nullish().default(100),
});

// ############################################################################
// Success envelopes
// ############################################################################

export const SuccessSchema = z.object({
  /** HTTP status code */
  status: z.number().int(),

  /** Success message */
  message: z.string(),
});

/** Wraps an item schema as `{ status, message, data: T }`. */
export const OkSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  SuccessSchema.extend({
    data: dataSchema,
  });

/** Wraps an item schema as `{ status, message, items: T[], paginationInfo }`. */
export const PaginatedSchema = <T extends z.ZodTypeAny>(itemsSchema: T) =>
  SuccessSchema.extend({
    items: z.array(itemsSchema),
    paginationInfo: PaginatedResultsInfoSchema,
  });

/** Adds `sortInfo` to the paginated envelope. */
export const SortedSchema = <T extends z.ZodTypeAny>(itemsSchema: T) =>
  PaginatedSchema(itemsSchema).extend({
    sortInfo: SortedResultsInfoSchema,
  });

/** Adds `filterInfo` (typed by `filterSchema`) to the sorted envelope. */
export const FilteredSchema = <ItemsT extends z.ZodTypeAny, FilterT extends z.ZodTypeAny>(
  itemsSchema: ItemsT,
  filterSchema: FilterT
) =>
  SortedSchema(itemsSchema).extend({
    filterInfo: z
      .object({
        filters: filterSchema,
        errors: z.array(z.string()).nullish(),
      })
      .strict(),
  });

// ############################################################################
// Error envelopes
// ############################################################################

export const ErrorSchema = z.object({
  status: z.number().int(),
  message: z.string(),
  errors: z.array(z.unknown()),
});

// ############################################################################
// Inferred response types
// ############################################################################

export type Success = z.infer<typeof SuccessSchema>;
export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type PaginatedResultsInfo = z.infer<typeof PaginatedResultsInfoSchema>;
export type SortedResultsInfo = z.infer<typeof SortedResultsInfoSchema>;
export type PaginatedBodyParams = z.input<typeof PaginatedBodyParamsSchema>;

/** Generic OK response. */
export type Ok<T> = Success & { data: T };

/** Generic paginated response. */
export type Paginated<T> = Success & {
  items: T[];
  paginationInfo: PaginatedResultsInfo;
};

/** Paginated + sort info. */
export type Sorted<T> = Paginated<T> & {
  sortInfo: SortedResultsInfo;
};

/** Sorted + filter info (typed filters bag). */
export type Filtered<T, F> = Sorted<T> & {
  filterInfo: {
    filters: F;
    errors?: string[] | null | undefined;
  };
};
