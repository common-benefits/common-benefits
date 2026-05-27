import "../fields/index.tsp";
import "../types.tsp";

namespace CommonBenefits.Models;

// #########################################################
// PersonIdentifiers
// #########################################################

/** Identifiers for a Person (household member).
 *
 * Adds `ssn` as a named canonical identifier on top of the base
 * `Fields.Identifiers` shape. Implementations MUST encrypt `ssn` at rest.
 */
@Versioning.added(Versions.v0_1)
model PersonIdentifiers extends Fields.Identifiers {
  /** Social Security Number. **Sensitive**: must be encrypted at rest. */
  ssn?: string;
}

// #########################################################
// PersonCitizenshipStatus
// #########################################################

/** Predefined set of citizenship statuses.
 *
 * - `us_citizen`: U.S. citizen.
 * - `lawful_permanent_resident`: Lawful Permanent Resident (green card holder).
 * - `refugee`: Refugee.
 * - `asylee`: Person granted asylum.
 * - `cuban_haitian_entrant`: Cuban or Haitian entrant.
 * - `amerasian`: Amerasian.
 * - `us_national`: U.S. national (non-citizen).
 * - `victim_of_trafficking`: Certified victim of human trafficking.
 * - `not_applicable`: Not applicable to this member.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonCitizenshipStatusOptions {
  us_citizen,
  lawful_permanent_resident,
  refugee,
  asylee,
  cuban_haitian_entrant,
  amerasian,
  us_national,
  victim_of_trafficking,
  not_applicable,
  custom,
}

/** A person's citizenship status. */
@Versioning.added(Versions.v0_1)
model PersonCitizenshipStatus extends Fields.ExtensibleEnumT<PersonCitizenshipStatusOptions> {}

// #########################################################
// PersonImmigrationStatus
// #########################################################

/** Predefined set of immigration statuses.
 *
 * - `lpr`: Lawful Permanent Resident.
 * - `visa_holder`: Holder of a temporary visa.
 * - `daca`: Deferred Action for Childhood Arrivals.
 * - `temporary_protected_status`: Temporary Protected Status.
 * - `undocumented`: Undocumented.
 * - `not_applicable`: Not applicable (e.g., U.S. citizen).
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonImmigrationStatusOptions {
  lpr,
  visa_holder,
  daca,
  temporary_protected_status,
  undocumented,
  not_applicable,
  custom,
}

/** A person's immigration status. */
@Versioning.added(Versions.v0_1)
model PersonImmigrationStatus extends Fields.ExtensibleEnumT<PersonImmigrationStatusOptions> {}

// #########################################################
// PersonLegalProfile
// #########################################################

/** A grouping of a person's legal-status attributes (citizenship and
 * immigration). Distinct from `*Status` enum wrappers — Profile types are
 * containers for related attribute fields.
 */
@Versioning.added(Versions.v0_1)
model PersonLegalProfile {
  /** The person's citizenship status. */
  citizenshipStatus?: PersonCitizenshipStatus;

  /** The person's immigration status. */
  immigrationStatus?: PersonImmigrationStatus;
}

// #########################################################
// PersonDisabilityStatus
// #########################################################

/** Predefined set of disability statuses.
 *
 * - `none`: No disability.
 * - `ssa_disability`: SSA-determined disability.
 * - `ssi_recipient`: Supplemental Security Income recipient.
 * - `state_defined`: State-defined disability determination.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonDisabilityStatusOptions {
  none,
  ssa_disability,
  ssi_recipient,
  state_defined,
  custom,
}

/** A person's disability status. */
@Versioning.added(Versions.v0_1)
model PersonDisabilityStatus extends Fields.ExtensibleEnumT<PersonDisabilityStatusOptions> {}

/** A person's disability information. */
@Versioning.added(Versions.v0_1)
model PersonDisability {
  /** The disability status. */
  status: PersonDisabilityStatus;

  /** The date the disability was determined. Month-level precision is acceptable. */
  determinationDate?: Types.isoDate | null;

  /** The source of the determination (e.g., `ssa`, `state_medicaid`). */
  determinationSource?: string | null;
}

// #########################################################
// PersonPregnancyStatus
// #########################################################

