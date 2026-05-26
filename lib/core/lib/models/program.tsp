import "../fields/index.tsp";
import "../types.tsp";
import "./app-package.tsp";
import "./jurisdiction.tsp";

namespace CommonBenefits.Models;

// #########################################################
// ProgramAgency
// #########################################################

/** A government or administrative body responsible for a program.
 * Denormalized onto Program responses; not a standalone resource in v0.1.0.
 */
@example(Examples.Program.agency)
@Versioning.added(Versions.v0_1)
model ProgramAgency {
  /** The agency's full name. */
  name: string;

  /** A short code or abbreviation for the agency. */
  code?: string;

  /** The parent agency, if any. */
  parent?: {
    /** The parent agency's name. */
    name: string;

    /** The parent agency's short code or abbreviation. */
    code?: string;
  };
}

// #########################################################
// ProgramRef
// #########################################################

/** A denormalized reference to a program. Carries enough information to
 * display without a separate lookup; clients follow the `id` to
 * `GET /programs/{programId}` for the full record. Used for parent
 * references, lists of related programs, and embedded program references on
 * other models (e.g., the programs included in an AppPackage).
 */
@Versioning.added(Versions.v0_1)
model ProgramRef {
  /** The program's unique identifier. */
  id: Types.uuid;

  /** Human-readable display name. */
  name: string;
}

// #########################################################
// ProgramBase
// #########################################################

/** An entry in the benefits program registry. Programs are hierarchical via
 * `parent` (e.g., "Colorado SNAP" inherits from "Supplemental Nutrition
 * Assistance Program").
 */
@example(Examples.Program.coloradoSnap)
@Versioning.added(Versions.v0_1)
model ProgramBase {
  /** System and cross-system identifiers for this program. */
  identifiers: Fields.Identifiers;

  /** The program's name. */
  name: string;

  /** The parent program, if any. Null for root-level (e.g., federal) programs. */
  parent?: ProgramRef;

  /** The jurisdiction in which the program operates. */
  jurisdiction?: JurisdictionBase;

  /** The administering agency. */
  administeringAgency?: ProgramAgency;

  /** Application packages that include this program. Server-managed. */
  packages?: AppPackageRef[];
}

// #########################################################
// Examples
// #########################################################

namespace Examples.Program {
  const agency = #{
    name: "Colorado Department of Human Services",
    code: "CDHS",
    parent: #{ name: "State of Colorado", code: "CO" },
  };

  const coloradoSnap = #{
    identifiers: #{
      systemId: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
      otherIds: #{
        benefits_gov: #{
          registry: "benefits_gov",
          value: "SNAP-CO",
          description: "Benefits.gov program identifier",
        },
      },
    },
    name: "Colorado SNAP",
    parent: #{
      id: "40a12e5e-5940-4c08-921c-17a8960fcf4b",
      name: "Supplemental Nutrition Assistance Program",
    },
  };
}
