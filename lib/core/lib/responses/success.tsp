import "../pagination.tsp";
import "../sorting.tsp";
import "@typespec/http";

namespace CommonBenefits.Responses;

// ############################################################################
// Default success response
// ############################################################################

@Versioning.added(Versions.v0_1)
model Success {
  @example(200)
  status: int32;

  @example("Success")
  message: string;
}

// ############################################################################
// 200 response
// ############################################################################

/** Template for a 200 response with data.
 *
 * @template T The schema for the value of the `"data"` property in this response.
 * @example How to specify a custom 200 response model
 *
 * ```typespec
 * model CustomModel {
 *   id: string;
 *   description: string;
 * }
 *
 * alias CustomModel200 = Responses.Ok<CustomModel>;
 * ```
 */
@doc("A 200 response with data")
@Versioning.added(Versions.v0_1)
model Ok<T> extends Success {
  ...Http.OkResponse;

  /** Response data. */
  data: T;
}

// ############################################################################
// 200 paginated response
// ############################################################################

/** Template for a 200 response with a paginated list of items.
 *
 * @template T The schema for the value of the `"items"` property in this response.
 */
@doc("A 200 response with a paginated list of items")
@Versioning.added(Versions.v0_1)
model Paginated<T> extends Success {
  ...Http.OkResponse;

  /** Items from the current page. */
  @pageItems
  items: T[];

  /** Details about the paginated results. */
  paginationInfo: Pagination.PaginatedResultsInfo;
}

// ############################################################################
// 200 sorted response
// ############################################################################

/** A paginated list of items with a sort order.
 *
 * @template T The schema for the value of the `"items"` property in this response.
 */
@doc("A paginated list of items with a sort order")
@Versioning.added(Versions.v0_1)
model Sorted<T> {
  ...Paginated<T>;

  /** The sort order of the items. */
  sortInfo: Sorting.SortedResultsInfo;
}

// ############################################################################
// 200 filtered response
// ############################################################################

/** A paginated list of items with a filter.
 *
 * @template ItemsT The schema for the value of the `"items"` property in this response.
 * @template FilterT The schema for the value of the `"filter"` property in this response.
 */
@doc("A paginated list of items with a filter")
@Versioning.added(Versions.v0_1)
model Filtered<ItemsT, FilterT> extends Success {
  ...Sorted<ItemsT>;

  /** The filters applied to the response items. */
  filterInfo: {
    filters: FilterT;

    /** Non-fatal errors that occurred during filtering. */
    errors?: string[];
  };
}

// ############################################################################
// 201 response
// ############################################################################

/** A 201 response with data.
 *
 * @template T The schema for the value of the `"data"` property in this response.
 */
@Versioning.added(Versions.v0_1)
model Created<T> extends Success {
  ...Http.CreatedResponse;

  /** Response data. */
  data: T;
}
