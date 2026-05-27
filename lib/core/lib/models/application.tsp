import "../fields/index.tsp";
import "../types.tsp";
import "./app-package.tsp";
import "./enrollment.tsp";

namespace CommonBenefits.Models;

// #########################################################
// AppStatus
// #########################################################

/** Predefined set of application statuses.
 *
 * - `draft`: The application is being filled out.
 * - `submitted`: The application has been submitted for processing.
 * - `withdrawn`: The application was withdrawn by the household.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum AppStatusOptions {
  draft,
  submitted,
  withdrawn,
  custom,
}

/** The status of an application. */
@Versioning.added(Versions.v0_1)
model AppStatus is Fields.ExtensibleEnumT<AppStatusOptions>;

// #########################################################
// AppFormResponse
// #########################################################

/** A response to a single form within an application, captured as a snapshot
 * at submission time.
 */
@example(Examples.Application.jointSnapMedicaidResponse)
@Versioning.added(Versions.v0_1)
model AppFormResponse {
  /** The unique identifier of the form. */
  formId: Types.uuid;

  /** The semantic version of the form. */
  formVersion: string;

  /** A map of question IDs to submitted answers. */
  responses: Record<unknown>;
}

// #########################################################
// ApplicationBase
// #########################################################

/** A submission event linking a Household to one or more Programs. Carries a
 * snapshot of the form responses submitted. Creates one Enrollment per
 * program on submission, surfaced inline as `enrollments`.
 */
@example(Examples.Application.submitted)
@Versioning.added(Versions.v0_1)
model ApplicationBase {
  /** The application's unique identifier. */
  id: Types.uuid;

  /** The household this application is for. */
  householdId: Types.uuid;

  /** The application package being submitted. The server resolves which
   * programs the household is enrolled in based on the package's `programs`
   * list — clients do not specify programs directly.
   */
  packageId: Types.uuid;

  /** Form responses keyed by form identifier. */
  formResponses?: Record<AppFormResponse>;

  /** The status of the application. */
  status: AppStatus;

  /** The timestamp at which the application was submitted. Null while `draft`. */
  submittedAt?: utcDateTime | null;

  /** Non-fatal validation errors that occurred during submission. */
  validationErrors?: Array<unknown>;

  /** Implementation-defined custom fields. */
  customFields?: Record<Fields.CustomField>;

  /** Abbreviated enrollment records created by this application. */
  enrollments?: EnrollmentRef[];

  /** Standard system metadata (createdAt, lastModifiedAt). */
  ...Fields.SystemMetadata;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.Application {
  const jointSnapMedicaidResponse = #{
    formId: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
    formVersion: "1.0.0",
    responses: #{ household_size: 3, monthly_earned_income: "2500", residential_state: "CO" },
  };

  const submitted = #{
    id: "40a12e5e-5940-4c08-921c-17a8960fcf4b",
    householdId: "50a12e5e-5940-4c08-921c-17a8960fcf4b",
    packageId: "60a12e5e-5940-4c08-921c-17a8960fcf4b",
    formResponses: #{ joint: jointSnapMedicaidResponse },
    status: #{ value: AppStatusOptions.submitted, description: "" },
    submittedAt: utcDateTime.fromISO("2026-05-24T10:30:00Z"),
    createdAt: utcDateTime.fromISO("2026-05-24T10:28:00Z"),
    lastModifiedAt: utcDateTime.fromISO("2026-05-24T10:30:00Z"),
  };
}
