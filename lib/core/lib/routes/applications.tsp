import "../models/index.tsp";
import "../responses/index.tsp";
import "../types.tsp";
import "@typespec/http";

namespace CommonBenefits.Routes;

using TypeSpec.Http;

/** Request body for submitting an application. The application's
 * `householdId` is supplied via the path; the server resolves which
 * programs to enroll the household in from the package's `programs` list.
 */
@Versioning.added(Versions.v0_1)
model ApplicationSubmissionRequest {
  /** The application package being submitted. */
  packageId: Types.uuid;

  /** Form responses keyed by form identifier. */
  formResponses?: Record<Models.AppFormResponse>;
}

/** A reusable interface for an Applications router. */
@Versioning.added(Versions.v0_1)
interface Applications {
  // ###############################
  // Submit an application
  // ###############################

  /** Submit an application for one or more programs. Creates one Enrollment
   * per program, triggers determination, and returns the application with
   * abbreviated enrollment records inline.
   */
  @summary("Submit an application")
  @post
  @Versioning.added(Versions.v0_1)
  submit(
    /** The unique identifier of the household submitting the application. */
    @path householdId: Types.uuid,

    @body application: ApplicationSubmissionRequest,
  ): Responses.CreatedT<Models.ApplicationBase> | Responses.NotFound | Responses.Unauthorized;
}
