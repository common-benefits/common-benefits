/**
 * CommonBenefits TypeScript Types
 *
 * TypeScript types inferred from the auto-generated Zod schemas.
 * Import types from "@common-benefits/sdk/types" for type annotations.
 *
 * @module @common-benefits/sdk/types
 * @packageDocumentation
 */

import { z } from "zod";
import * as s from "./schemas";

// ############################################################################
// Types (scalars)
// ############################################################################

export type Uuid = z.infer<typeof s.uuid>;
export type Email = z.infer<typeof s.email>;
export type DecimalString = z.infer<typeof s.decimalString>;
export type IsoTime = z.infer<typeof s.isoTime>;
export type IsoDate = z.infer<typeof s.isoDate>;
export type CalendarYear = z.infer<typeof s.calendarYear>;

// ############################################################################
// Fields
// ############################################################################

export type AddressPeriod = z.infer<typeof s.addressPeriod>;
export type Address = z.infer<typeof s.address>;
export type AddressCollection = z.infer<typeof s.addressCollection>;
export type CustomFieldType = z.infer<typeof s.customFieldType>;
export type CustomField = z.infer<typeof s.customField>;
export type EmailCollection = z.infer<typeof s.emailCollection>;
export type EventType = z.infer<typeof s.eventType>;
export type EventBase = z.infer<typeof s.eventBase>;
export type SingleDateEvent = z.infer<typeof s.singleDateEvent>;
export type DateRangeEvent = z.infer<typeof s.dateRangeEvent>;
export type OtherEvent = z.infer<typeof s.otherEvent>;
export type Event = z.infer<typeof s.event>;
export type ExtensibleEnum = z.infer<typeof s.extensibleEnum>;
export type SystemMetadata = z.infer<typeof s.systemMetadata>;
export type File = z.infer<typeof s.file>;
export type FrequencyOptions = z.infer<typeof s.frequencyOptions>;
export type Frequency = z.infer<typeof s.frequency>;
export type IdEntry = z.infer<typeof s.idEntry>;
export type Identifiers = z.infer<typeof s.identifiers>;
export type Money = z.infer<typeof s.money>;
export type Name = z.infer<typeof s.name>;
export type Phone = z.infer<typeof s.phone>;
export type PhoneCollection = z.infer<typeof s.phoneCollection>;

// ############################################################################
// Filters
// ############################################################################

export type EquivalenceOperators = z.infer<typeof s.equivalenceOperators>;
export type ComparisonOperators = z.infer<typeof s.comparisonOperators>;
export type ArrayOperators = z.infer<typeof s.arrayOperators>;
export type StringOperators = z.infer<typeof s.stringOperators>;
export type RangeOperators = z.infer<typeof s.rangeOperators>;
export type AllOperators = z.infer<typeof s.allOperators>;
export type DefaultFilter = z.infer<typeof s.defaultFilter>;
export type DateComparisonFilter = z.infer<typeof s.dateComparisonFilter>;
export type DateRangeFilter = z.infer<typeof s.dateRangeFilter>;
export type NumberComparisonFilter = z.infer<typeof s.numberComparisonFilter>;
export type NumberRangeFilter = z.infer<typeof s.numberRangeFilter>;
export type NumberArrayFilter = z.infer<typeof s.numberArrayFilter>;
export type MoneyComparisonFilter = z.infer<typeof s.moneyComparisonFilter>;
export type MoneyRangeFilter = z.infer<typeof s.moneyRangeFilter>;
export type StringComparisonFilter = z.infer<typeof s.stringComparisonFilter>;
export type StringArrayFilter = z.infer<typeof s.stringArrayFilter>;

// ############################################################################
// Pagination
// ############################################################################

export type PaginatedQueryParams = z.infer<typeof s.paginatedQueryParams>;
export type PaginatedBodyParams = z.infer<typeof s.paginatedBodyParams>;
export type PaginatedResultsInfo = z.infer<typeof s.paginatedResultsInfo>;

// ############################################################################
// Sorting
// ############################################################################

export type SortOrder = z.infer<typeof s.sortOrder>;
export type SortQueryParams = z.infer<typeof s.sortQueryParams>;
export type SortBodyParams = z.infer<typeof s.sortBodyParams>;
export type SortedResultsInfo = z.infer<typeof s.sortedResultsInfo>;

// ############################################################################
// Models
// ############################################################################