/** Predefined set of pregnancy statuses.
 *
 * - `not_pregnant`: Not pregnant.
 * - `pregnant`: Pregnant.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonPregnancyStatusOptions {
  not_pregnant,
  pregnant,
  custom,
}

/** A person's pregnancy status. */
@Versioning.added(Versions.v0_1)
model PersonPregnancyStatus extends Fields.ExtensibleEnumT<PersonPregnancyStatusOptions> {}

/** A person's pregnancy information. */
@Versioning.added(Versions.v0_1)
model PersonPregnancy {
  /** The pregnancy status. */
  status: PersonPregnancyStatus;

  /** The expected due date in ISO 8601 format. */
  expectedDueDate?: Types.isoDate | null;
}

// #########################################################
// PersonHealthProfile
// #########################################################

/** A grouping of a person's health attributes (disability and pregnancy). */
@Versioning.added(Versions.v0_1)
model PersonHealthProfile {
  /** The person's disability information. */
  disability?: PersonDisability;

  /** The person's pregnancy information. */
  pregnancy?: PersonPregnancy;
}

// #########################################################
// PersonEmploymentStatus
// #########################################################

/** Predefined set of employment statuses.
 *
 * - `employed_full_time`: Employed full-time.
 * - `employed_part_time`: Employed part-time.
 * - `self_employed`: Self-employed.
 * - `unemployed`: Unemployed and seeking work.
 * - `not_in_labor_force`: Not in the labor force.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonEmploymentStatusOptions {
  employed_full_time,
  employed_part_time,
  self_employed,
  unemployed,
  not_in_labor_force,
  custom,
}

/** A person's employment status. */
@Versioning.added(Versions.v0_1)
model PersonEmploymentStatus extends Fields.ExtensibleEnumT<PersonEmploymentStatusOptions> {}

// #########################################################
// PersonStudentStatus
// #########################################################

/** Predefined set of student enrollment statuses.
 *
 * - `not_enrolled`: Not enrolled.
 * - `enrolled_half_time`: Enrolled half-time.
 * - `enrolled_full_time`: Enrolled full-time.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonStudentStatusOptions {
  not_enrolled,
  enrolled_half_time,
  enrolled_full_time,
  custom,
}

/** A person's student enrollment status. */
@Versioning.added(Versions.v0_1)
model PersonStudentStatus extends Fields.ExtensibleEnumT<PersonStudentStatusOptions> {}

// #########################################################
// PersonCaregiverStatus
// #########################################################

/** Predefined set of caregiver statuses.
 *
 * - `none`: Not a caregiver.
 * - `caregiver_child_under_6`: Caregiver for a child under 6.
 * - `caregiver_disabled_member`: Caregiver for a disabled household member.
 * - `custom`: A caller-defined status.
 */
@Versioning.added(Versions.v0_1)
enum PersonCaregiverStatusOptions {
  none,
  caregiver_child_under_6,
  caregiver_disabled_member,
  custom,
}

/** A person's caregiver status. */
@Versioning.added(Versions.v0_1)
model PersonCaregiverStatus extends Fields.ExtensibleEnumT<PersonCaregiverStatusOptions> {}

// #########################################################
// PersonWorkProfile
// #########################################################

/** A grouping of a person's work attributes (employment, student, hours
 * worked, caregiver). Grouped because SNAP and Medicaid work requirements
 * share exemption categories (disability, pregnancy, caregiving, student
 * enrollment).
 */
@Versioning.added(Versions.v0_1)
model PersonWorkProfile {
  /** The person's employment status. */
  employmentStatus?: PersonEmploymentStatus;

  /** The person's student enrollment status. */
  studentStatus?: PersonStudentStatus;

  /** Hours worked per week. Relevant to work requirement thresholds. */
  hoursWorkedPerWeek?: integer;

  /** The person's caregiver status. */
  caregiverStatus?: PersonCaregiverStatus;
}

// #########################################################
// PersonIncomeSourceType
// #########################################################

/** Predefined set of income source types.
 *
 * - `wages`: Wages or salary from employment.
 * - `self_employment`: Self-employment income.
 * - `unemployment`: Unemployment benefits.
 * - `social_security`: Social Security retirement or disability benefits.
 * - `ssi`: Supplemental Security Income.
 * - `child_support`: Child support payments.
 * - `alimony`: Alimony or spousal support.
 * - `rental`: Rental income.
 * - `interest`: Interest income.
 * - `dividends`: Dividend income.
 * - `pension`: Pension or retirement income.
 * - `veterans_benefits`: Veterans benefits.
 * - `workers_compensation`: Workers' compensation.
 * - `tribal_per_capita`: Tribal per capita payments.
 * - `custom`: A caller-defined income type.
 */
