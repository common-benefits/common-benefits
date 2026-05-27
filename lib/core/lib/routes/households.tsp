import "../models/index.tsp";
import "../pagination.tsp";
import "../responses/index.tsp";
import "../types.tsp";
import "@typespec/http";

namespace CommonBenefits.Routes;

using TypeSpec.Http;

/** A reusable interface for a Households router.
 *
 * To implement this interface, declare a namespace, instantiate the router
 * via `alias` (not `extends`), and decorate the namespace with `@route` and
 * `@tag` — those aren't inherited from the interface.
 */
@Versioning.added(Versions.v0_1)
interface Households {
  // ###############################
  // Create a household
  // ###############################

  /** Create a new household profile. */
  @summary("Create a household")
  @post
  @Versioning.added(Versions.v0_1)
  create(@body household: Models.HouseholdBase):
    | Responses.CreatedT<Models.HouseholdBase>
    | Responses.Unauthorized;

  // ###############################
  // Read a household
  // ###############################

  /** Retrieve a household profile by ID. */
  @summary("Read a household")
  @get
  @route("/{householdId}")
  @Versioning.added(Versions.v0_1)
  read(
    /** The unique identifier of the household. */
    @path householdId: Types.uuid,
  ): Responses.OkT<Models.HouseholdBase> | Responses.NotFound | Responses.Unauthorized;

  // ###############################
  // List enrollments for a household
  // ###############################

  /** List all enrollments for a household across all programs and
   * applications, including determination history.
   */
  @summary("List enrollments for a household")
  @get
  @route("/{householdId}/enrollments")
  @Versioning.added(Versions.v0_1)
  listEnrollments(
    /** The unique identifier of the household. */
    @path householdId: Types.uuid,

    /** Filter to a specific program. */
    @query programId?: Types.uuid,

    /** Filter by enrollment status value. */
    @query status?: string,

    ...Pagination.PaginatedQueryParams,
  ): Responses.PaginatedT<Models.EnrollmentBase> | Responses.NotFound | Responses.Unauthorized;
}
