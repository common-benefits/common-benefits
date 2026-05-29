/**
 * CommonBenefits Runtime Constants
 *
 * Runtime values for enum schemas. Import from "@common-benefits/sdk/constants"
 * to avoid magic strings when reading or writing protocol values.
 *
 * @module @common-benefits/sdk/constants
 * @packageDocumentation
 */

import * as s from "./schemas";

// ############################################################################
// Field enums
// ############################################################################

export const CustomFieldType = s.customFieldType.enum;
export const EventType = s.eventType.enum;
export const FrequencyOptions = s.frequencyOptions.enum;

// ############################################################################
// Sorting
// ############################################################################

export const SortOrder = s.sortOrder.enum;

// ############################################################################
// Filter operators
// ############################################################################

export const EquivalenceOperators = s.equivalenceOperators.enum;
export const ComparisonOperators = s.comparisonOperators.enum;
export const ArrayOperators = s.arrayOperators.enum;
export const StringOperators = s.stringOperators.enum;
export const RangeOperators = s.rangeOperators.enum;
export const AllOperators = s.allOperators.enum;

// ############################################################################
// Model status enums (extensible)
// ############################################################################

export const AppPackageStatusOptions = s.appPackageStatusOptions.enum;
export const JurisdictionLevelOptions = s.jurisdictionLevelOptions.enum;
export const AppStatusOptions = s.appStatusOptions.enum;
export const EnrollmentStatusOptions = s.enrollmentStatusOptions.enum;
export const HouseholdRelationshipTypeOptions = s.householdRelationshipTypeOptions.enum;
export const DeterminationOutcomeOptions = s.determinationOutcomeOptions.enum;
export const DeterminationBasisTypeOptions = s.determinationBasisTypeOptions.enum;

// ############################################################################
// Person profile enums (extensible)
// ############################################################################

export const PersonCitizenshipStatusOptions = s.personCitizenshipStatusOptions.enum;
export const PersonImmigrationStatusOptions = s.personImmigrationStatusOptions.enum;
export const PersonDisabilityStatusOptions = s.personDisabilityStatusOptions.enum;
export const PersonPregnancyStatusOptions = s.personPregnancyStatusOptions.enum;
export const PersonEmploymentStatusOptions = s.personEmploymentStatusOptions.enum;
export const PersonStudentStatusOptions = s.personStudentStatusOptions.enum;
export const PersonCaregiverStatusOptions = s.personCaregiverStatusOptions.enum;
export const PersonIncomeSourceTypeOptions = s.personIncomeSourceTypeOptions.enum;

// ############################################################################
// Protocol versions
// ############################################################################

export const Versions = s.versions.enum;