// Jurisdictions, programs, packages
export type JurisdictionLevelOptions = z.infer<typeof s.jurisdictionLevelOptions>;
export type JurisdictionLevel = z.infer<typeof s.jurisdictionLevel>;
export type JurisdictionRef = z.infer<typeof s.jurisdictionRef>;
export type JurisdictionBase = z.infer<typeof s.jurisdictionBase>;
export type ProgramAgency = z.infer<typeof s.programAgency>;
export type ProgramRef = z.infer<typeof s.programRef>;
export type ProgramBase = z.infer<typeof s.programBase>;
export type AppPackageRef = z.infer<typeof s.appPackageRef>;
export type AppPackageStatusOptions = z.infer<typeof s.appPackageStatusOptions>;
export type AppPackageStatus = z.infer<typeof s.appPackageStatus>;
export type AppPackageBase = z.infer<typeof s.appPackageBase>;
export type FormRef = z.infer<typeof s.formRef>;

// Applications and forms
export type AppStatusOptions = z.infer<typeof s.appStatusOptions>;
export type AppStatus = z.infer<typeof s.appStatus>;
export type AppFormResponse = z.infer<typeof s.appFormResponse>;
export type ApplicationBase = z.infer<typeof s.applicationBase>;

// Persons
export type PersonIdentifiers = z.infer<typeof s.personIdentifiers>;
export type PersonCitizenshipStatusOptions = z.infer<typeof s.personCitizenshipStatusOptions>;
export type PersonCitizenshipStatus = z.infer<typeof s.personCitizenshipStatus>;
export type PersonImmigrationStatusOptions = z.infer<typeof s.personImmigrationStatusOptions>;
export type PersonImmigrationStatus = z.infer<typeof s.personImmigrationStatus>;
export type PersonLegalProfile = z.infer<typeof s.personLegalProfile>;
export type PersonDisabilityStatusOptions = z.infer<typeof s.personDisabilityStatusOptions>;
export type PersonDisabilityStatus = z.infer<typeof s.personDisabilityStatus>;
export type PersonDisability = z.infer<typeof s.personDisability>;
export type PersonPregnancyStatusOptions = z.infer<typeof s.personPregnancyStatusOptions>;
export type PersonPregnancyStatus = z.infer<typeof s.personPregnancyStatus>;
export type PersonPregnancy = z.infer<typeof s.personPregnancy>;
export type PersonHealthProfile = z.infer<typeof s.personHealthProfile>;
export type PersonEmploymentStatusOptions = z.infer<typeof s.personEmploymentStatusOptions>;
export type PersonEmploymentStatus = z.infer<typeof s.personEmploymentStatus>;
export type PersonStudentStatusOptions = z.infer<typeof s.personStudentStatusOptions>;
export type PersonStudentStatus = z.infer<typeof s.personStudentStatus>;
export type PersonCaregiverStatusOptions = z.infer<typeof s.personCaregiverStatusOptions>;
export type PersonCaregiverStatus = z.infer<typeof s.personCaregiverStatus>;
export type PersonWorkProfile = z.infer<typeof s.personWorkProfile>;
export type PersonIncomeSourceTypeOptions = z.infer<typeof s.personIncomeSourceTypeOptions>;
export type PersonIncomeSourceType = z.infer<typeof s.personIncomeSourceType>;
export type PersonIncomeSource = z.infer<typeof s.personIncomeSource>;
export type PersonBase = z.infer<typeof s.personBase>;

// Households
export type HouseholdRelationshipTypeOptions = z.infer<typeof s.householdRelationshipTypeOptions>;
export type HouseholdRelationshipType = z.infer<typeof s.householdRelationshipType>;
export type HouseholdRelationship = z.infer<typeof s.householdRelationship>;
export type HouseholdBase = z.infer<typeof s.householdBase>;

// Eligibility determinations
export type DeterminationHousehold = z.infer<typeof s.determinationHousehold>;
export type DeterminationOutcomeOptions = z.infer<typeof s.determinationOutcomeOptions>;
export type DeterminationOutcome = z.infer<typeof s.determinationOutcome>;
export type DeterminationEstimatedBenefit = z.infer<typeof s.determinationEstimatedBenefit>;
export type DeterminationBasisTypeOptions = z.infer<typeof s.determinationBasisTypeOptions>;
export type DeterminationBasisType = z.infer<typeof s.determinationBasisType>;
export type DeterminationBasis = z.infer<typeof s.determinationBasis>;
export type DeterminationProducer = z.infer<typeof s.determinationProducer>;
export type EligibilityDeterminationBase = z.infer<typeof s.eligibilityDeterminationBase>;

// Enrollments
export type EnrollmentStatusOptions = z.infer<typeof s.enrollmentStatusOptions>;
export type EnrollmentStatus = z.infer<typeof s.enrollmentStatus>;
export type EnrollmentRef = z.infer<typeof s.enrollmentRef>;
export type EnrollmentBase = z.infer<typeof s.enrollmentBase>;

// ############################################################################
// Protocol versions
// ############################################################################

export type Versions = z.infer<typeof s.versions>;
