import "../models/index.tsp";
import "../pagination.tsp";
import "../responses/index.tsp";
import "../types.tsp";
import "@typespec/http";

namespace CommonBenefits.Routes;

using TypeSpec.Http;

/** A reusable interface for an Application Packages router. */
@Versioning.added(Versions.v0_1)
interface Packages {
  // ###############################
  // List packages
  // ###############################

  /** List available application packages. */
  @summary("List application packages")
  @get
  @Versioning.added(Versions.v0_1)
  list(
    /** Filter by jurisdiction GEO identifier (e.g., `US-CO`). */
    @query jurisdictionGeoId?: string,

    /** Filter to packages that include a given program. */
    @query programId?: Types.uuid,

    /** Filter by status value. Defaults to `active` when omitted. */
    @query status?: string,

    ...Pagination.PaginatedQueryParams,
  ): Responses.PaginatedT<Models.AppPackageBase> | Responses.Unauthorized;

  // ###############################
  // Read a package
  // ###############################

  /** Retrieve a single application package by ID, including its full
   * program and form lists.
   */
  @summary("Read an application package")
  @get
  @route("/{packageId}")
  @Versioning.added(Versions.v0_1)
  read(
    /** The unique identifier of the application package. */
    @path packageId: Types.uuid,
  ): Responses.OkT<Models.AppPackageBase> | Responses.NotFound | Responses.Unauthorized;
}
