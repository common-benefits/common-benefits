import type { PageEntry, SchemaSource } from "./protocol-catalog";

// ============================================================================
// Inline primitive schema definitions
// ============================================================================

const primitive = (
  name: string,
  type: string,
  description: string,
  extra: Record<string, string> = {}
): SchemaSource => ({
  kind: "inline",
  jsonSchema:
    `$schema: https://json-schema.org/draft/2020-12/schema\n` +
    `$id: ${name}.yaml\n` +
    `type: ${type}\n` +
    Object.entries(extra)
      .map(([k, v]) => `${k}: ${v}\n`)
      .join("") +
    `description: ${description}`,
});

// ============================================================================
// Pages
// ============================================================================

export const pages: PageEntry[] = [
  // --------------------------------------------------------------------------
  // Types — primitive scalars + the small set of branded scalars in lib/core
  // --------------------------------------------------------------------------
  {
    page: "string",
    category: "types",
    title: "String types",
    description: "String types used throughout the protocol.",
    schemas: [
      {
        schema: "string",
        source: primitive(
          "string",
          "string",
          "A sequence of characters. The base JSON Schema type for all string-derived scalars."
        ),
      },
      {
        schema: "url",
        source: primitive("url", "string", "A Uniform Resource Locator (URL).", { format: "uri" }),
      },
      { schema: "uuid", source: { kind: "typespec", sourcePath: "lib/core/lib/types.tsp" } },
      { schema: "email", source: { kind: "typespec", sourcePath: "lib/core/lib/types.tsp" } },
    ],
  },
  {
    page: "numeric",
    category: "types",
    title: "Numeric types",
    description: "Numeric types used throughout the protocol.",
    schemas: [
      {
        // `number` matches the JSON Schema literal type name emitted by TypeSpec
        // when a model uses the `numeric` type — keeps cross-links resolving.
        schema: "number",
        source: primitive(
          "number",
          "number",
          "Any numeric value (integer or decimal). The base JSON Schema type for numeric-derived scalars."
        ),
      },
      {
        schema: "integer",
        source: primitive("integer", "integer", "A whole number without decimals."),
      },
      {
        schema: "decimalString",
        source: { kind: "typespec", sourcePath: "lib/core/lib/types.tsp" },
      },
    ],
  },
  {
    page: "date",
    category: "types",
    title: "Date and time types",
    description: "Date and time types used throughout the protocol.",
    schemas: [
      { schema: "isoDate", source: { kind: "typespec", sourcePath: "lib/core/lib/types.tsp" } },
      { schema: "isoTime", source: { kind: "typespec", sourcePath: "lib/core/lib/types.tsp" } },
      {
        schema: "calendarYear",
        source: { kind: "typespec", sourcePath: "lib/core/lib/types.tsp" },
      },
    ],
  },
  {
    page: "other",
    category: "types",
    title: "Other types",
    description: "Boolean and aggregate JSON Schema primitives.",
    schemas: [
      {
        schema: "boolean",
        source: primitive("boolean", "boolean", "A `true` or `false` value."),
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Fields — reusable building blocks
  // --------------------------------------------------------------------------
  {
    page: "address",
    category: "fields",
    title: "Address",
    description: "A mailing address and a collection of addresses for a person or organization.",
    schemas: [
      {
        schema: "Address",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/address.tsp" },
      },
      {
        schema: "AddressPeriod",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/address.tsp" },
      },
      {
        schema: "AddressCollection",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/address.tsp" },
      },
    ],
  },
  {
    page: "email",
    category: "fields",
    title: "Email",
    description: "A collection of email addresses for a person or organization.",
    schemas: [
      {
        schema: "EmailCollection",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/email.tsp" },
      },
    ],
  },
  {
    page: "phone",
    category: "fields",
    title: "Phone",
    description: "A phone number and a collection of phone numbers.",
    schemas: [
      {
        schema: "Phone",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/phone.tsp" },
      },
      {
        schema: "PhoneCollection",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/phone.tsp" },
      },
    ],
  },
  {
    page: "name",
    category: "fields",
    title: "Name",
    description: "A person's name.",
    schemas: [
      { schema: "Name", source: { kind: "typespec", sourcePath: "lib/core/lib/fields/name.tsp" } },
    ],
  },
  {
    page: "money",
    category: "fields",
    title: "Money",
    description: "A monetary amount and its currency.",
    schemas: [
      {
        schema: "Money",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/money.tsp" },
      },
    ],
  },
  {
    page: "metadata",
    category: "fields",
    title: "System metadata",
    description: "Standard system-level metadata about a record.",
    schemas: [
      {
        schema: "SystemMetadata",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/metadata.tsp" },
      },
    ],
  },
  {
    page: "file",
    category: "fields",
    title: "File",
    description: "A downloadable file.",
    schemas: [
      { schema: "File", source: { kind: "typespec", sourcePath: "lib/core/lib/fields/file.tsp" } },
    ],
  },
  {
    page: "event",
    category: "fields",
    title: "Event",
    description: "Single dates, date ranges, and custom events.",
    schemas: [
      {
        schema: "Event",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/event.tsp" },
      },
      {
        schema: "EventType",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/event.tsp" },
      },
      {
        schema: "EventBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/event.tsp" },
      },
      {
        schema: "SingleDateEvent",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/event.tsp" },
      },
      {
        schema: "DateRangeEvent",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/event.tsp" },
      },
      {
        schema: "OtherEvent",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/event.tsp" },
      },
    ],
  },
  {
    page: "custom-field",
    category: "fields",
    title: "Custom fields",
    description: "Custom fields and the JSON Schema types they may use.",
    schemas: [
      {
        schema: "CustomField",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/custom-field.tsp" },
      },
      {
        schema: "CustomFieldType",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/custom-field.tsp" },
      },
    ],
  },
  {
    page: "extensible-enum",
    category: "fields",
    title: "Extensible enums",
    description:
      "Open enum used across status fields like citizenship, employment, and program status. A typed variant `ExtensibleEnumT<T>` constrains `value` to a caller-supplied type.",
    schemas: [
      {
        schema: "ExtensibleEnum",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/extensible-enum.tsp" },
      },
    ],
  },
  {
    page: "identifiers",
    category: "fields",
    title: "Identifiers",
    description:
      "Canonical system identifier plus a free-form bag of registry-scoped identifiers (e.g., SNAP-CO, SSA, FNS).",
    schemas: [
      {
        schema: "Identifiers",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/identifiers.tsp" },
      },
      {
        schema: "IdEntry",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/identifiers.tsp" },
      },
    ],
  },
  {
    page: "frequency",
    category: "fields",
    title: "Frequency",
    description: "How often a recurring event (e.g., income, benefit payment) repeats.",
    schemas: [
      {
        schema: "Frequency",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/frequency.tsp" },
      },
      {
        schema: "FrequencyOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/fields/frequency.tsp" },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Models — top-level domain resources
  // --------------------------------------------------------------------------
  {
    page: "person",
    category: "models",
    title: "Person",
    description: "A household member, including legal, health, work, and income profiles.",
    schemas: [
      {
        schema: "PersonBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonIdentifiers",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonLegalProfile",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonCitizenshipStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonCitizenshipStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonImmigrationStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonImmigrationStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonHealthProfile",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonDisability",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonDisabilityStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonDisabilityStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonPregnancy",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonPregnancyStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonPregnancyStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonWorkProfile",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonEmploymentStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonEmploymentStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonStudentStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonStudentStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonCaregiverStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonCaregiverStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonIncomeSource",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonIncomeSourceType",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
      {
        schema: "PersonIncomeSourceTypeOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/person.tsp" },
      },
    ],
  },
  {
    page: "household",
    category: "models",
    title: "Household",
    description: "A group of people who apply for benefits together.",
    schemas: [
      {
        schema: "HouseholdBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/household.tsp" },
      },
      {
        schema: "HouseholdRelationship",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/household.tsp" },
      },
      {
        schema: "HouseholdRelationshipType",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/household.tsp" },
      },
      {
        schema: "HouseholdRelationshipTypeOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/household.tsp" },
      },
    ],
  },
  {
    page: "program",
    category: "models",
    title: "Program",
    description: "A benefits program (e.g., SNAP, Medicaid) offered in a given jurisdiction.",
    schemas: [
      {
        schema: "ProgramBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/program.tsp" },
      },
      {
        schema: "ProgramAgency",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/program.tsp" },
      },
      {
        schema: "ProgramRef",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/program.tsp" },
      },
    ],
  },
  {
    page: "jurisdiction",
    category: "models",
    title: "Jurisdiction",
    description:
      "A geographic and administrative jurisdiction (federal, state, county, etc.) that scopes a program.",
    schemas: [
      {
        schema: "JurisdictionBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/jurisdiction.tsp" },
      },
      {
        schema: "JurisdictionLevel",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/jurisdiction.tsp" },
      },
      {
        schema: "JurisdictionLevelOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/jurisdiction.tsp" },
      },
      {
        schema: "JurisdictionRef",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/jurisdiction.tsp" },
      },
    ],
  },
  {
    page: "app-package",
    category: "models",
    title: "Application package",
    description:
      "A bundle of forms and programs a household can apply to together as a single application.",
    schemas: [
      {
        schema: "AppPackageBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/app-package.tsp" },
      },
      {
        schema: "AppPackageStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/app-package.tsp" },
      },
      {
        schema: "AppPackageStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/app-package.tsp" },
      },
      {
        schema: "AppPackageRef",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/app-package.tsp" },
      },
      {
        schema: "FormRef",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/app-package.tsp" },
      },
    ],
  },
  {
    page: "application",
    category: "models",
    title: "Application",
    description: "A household's submitted application against an application package.",
    schemas: [
      {
        schema: "ApplicationBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/application.tsp" },
      },
      {
        schema: "AppStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/application.tsp" },
      },
      {
        schema: "AppStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/application.tsp" },
      },
      {
        schema: "AppFormResponse",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/application.tsp" },
      },
    ],
  },
  {
    page: "enrollment",
    category: "models",
    title: "Enrollment",
    description: "A household's enrollment in a specific program.",
    schemas: [
      {
        schema: "EnrollmentBase",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/enrollment.tsp" },
      },
      {
        schema: "EnrollmentStatus",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/enrollment.tsp" },
      },
      {
        schema: "EnrollmentStatusOptions",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/enrollment.tsp" },
      },
      {
        schema: "EnrollmentRef",
        source: { kind: "typespec", sourcePath: "lib/core/lib/models/enrollment.tsp" },
      },
    ],
  },
  {
    page: "eligibility-determination",
    category: "models",
    title: "Eligibility determination",
    description: "An eligibility decision and supporting rationale for a household and program.",
    schemas: [
      {
        schema: "EligibilityDeterminationBase",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationOutcome",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationOutcomeOptions",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationBasis",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationBasisType",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationBasisTypeOptions",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationProducer",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationHousehold",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
      {
        schema: "DeterminationEstimatedBenefit",
        source: {
          kind: "typespec",
          sourcePath: "lib/core/lib/models/eligibility-determination.tsp",
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Filters — operator enums and typed filter models
  // --------------------------------------------------------------------------
  {
    page: "base",
    category: "filters",
    title: "Filter operators",
    description: "The base filter operators used by typed filter models.",
    schemas: [
      {
        schema: "DefaultFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
      {
        schema: "EquivalenceOperators",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
      {
        schema: "ComparisonOperators",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
      {
        schema: "ArrayOperators",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
      {
        schema: "StringOperators",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
      {
        schema: "RangeOperators",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
      {
        schema: "AllOperators",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/base.tsp" },
      },
    ],
  },
  {
    page: "string",
    category: "filters",
    title: "String filters",
    description: "Filters that compare a field to a string value or array of strings.",
    schemas: [
      {
        schema: "StringComparisonFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/string.tsp" },
      },
      {
        schema: "StringArrayFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/string.tsp" },
      },
    ],
  },
  {
    page: "numeric",
    category: "filters",
    title: "Numeric filters",
    description: "Filters that compare a field to a numeric value, range, or array.",
    schemas: [
      {
        schema: "NumberComparisonFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/numeric.tsp" },
      },
      {
        schema: "NumberRangeFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/numeric.tsp" },
      },
      {
        schema: "NumberArrayFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/numeric.tsp" },
      },
    ],
  },
  {
    page: "date",
    category: "filters",
    title: "Date filters",
    description: "Filters that compare a field to a date or date range.",
    schemas: [
      {
        schema: "DateComparisonFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/date.tsp" },
      },
      {
        schema: "DateRangeFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/date.tsp" },
      },
    ],
  },
  {
    page: "money",
    category: "filters",
    title: "Money filters",
    description: "Filters that compare a field to a monetary value or range.",
    schemas: [
      {
        schema: "MoneyComparisonFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/money.tsp" },
      },
      {
        schema: "MoneyRangeFilter",
        source: { kind: "typespec", sourcePath: "lib/core/lib/filters/money.tsp" },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Responses — error + success templates
  // --------------------------------------------------------------------------
  {
    page: "error",
    category: "responses",
    title: "Error responses",
    description: "Standard non-2xx response envelopes.",
    schemas: [
      {
        schema: "Error",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/error.tsp" },
      },
    ],
  },
  {
    page: "success",
    category: "responses",
    title: "Success responses",
    description: "Standard 2xx response envelopes.",
    schemas: [
      {
        schema: "Success",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/success.tsp" },
      },
      {
        schema: "Ok",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/success.tsp" },
      },
      {
        schema: "Created",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/success.tsp" },
      },
      {
        schema: "Paginated",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/success.tsp" },
      },
      {
        schema: "Filtered",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/success.tsp" },
      },
      {
        schema: "Sorted",
        source: { kind: "typespec", sourcePath: "lib/core/lib/responses/success.tsp" },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Narrative pages (hand-written MDX). Listed here so the schemas referenced
  // in those MDX files are cross-linkable from elsewhere.
  // --------------------------------------------------------------------------
  {
    page: "pagination",
    title: "Pagination",
    narrative: true,
    schemas: [
      {
        schema: "PaginatedQueryParams",
        source: { kind: "typespec", sourcePath: "lib/core/lib/pagination.tsp" },
      },
      {
        schema: "PaginatedBodyParams",
        source: { kind: "typespec", sourcePath: "lib/core/lib/pagination.tsp" },
      },
      {
        schema: "PaginatedResultsInfo",
        source: { kind: "typespec", sourcePath: "lib/core/lib/pagination.tsp" },
      },
    ],
  },
  {
    page: "sorting",
    title: "Sorting",
    narrative: true,
    schemas: [
      {
        schema: "SortQueryParams",
        source: { kind: "typespec", sourcePath: "lib/core/lib/sorting.tsp" },
      },
      {
        schema: "SortBodyParams",
        source: { kind: "typespec", sourcePath: "lib/core/lib/sorting.tsp" },
      },
      {
        schema: "SortedResultsInfo",
        source: { kind: "typespec", sourcePath: "lib/core/lib/sorting.tsp" },
      },
      { schema: "SortOrder", source: { kind: "typespec", sourcePath: "lib/core/lib/sorting.tsp" } },
    ],
  },
];
