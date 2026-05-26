import "../fields/index.tsp";
import "../types.tsp";
import "./jurisdiction.tsp";
import "./program.tsp";

namespace CommonBenefits.Models;

// #########################################################
// AppPackageRef
// #########################################################

/** A denormalized reference to an application package. Clients follow the
 * `id` to `GET /packages/{packageId}` for the full record.
 */
@Versioning.added(Versions.v0_1)
model AppPackageRef {
  /** The application package's unique identifier. */
  id: Types.uuid;

  /** Human-readable display name. */
  name: string;
}

// #########################################################
// FormRef
// #########################################################

/** A denormalized reference to a form. Form definitions themselves live in
 * the docs site / form library and are out of scope for the v0.1.0 data
 * API; this ref is the link to follow once a Form resource exists.
 */
@Versioning.added(Versions.v0_1)
model FormRef {
  /** The form's unique identifier. */
  id: Types.uuid;

  /** Human-readable display name. */
  name: string;
}

// #########################################################
// AppPackageStatus
// #########################################################

/** Predefined set of application package statuses.
 *
 * - `active`: The package is accepting applications.
 * - `inactive`: The package is not accepting applications.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum AppPackageStatusOptions {
  active,
  inactive,
  custom,
}

/** The status of an application package. */
@Versioning.added(Versions.v0_1)
model AppPackageStatus extends Fields.ExtensibleEnumT<AppPackageStatusOptions> {}

// #########################################################
// AppPackageBase
// #########################################################

/** A specific application offering (e.g., PEAK, a joint SNAP+Medicaid+TANF
 * application). Packages mediate between Applications and Programs: a client
 * submits an Application against an AppPackage, and the server resolves
 * which programs to enroll the household in based on the package's
 * `programs` list.
 *
 * `programs` is server-managed — clients do not set it on create/update.
 */
@example(Examples.AppPackage.coloradoPeak)
@Versioning.added(Versions.v0_1)
model AppPackageBase {
  /** System and cross-system identifiers for this package. */
  identifiers: Fields.Identifiers;

  /** Human-readable display name. */
  name: string;

  /** Human-readable description of the package. */
  description?: string;

  /** The programs this package applies for. Server-managed. */
  programs: ProgramRef[];

  /** Forms attached to this package. */
  forms?: FormRef[];

  /** The jurisdiction in which this package is available. */
  jurisdiction?: JurisdictionBase;

  /** The administering agency for this package. */
  administeringAgency?: ProgramAgency;

  /** The current status of the package. */
  status: AppPackageStatus;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.AppPackage {
  const coloradoPeak = #{
    identifiers: #{
      systemId: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
      otherIds: #{
        co_peak: #{
          registry: "co_peak",
          value: "PEAK-2026",
          description: "Colorado PEAK portal identifier",
        },
      },
    },
    name: "PEAK — Colorado Benefits Application",
    description: "Colorado's joint application for SNAP, Medicaid, and TANF.",
    programs: #[
      #{ id: "40a12e5e-5940-4c08-921c-17a8960fcf4b", name: "Colorado SNAP" },
      #{ id: "50a12e5e-5940-4c08-921c-17a8960fcf4b", name: "Colorado Medicaid" },
      #{ id: "60a12e5e-5940-4c08-921c-17a8960fcf4b", name: "Colorado TANF" }
    ],
    forms: #[#{ id: "70a12e5e-5940-4c08-921c-17a8960fcf4b", name: "PEAK Application Form" }],
    status: #{ value: AppPackageStatusOptions.active, description: "" },
  };
}
