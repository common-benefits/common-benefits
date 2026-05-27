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

/** A 200 response with data of an unspecified shape.
 *
 * Use this when you need a concrete (non-generic) schema in the emitted
 * JSON Schema / OpenAPI output. For a typed variant, see `OkT<T>`.
 */
@doc("A 200 response with data")
@Versioning.added(Versions.v0_1)
model Ok extends Success {
  ...Http.OkResponse;

  /** Response data. */
  data: unknown;
}

/** Template for a 200 response with typed data.
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
 * alias CustomModel200 = Responses.OkT<CustomModel>;
 * ```
 */
@doc("A 200 response with typed data")
@Versioning.added(Versions.v0_1)
model OkT<T> extends Success {
  ...Http.OkResponse;

  /** Response data. */
  data: T;
}

// ############################################################################
// 200 paginated response
// ############################################################################

/** A 200 response with a paginated list of items of an unspecified shape.
 *
 * For a typed variant, see `PaginatedT<T>`.
 */
@doc("A 200 response with a paginated list of items")
@Versioning.added(Versions.v0_1)
model Paginated extends Success {
  ...Http.OkResponse;

  /** Items from the current page. */
  @pageItems
  items: unknown[];

  /** Details about the paginated results. */
  paginationInfo: Pagination.PaginatedResultsInfo;
}

/** Template for a 200 response with a paginated list of typed items.
 *
 * @template T The schema for the value of the `"items"` property in this response.
 */
@doc("A 200 response with a paginated list of typed items")
@Versioning.added(Versions.v0_1)
model PaginatedT<T> extends Success {
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

/** A paginated list of items with a sort order. */
@doc("A paginated list of items with a sort order")
@Versioning.added(Versions.v0_1)
model Sorted {
  ...Paginated;

  /** The sort order of the items. */
  sortInfo: Sorting.SortedResultsInfo;
}

/** A paginated list of typed items with a sort order.
 *
 * @template T The schema for the value of the `"items"` property in this response.
 */
@doc("A paginated list of typed items with a sort order")
@Versioning.added(Versions.v0_1)
model SortedT<T> {
  ...PaginatedT<T>;

  /** The sort order of the items. */
  sortInfo: Sorting.SortedResultsInfo;
}

// ############################################################################
// 200 filtered response
// ############################################################################

/** A paginated list of items with a filter applied. */
@doc("A paginated list of items with a filter")
@Versioning.added(Versions.v0_1)
model Filtered extends Success {
  ...Sorted;

  /** The filters applied to the response items. */
  filterInfo: {
    filters: unknown;

    /** Non-fatal errors that occurred during filtering. */
    errors?: string[];
  };
}

/** A paginated list of typed items with a typed filter applied.
 *
 * @template ItemsT The schema for the value of the `"items"` property in this response.
 * @template FilterT The schema for the value of the `"filter"` property in this response.
 */
@doc("A paginated list of typed items with a typed filter")
@Versioning.added(Versions.v0_1)
model FilteredT<ItemsT, FilterT> extends Success {
  ...SortedT<ItemsT>;

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

/** A 201 response with data of an unspecified shape.
 *
 * For a typed variant, see `CreatedT<T>`.
 */
@Versioning.added(Versions.v0_1)
model Created extends Success {
  ...Http.CreatedResponse;

  /** Response data. */
  data: unknown;
}

/** A 201 response with typed data.
 *
 * @template T The schema for the value of the `"data"` property in this response.
 */
@Versioning.added(Versions.v0_1)
model CreatedT<T> extends Success {
  ...Http.CreatedResponse;

  /** Response data. */
  data: T;
}
