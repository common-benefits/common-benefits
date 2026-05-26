import "../fields/index.tsp";
import "../types.tsp";
import "./household.tsp";

namespace CommonBenefits.Models;

// #########################################################
// DeterminationOutcome
// #########################################################

/** Predefined set of eligibility determination outcomes.
 *
 * - `eligible`: Determined eligible.
 * - `ineligible`: Determined ineligible.
 * - `pending`: Determination is pending additional data or processing.
 * - `needs_verification`: Eligible pending verification of submitted data.
 * - `custom`: A caller-defined outcome.
 */
@Versioning.added(Versions.v0_1)
enum DeterminationOutcomeOptions {
  eligible,
  ineligible,
  pending,
  needs_verification,
  custom,
}

/** The outcome of an eligibility determination. */
@Versioning.added(Versions.v0_1)
model DeterminationOutcome extends Fields.ExtensibleEnumT<DeterminationOutcomeOptions> {}

// #########################################################
// DeterminationEstimatedBenefit
// #########################################################

/** An estimated benefit amount and the cadence at which it would be paid. */
@Versioning.added(Versions.v0_1)
model DeterminationEstimatedBenefit {
  /** The estimated monetary amount. */
  amount: Fields.Money;

  /** The cadence at which the benefit would be paid. */
  frequency: Fields.Frequency;
}

// #########################################################
// DeterminationBasisType
// #########################################################

/** Predefined set of bases on which a determination can be made.
 *
 * - `direct`: The determination was made directly from the household's data.
 * - `categorical`: The determination was made via categorical eligibility
 *   (e.g., already enrolled in a qualifying program).
 * - `custom`: A caller-defined basis.
 */
@Versioning.added(Versions.v0_1)
enum DeterminationBasisTypeOptions {
  direct,
  categorical,
  custom,
}

/** The type of basis on which a determination was made. */
@Versioning.added(Versions.v0_1)
model DeterminationBasisType extends Fields.ExtensibleEnumT<DeterminationBasisTypeOptions> {}

// #########################################################
// DeterminationBasis
// #########################################################

/** The basis on which a determination was made. For `categorical`,
 * `sourceProgramId` and `sourceEnrollmentId` are required.
 */
@Versioning.added(Versions.v0_1)
model DeterminationBasis {
  /** The type of basis. */
  type: DeterminationBasisType;

  /** The program that confers categorical eligibility. Required when `type` is `categorical`. */
  sourceProgramId?: Types.uuid;

  /** The enrollment that confers categorical eligibility. Required when `type` is `categorical`. */
  sourceEnrollmentId?: Types.uuid;
}

// #########################################################
// DeterminationProducer
// #########################################################

/** Provenance information for an eligibility determination. */
@Versioning.added(Versions.v0_1)
model DeterminationProducer {
  /** The identifier of the adapter that produced this determination. */
  adapterId: string;

  /** The semantic version of the adapter. */
  adapterVersion: string;

  /** The rules version used by the adapter (e.g., a date stamp like "2026-05"). */
  rulesVersion: string;
}

// #########################################################
// DeterminationHousehold
// #########################################################

/** Reference to the household data used for an eligibility determination.
 *
 * If the implementation supports household revisions, `revisionId` references
 * the immutable revision record and `snapshot` is null. If not, `snapshot`
 * carries the full household JSON inline and `revisionId` is null. Both MAY
 * be present if the implementation populates both.
 */
@Versioning.added(Versions.v0_1)
model DeterminationHousehold {
  /** The household this determination applies to. */
  id: Types.uuid;

  /** The household revision record, if revisions are implemented. */
  revisionId?: Types.uuid | null;

  /** The full household snapshot, if revisions are not implemented. */
  snapshot?: HouseholdBase | null;
}

// #########################################################
// EligibilityDeterminationBase
// #########################################################

/** A point-in-time eligibility outcome for a specific Enrollment. */
@example(Examples.EligibilityDetermination.directEligible)
@Versioning.added(Versions.v0_1)
model EligibilityDeterminationBase {
  /** The determination's unique identifier. */
  id: Types.uuid;

  /** Reference to the household data used for this determination. */
  household: DeterminationHousehold;

  /** The outcome of the determination. */
  outcome: DeterminationOutcome;

  /** The estimated benefit, if eligible and the amount is calculable. */
  estimatedBenefit?: DeterminationEstimatedBenefit | null;

  /** The basis on which the determination was made. */
  basis: DeterminationBasis;

  /** The timestamp at which the determination was made. */
  determinedAt: utcDateTime;

  /** Provenance information for the determination. */
  producedBy: DeterminationProducer;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.EligibilityDetermination {
  const directEligible = #{
    id: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
    household: #{
      id: "40a12e5e-5940-4c08-921c-17a8960fcf4b",
      revisionId: "50a12e5e-5940-4c08-921c-17a8960fcf4b",
      snapshot: null,
    },
    outcome: #{ value: DeterminationOutcomeOptions.eligible, description: "" },
    estimatedBenefit: #{
      amount: #{ amount: "450", currency: "USD" },
      frequency: #{ value: Fields.FrequencyOptions.monthly, description: "" },
    },
    basis: #{ type: #{ value: DeterminationBasisTypeOptions.direct, description: "" } },
    determinedAt: utcDateTime.fromISO("2026-05-24T10:31:00Z"),
    producedBy: #{
      adapterId: "commonbenefits-adapter-policy-engine",
      adapterVersion: "0.1.0",
      rulesVersion: "2026-05",
    },
  };
}
