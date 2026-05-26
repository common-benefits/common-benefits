import "../fields/index.tsp";
import "../types.tsp";
import "./eligibility-determination.tsp";

namespace CommonBenefits.Models;

// #########################################################
// EnrollmentStatus
// #########################################################

/** Predefined set of enrollment statuses.
 *
 * - `pending`: Enrollment is pending an eligibility determination.
 * - `active`: Enrollment is active.
 * - `denied`: Enrollment was denied.
 * - `closed`: Enrollment has been closed.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum EnrollmentStatusOptions {
  pending,
  active,
  denied,
  closed,
  custom,
}

/** The status of an enrollment. */
@Versioning.added(Versions.v0_1)
model EnrollmentStatus extends Fields.ExtensibleEnumT<EnrollmentStatusOptions> {}

// #########################################################
// EnrollmentRef
// #########################################################

/** A denormalized reference to an enrollment. Returned inline on responses
 * that need to point at enrollments without including the full record
 * (e.g., the `enrollments` field on ApplicationBase). Carries `programId`
 * and `status` so callers can disambiguate which enrollment they want to
 * follow up on without an extra `GET /households/{id}/enrollments`.
 */
@Versioning.added(Versions.v0_1)
model EnrollmentRef {
  /** The enrollment's unique identifier. Use with `GET /households/{id}/enrollments`. */
  id: Types.uuid;

  /** The program this enrollment is for. */
  programId: Types.uuid;

  /** The current status of the enrollment. */
  status: EnrollmentStatus;
}

// #########################################################
// EnrollmentBase
// #########################################################

/** The persistent relationship between a Household and a Program. Created
 * when an Application is submitted. Accumulates EligibilityDeterminations
 * over time.
 */
@example(Examples.Enrollment.active)
@Versioning.added(Versions.v0_1)
model EnrollmentBase {
  /** The enrollment's unique identifier. */
  id: Types.uuid;

  /** The household this enrollment belongs to. */
  householdId: Types.uuid;

  /** The program this enrollment is for. */
  programId: Types.uuid;

  /** The application that created this enrollment. */
  applicationId: Types.uuid;

  /** The current status of the enrollment. */
  status: EnrollmentStatus;

  /** Eligibility determinations for this enrollment, ordered by `determinedAt` ascending. */
  determinations?: EligibilityDeterminationBase[];

  /** Standard system metadata (createdAt, lastModifiedAt). */
  ...Fields.SystemMetadata;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.Enrollment {
  const active = #{
    id: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
    householdId: "40a12e5e-5940-4c08-921c-17a8960fcf4b",
    programId: "50a12e5e-5940-4c08-921c-17a8960fcf4b",
    applicationId: "60a12e5e-5940-4c08-921c-17a8960fcf4b",
    status: #{ value: EnrollmentStatusOptions.active, description: "" },
    createdAt: utcDateTime.fromISO("2026-05-24T10:30:00Z"),
    lastModifiedAt: utcDateTime.fromISO("2026-05-24T10:31:00Z"),
  };
}
