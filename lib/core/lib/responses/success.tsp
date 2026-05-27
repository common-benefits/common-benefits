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
  status: numeric;

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
  // Concrete (documentation) responses pin the body `status` as a literal. The
  // HTTP status code is carried by the templated `*T` variants via
  // `...Http.*Response`, which are the models actually used by routes.
  status: 200;

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
model OkT<T> extends Ok {
  ...Http.OkResponse;

  /** Response data. */
  data: T;
}

// ############################################################################
// 200 paginated response
// ############################################################################

/** Body shape shared by `Paginated` and `PaginatedT<T>`. Templates do not emit
 * a standalone schema, so the concrete `Paginated` is `is PaginatedBase<unknown>`
 * and the route response is `extends PaginatedBase<T>`. Both stay in sync.
 *
 * @template T The schema for the value of the `"items"` property.
 */
@Versioning.added(Versions.v0_1)
model PaginatedBase<T> extends Success {
  status: 200;

  /** Items from the current page. */
  @pageItems
  items: T[];

  /** Details about the paginated results. */
  paginationInfo: Pagination.PaginatedResultsInfo;
}

/** A 200 response with a paginated list of items of an unspecified shape.
 *
 * For a typed variant, see `PaginatedT<T>`.
 */
@doc("A 200 response with a paginated list of items")
@Versioning.added(Versions.v0_1)
model Paginated is PaginatedBase<unknown>;

/** Template for a 200 response with a paginated list of typed items.
 *
 * @template T The schema for the value of the `"items"` property in this response.
 */
@doc("A 200 response with a paginated list of typed items")
@Versioning.added(Versions.v0_1)
model PaginatedT<T> extends PaginatedBase<T> {
  ...Http.OkResponse;
}

// ############################################################################
// 200 sorted response
// ############################################################################

/** Body shape shared by `Sorted` and `SortedT<T>`.
 *
 * @template T The schema for the value of the `"items"` property.
 */
@Versioning.added(Versions.v0_1)
model SortedBase<T> {
  ...PaginatedBase<T>;

  /** The sort order of the items. */
  sortInfo: Sorting.SortedResultsInfo;
}

/** A paginated list of items with a sort order. */
@doc("A paginated list of items with a sort order")
@Versioning.added(Versions.v0_1)
model Sorted is SortedBase<unknown>;

/** A paginated list of typed items with a sort order.
 *
 * @template T The schema for the value of the `"items"` property in this response.
 */
@doc("A paginated list of typed items with a sort order")
@Versioning.added(Versions.v0_1)
model SortedT<T> extends SortedBase<T> {
  ...Http.OkResponse;
}

// ############################################################################
// 200 filtered response
// ############################################################################

/** Body shape shared by `Filtered` and `FilteredT<ItemsT, FilterT>`.
 *
 * @template ItemsT The schema for the value of the `"items"` property.
 * @template FilterT The schema for the value of the `"filters"` property.
 */
@Versioning.added(Versions.v0_1)
model FilteredBase<ItemsT, FilterT> {
  ...SortedBase<ItemsT>;

  /** The filters applied to the response items. */
  filterInfo: {
    filters: FilterT;

    /** Non-fatal errors that occurred during filtering. */
    errors?: string[];
  };
}

/** A paginated list of items with a filter applied. */
@doc("A paginated list of items with a filter")
@Versioning.added(Versions.v0_1)
model Filtered is FilteredBase<unknown, unknown>;

/** A paginated list of typed items with a typed filter applied.
 *
 * @template ItemsT The schema for the value of the `"items"` property in this response.
 * @template FilterT The schema for the value of the `"filter"` property in this response.
 */
@doc("A paginated list of typed items with a typed filter")
@Versioning.added(Versions.v0_1)
model FilteredT<ItemsT, FilterT> extends FilteredBase<ItemsT, FilterT> {
  ...Http.OkResponse;
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
  status: 201;

  /** Response data. */
  data: unknown;
}

/** A 201 response with typed data.
 *
 * @template T The schema for the value of the `"data"` property in this response.
 */
@Versioning.added(Versions.v0_1)
model CreatedT<T> extends Created {
  ...Http.CreatedResponse;

  /** Response data. */
  data: T;
}