@Versioning.added(Versions.v0_1)
enum PersonIncomeSourceTypeOptions {
  wages,
  self_employment,
  unemployment,
  social_security,
  ssi,
  child_support,
  alimony,
  rental,
  interest,
  dividends,
  pension,
  veterans_benefits,
  workers_compensation,
  tribal_per_capita,
  custom,
}

/** The type of an income source. */
@Versioning.added(Versions.v0_1)
model PersonIncomeSourceType extends Fields.ExtensibleEnumT<PersonIncomeSourceTypeOptions> {}

// #########################################################
// PersonIncomeSource
// #########################################################

/** A single source of income for a person. */
@example(Examples.Person.wagesIncome)
@Versioning.added(Versions.v0_1)
model PersonIncomeSource {
  /** The type of income. */
  type: PersonIncomeSourceType;

  /** The monetary amount per period. */
  amount: Fields.Money;

  /** The frequency at which the amount is received. */
  frequency: Fields.Frequency;
}

// #########################################################
// PersonBase
// #########################################################

/** An individual member of a household.
 *
 * Eligibility-relevant attributes are grouped into `legalProfile`,
 * `healthProfile`, and `workProfile` so related fields stay together and
 * additional fields can be added within each group without restructuring
 * the top level.
 */
@example(Examples.Person.headOfHousehold)
@Versioning.added(Versions.v0_1)
model PersonBase {
  /** System, cross-system, and named canonical identifiers for this person. */
  identifiers: PersonIdentifiers;

  /** The person's name. */
  name: Fields.Name;

  /** Date of birth in ISO 8601 format (YYYY-MM-DD). */
  dateOfBirth: Types.isoDate;

  /** `true` if this person is the head of household. Exactly one per household. */
  isHeadOfHousehold: boolean;

  /** The person's legal-status profile (citizenship, immigration). */
  legalProfile?: PersonLegalProfile;

  /** The person's health profile (disability, pregnancy). */
  healthProfile?: PersonHealthProfile;

  /** The person's work profile (employment, student, caregiver). */
  workProfile?: PersonWorkProfile;

  /** The person's sources of income. */
  incomeSources?: PersonIncomeSource[];

  /** Implementation-defined custom fields. */
  customFields?: Record<Fields.CustomField>;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.Person {
  const wagesIncome = #{
    type: #{ value: PersonIncomeSourceTypeOptions.wages, description: "Part-time retail" },
    amount: #{ amount: "1200", currency: "USD" },
    frequency: #{ value: Fields.FrequencyOptions.monthly, description: "" },
  };

  const headOfHousehold = #{
    identifiers: #{ systemId: "30a12e5e-5940-4c08-921c-17a8960fcf4b", ssn: "123-45-6789" },
    name: #{ prefix: "Ms.", firstName: "Jane", lastName: "Smith" },
    dateOfBirth: Types.isoDate.fromISO("1985-03-15"),
    isHeadOfHousehold: true,
    legalProfile: #{
      citizenshipStatus: #{ value: PersonCitizenshipStatusOptions.us_citizen, description: "" },
      immigrationStatus: #{ value: PersonImmigrationStatusOptions.not_applicable, description: "" },
    },
    healthProfile: #{
      disability: #{ status: #{ value: PersonDisabilityStatusOptions.none, description: "" } },
      pregnancy: #{
        status: #{ value: PersonPregnancyStatusOptions.not_pregnant, description: "" },
      },
    },
    workProfile: #{
      employmentStatus: #{
        value: PersonEmploymentStatusOptions.employed_part_time,
        description: "Part-time retail",
      },
      studentStatus: #{ value: PersonStudentStatusOptions.not_enrolled, description: "" },
      hoursWorkedPerWeek: 20,
      caregiverStatus: #{ value: PersonCaregiverStatusOptions.none, description: "" },
    },
    incomeSources: #[wagesIncome],
  };
}
