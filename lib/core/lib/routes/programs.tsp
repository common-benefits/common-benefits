import "../models/index.tsp";
import "../pagination.tsp";
import "../responses/index.tsp";
import "../types.tsp";
import "@typespec/http";

namespace CommonBenefits.Routes;

using TypeSpec.Http;

/** A reusable interface for a Programs router. */
@Versioning.added(Versions.v0_1)
interface Programs {
  // ###############################
  // List programs
  // ###############################

  /** List programs available for screening. */
  @summary("List programs")
  @get
  @Versioning.added(Versions.v0_1)
  list(
    /** Return all implementations of a given parent program. */
    @query parentProgramId?: Types.uuid,

    /** Filter by jurisdiction level (e.g., `federal`, `state`). */
    @query jurisdictionLevel?: string,

    /** Filter by jurisdiction GEO identifier (e.g., `US-CO` for Colorado programs). */
    @query jurisdictionGeoId?: string,

    ...Pagination.PaginatedQueryParams,
  ): Responses.PaginatedT<Models.ProgramBase> | Responses.Unauthorized;

  // ###############################
  // Read a program
  // ###############################

  /** Retrieve a single program by ID. */
  @summary("Read a program")
  @get
  @route("/{programId}")
  @Versioning.added(Versions.v0_1)
  read(
    /** The unique identifier of the program. */
    @path programId: Types.uuid,
  ): Responses.OkT<Models.ProgramBase> | Responses.NotFound | Responses.Unauthorized;
}
