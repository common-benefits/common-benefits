import { z } from "zod";

export const uuid = z
  .string()
  .uuid()
  .describe("A universally unique identifier.");

export const email = z.string().email().describe("An email address.");

export const decimalString = z
  .string()
  .regex(/^-?[0-9]+\.?[0-9]*$/)

    .describe("A decimal number (variable scale) encoded as a string to avoid floating-point issues.");

export const isoTime = z
  .string()
  .time()

    .describe("A time on a clock, without a timezone, in ISO 8601 format `HH:mm:ss`.");

export const isoDate = z.coerce
  .date()
  .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`.");

export const calendarYear = z
  .string()
  .regex(/^[0-9]{4}$/)
  .describe("A 4-digit calendar year.");

export const addressPeriod = z
  .object({
    startDate: isoDate
      .describe("The date the address was first occupied, in ISO 8601 (YYYY-MM-DD)."),
    endDate: z
      .union([
        isoDate
          .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`."),
        z.null()
      ])
      .optional()

        .describe("The date the address was vacated. `null` if currently occupied."),
    isCurrent: z.boolean().describe("`true` if this is the current address."),
  })

    .describe("The time period during which a household or person occupied an address. `endDate` is `null` (or omitted) for currently-occupied addresses; `isCurrent` is the authoritative signal regardless of date values.");

export const address = z
  .object({
    street1: z.string().describe("The primary street address line."),
    street2: z
      .string()
      .optional()

        .describe("Additional street address information (e.g., apartment number, suite, etc.)."),
    city: z.string().describe("The city or municipality name."),
    stateOrProvince: z
      .string()
      .describe("The state, province, or region name."),
    country: z.string().describe("The country name or ISO country code."),
    postalCode: z.string().describe("The postal or ZIP code for the address."),
    latitude: z
      .number()
      .optional()
      .describe("The latitude coordinate of the address location."),
    longitude: z
      .number()
      .optional()
      .describe("The longitude coordinate of the address location."),
    geography: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Additional geospatial data in GeoJSON format."),
    period: addressPeriod
      .optional()
      .describe("The time period during which the address was occupied."),
  })
  .describe("A mailing address.");

export const addressCollection = z
  .object({
    residential: address.describe("The primary residential address."),
    mailing: address
      .optional()

        .describe("The mailing address, if different from the residential address."),
    otherAddresses: z
      .record(z.string(), address.describe("A mailing address."))
      .optional()

        .describe("Additional addresses keyed by a caller-defined label (e.g., \"previous\", \"work\")."),
  })

    .describe("A collection of addresses with named slots for residential and mailing addresses plus an open map of additional addresses keyed by a caller-defined label (e.g., \"previous\", \"work\", \"satellite\").");

export const customFieldType = z
  .enum(["string", "number", "integer", "boolean", "object", "array"])

    .describe("The set of JSON schema types supported by a custom field. - `string`: A sequence of characters. - `number`: A numeric value (integer or decimal). - `integer`: A whole number without decimals. - `boolean`: A `true` or `false` value. - `object`: A nested object with its own properties. - `array`: An ordered list of values.");

export const customField = z
  .object({
    name: z.string().describe("Name of the custom field."),
    fieldType: customFieldType
      .describe("The JSON schema type to use when de-serializing the `value` field."),
    schema: z
      .string()
      .url()
      .optional()
      .describe("Link to the full JSON schema for this custom field."),
    value: z.unknown().describe("Value of the custom field."),
    description: z
      .string()
      .optional()
      .describe("Description of the custom field's purpose."),
  })
  .describe("A custom field on a model");

export const emailCollection = z
  .object({
    primary: email
      .email()
      .describe("The primary email address for a person or organization."),
    otherEmails: z
      .record(z.string(), email.email().describe("An email address."))
      .optional()

        .describe("Additional email addresses keyed by a descriptive label (e.g., \"work\", \"personal\", \"support\")."),
  })
  .describe("A collection of email addresses.");

export const eventType = z
  .enum(["singleDate", "dateRange", "other"])

    .describe("Type of event (e.g., a single date, a date range, or a custom event). - `singleDate`: A single date (and possible time). - `dateRange`: A period of time with a start and end date. - `other`: Other event type (e.g., a recurring event).");

export const eventBase = z
  .object({
    name: z.string().describe("Human-readable name of the event."),
    eventType: eventType.describe("Type of event."),
    description: z
      .string()
      .optional()
      .describe("Description of what this event represents."),
  })
  .describe("Base model for all events.");

export const singleDateEvent = eventBase
  .merge(z.object({
    eventType: z.literal("singleDate").describe("Type of event."),
    date: isoDate.describe("Date of the event in ISO 8601 format: YYYY-MM-DD."),
    time: isoTime
      .optional()
      .describe("Time of the event in ISO 8601 format: HH:MM:SS."),
  }))
  .describe("An event that has a date (and possible time) associated with it.");

export const dateRangeEvent = eventBase
  .merge(z.object({
    eventType: z.literal("dateRange").describe("Type of event."),
    startDate: isoDate
      .describe("Start date of the event in ISO 8601 format: YYYY-MM-DD."),
    startTime: isoTime
      .optional()
      .describe("Start time of the event in ISO 8601 format: HH:MM:SS."),
    endDate: isoDate
      .describe("End date of the event in ISO 8601 format: YYYY-MM-DD."),
    endTime: isoTime
      .optional()
      .describe("End time of the event in ISO 8601 format: HH:MM:SS."),
  }))

    .describe("An event that has a start and end date (and possible time) associated with it.");

export const otherEvent = eventBase
  .merge(z.object({
    eventType: z.literal("other").describe("Type of event."),
    details: z
      .string()
      .optional()

        .describe("Details of the event's timeline (e.g. \"Every other Tuesday\")."),
  }))
  .describe("An event that is not a single date or date range.");

export const extensibleEnum = z
  .object({
    value: z
      .unknown()

        .describe("The selected value. May be from a predefined set or a caller-defined value."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` does not fit a predefined option."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })

    .describe("An open enum: an optional `value` of unspecified shape plus a free-form `description`. Use this when the value set is open-ended and a typed constraint isn't appropriate. For typed variants, see `ExtensibleEnumT<T>`.");

export const systemMetadata = z
  .object({
    createdAt: z.coerce
      .date()
      .describe("The timestamp (in UTC) at which the record was created."),
    lastModifiedAt: z.coerce
      .date()

        .describe("The timestamp (in UTC) at which the record was last modified."),
  })
  .describe("Standard system-level metadata about a given record.");

export const file = z
  .object({
    downloadUrl: z.string().url().describe("The file's download URL."),
    name: z.string().describe("The file's name."),
    description: z.string().optional().describe("The file's description."),
    sizeInBytes: z.number().optional().describe("The file's size in bytes."),
    mimeType: z.string().optional().describe("The file's MIME type."),
    createdAt: z.coerce
      .date()
      .describe("The timestamp (in UTC) at which the record was created."),
    lastModifiedAt: z.coerce
      .date()

        .describe("The timestamp (in UTC) at which the record was last modified."),
  })
  .describe("A field representing a downloadable file.");

export const frequencyOptions = z
  .enum(["weekly", "bi_weekly", "semi_monthly", "monthly", "annual", "custom"])

    .describe("Predefined set of frequencies for recurring monetary amounts (e.g., income, estimated benefits). - `weekly`: Once per week. - `bi_weekly`: Once every two weeks. - `semi_monthly`: Twice per month. - `monthly`: Once per month. - `annual`: Once per year. - `custom`: A caller-defined frequency captured in the description.");

export const frequency = z
  .object({
    value: frequencyOptions.describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })

    .describe("Frequency of a recurring monetary amount, modeled as an extensible enum so implementations can supply a custom frequency via the `description` field when none of the predefined options apply.");

export const idEntry = z
  .object({
    registry: z
      .string()

        .describe("The registry or external system this identifier belongs to (e.g., \"iso_3166_2\", \"co_cbms\")."),
    value: z.string().describe("The identifier value within that registry."),
    description: z
      .string()
      .optional()
      .describe("Optional human-readable description of the identifier."),
  })

    .describe("A single cross-system identifier entry. Captures the registry (the system that issued the ID), the value within that registry, and an optional description.");

export const identifiers = z
  .object({
    systemId: uuid.uuid().describe("The system-assigned identifier."),
    otherIds: z
      .record(
        z.string(),
        idEntry
          .describe("A single cross-system identifier entry. Captures the registry (the system that issued the ID), the value within that registry, and an optional description.")
      )
      .optional()
      .describe("Cross-system identifiers keyed by a caller-defined label."),
  })

    .describe("A collection of identifiers for a model. Includes the system-assigned identifier (`systemId`) plus an open map of cross-system identifiers (`otherIds`) keyed by a caller-defined label. Model-specific named canonical identifiers (e.g., `ssn` on Person) are added by extending this model in the relevant model file.");

export const money = z
  .object({
    amount: decimalString
      .regex(/^-?[0-9]+\.?[0-9]*$/)
      .describe("The amount of money."),
    currency: z
      .string()

        .describe("The ISO 4217 currency code in which the amount is denominated."),
  })
  .describe("A monetary amount and the currency in which it's denominated.");

export const name = z
  .object({
    prefix: z
      .string()
      .optional()
      .describe("Honorific prefix (e.g., Mr., Mrs., Dr., Prof.)."),
    firstName: z.string().describe("The person's first or given name."),
    middleName: z
      .string()
      .optional()
      .describe("The person's middle name or names."),
    lastName: z.string().describe("The person's last name or family name."),
    suffix: z
      .string()
      .optional()
      .describe("Name suffix (e.g., Jr., Sr., III, Ph.D.)."),
  })
  .describe("A person's name.");

export const phone = z
  .object({
    countryCode: z
      .string()
      .regex(/^\+[1-9][0-9]{0,3}$/)
      .describe("The international country code (e.g., \"+1\" for US/Canada)."),
    number: z
      .string()
      .describe("The local phone number without the country code."),
    extension: z
      .string()
      .optional()
      .describe("Optional extension number for the phone line."),
    isMobile: z
      .boolean()
      .optional()
      .default(false)
      .describe("Indicates whether this is a mobile/cell phone number."),
  })
  .describe("A phone number.");

export const phoneCollection = z
  .object({
    primary: phone.describe("The person's primary phone number."),
    fax: phone.optional().describe("The person's fax number, if applicable."),
    otherPhones: z
      .record(z.string(), phone.describe("A phone number."))
      .optional()
      .describe("Additional phone numbers not covered by the standard fields."),
  })
  .describe("A collection of phone numbers for a person.");

export const event = z
  .union([
    singleDateEvent
      .describe("An event that has a date (and possible time) associated with it."),
    dateRangeEvent
      .describe("An event that has a start and end date (and possible time) associated with it."),
    otherEvent.describe("An event that is not a single date or date range.")
  ])
  .describe("Union of all event types.");

export const paginatedQueryParams = z
  .object({
    page: z
      .number()
      .int()
      .gte(1)
      .lte(2147483647)
      .optional()
      .default(1)
      .describe("The page to return."),
    pageSize: z
      .number()
      .int()
      .gte(1)
      .lte(2147483647)
      .optional()
      .default(100)
      .describe("The number of items to return per page."),
  })
  .describe("Query parameters for paginated routes.");

export const paginatedBodyParams = z
  .object({
    page: z
      .number()
      .int()
      .gte(1)
      .lte(2147483647)
      .optional()
      .default(1)
      .describe("The page to return."),
    pageSize: z
      .number()
      .int()
      .gte(1)
      .lte(2147483647)
      .optional()
      .default(100)
      .describe("The number of items to return per page."),
  })
  .describe("Body parameters for paginated routes.");

export const paginatedResultsInfo = z
  .object({
    page: z
      .number()
      .int()
      .gte(1)
      .lte(2147483647)
      .describe("Current page number (indexing starts at 1)."),
    pageSize: z
      .number()
      .int()
      .gte(1)
      .lte(2147483647)
      .describe("Number of items per page."),
    totalItems: z
      .number()
      .int()
      .gte(-2147483648)
      .lte(2147483647)
      .optional()
      .describe("Total number of items across all pages."),
    totalPages: z
      .number()
      .int()
      .gte(-2147483648)
      .lte(2147483647)
      .optional()
      .describe("Total number of pages."),
  })
  .describe("Details about the paginated results.");

export const sortOrder = z
  .enum(["asc", "desc"])

    .describe("Direction in which to sort a list of items. - `asc`: Ascending order (A→Z, 0→9, oldest→newest). - `desc`: Descending order (Z→A, 9→0, newest→oldest).");

export const sortQueryParams = z
  .object({
    sortBy: z.unknown().describe("The field to sort by."),
    customSortBy: z
      .string()
      .optional()
      .describe("Implementation-defined sort key."),
    sortOrder: sortOrder.optional().describe("The order to sort by."),
  })
  .describe("Query parameters for sorting.");

export const sortBodyParams = z
  .object({
    sortBy: z.unknown().describe("The field to sort by."),
    customSortBy: z
      .string()
      .optional()
      .describe("Implementation-defined sort key."),
    sortOrder: sortOrder.optional().describe("The order to sort by."),
  })
  .describe("Sorting parameters included in the request body.");

export const sortedResultsInfo = z
  .object({
    sortBy: z
      .string()

        .describe("The field results are sorted by, or \"custom\" if an implementation-defined sort key is used."),
    customSortBy: z
      .string()
      .optional()

        .describe("Implementation-defined sort key used to sort the results, if applicable."),
    sortOrder: sortOrder
      .describe("The order in which the results are sorted (ascending or descending)."),
    errors: z
      .array(z.string())
      .optional()
      .describe("Non-fatal errors that occurred during sorting."),
  })
  .describe("Information about the sort order of the items returned.");

export const equivalenceOperators = z
  .enum(["eq", "neq"])

    .describe("Operators that filter a field based on an exact match to a value. - `eq`: Equal to a value. - `neq`: Not equal to a value.");

export const comparisonOperators = z
  .enum(["gt", "gte", "lt", "lte"])

    .describe("Operators that filter a field based on a comparison to a value. - `gt`: Greater than a value. - `gte`: Greater than or equal to a value. - `lt`: Less than a value. - `lte`: Less than or equal to a value.");

export const arrayOperators = z
  .enum(["in", "notIn"])

    .describe("Operators that filter a field based on an array of values. - `in`: Field's value is one of the supplied values. - `notIn`: Field's value is not in the supplied values.");

export const stringOperators = z
  .enum(["like", "notLike"])

    .describe("Operators that filter a field based on a string value. - `like`: Field matches the supplied pattern (case-insensitive substring or wildcard). - `notLike`: Field does not match the supplied pattern.");

export const rangeOperators = z
  .enum(["between", "outside"])

    .describe("Operators that filter a field based on a range of values. - `between`: Field's value falls within the supplied inclusive range. - `outside`: Field's value falls outside the supplied range.");

export const allOperators = z
  .enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "notIn",
    "between",
    "outside",
    "like",
    "notLike"
  ])

    .describe("Union of every filter operator across equivalence, comparison, array, range, and string operators. - `eq`: Equal to a value. - `neq`: Not equal to a value. - `gt`: Greater than a value. - `gte`: Greater than or equal to a value. - `lt`: Less than a value. - `lte`: Less than or equal to a value. - `in`: Field's value is one of the supplied values. - `notIn`: Field's value is not in the supplied values. - `between`: Field's value falls within the supplied inclusive range. - `outside`: Field's value falls outside the supplied range. - `like`: Field matches the supplied pattern. - `notLike`: Field does not match the supplied pattern.");

export const defaultFilter = z
  .object({
    operator: z
      .union([
        equivalenceOperators
          .describe("Operators that filter a field based on an exact match to a value. - `eq`: Equal to a value. - `neq`: Not equal to a value."),
        comparisonOperators
          .describe("Operators that filter a field based on a comparison to a value. - `gt`: Greater than a value. - `gte`: Greater than or equal to a value. - `lt`: Less than a value. - `lte`: Less than or equal to a value."),
        arrayOperators
          .describe("Operators that filter a field based on an array of values. - `in`: Field's value is one of the supplied values. - `notIn`: Field's value is not in the supplied values."),
        stringOperators
          .describe("Operators that filter a field based on a string value. - `like`: Field matches the supplied pattern (case-insensitive substring or wildcard). - `notLike`: Field does not match the supplied pattern."),
        rangeOperators
          .describe("Operators that filter a field based on a range of values. - `between`: Field's value falls within the supplied inclusive range. - `outside`: Field's value falls outside the supplied range."),
        allOperators
          .describe("Union of every filter operator across equivalence, comparison, array, range, and string operators. - `eq`: Equal to a value. - `neq`: Not equal to a value. - `gt`: Greater than a value. - `gte`: Greater than or equal to a value. - `lt`: Less than a value. - `lte`: Less than or equal to a value. - `in`: Field's value is one of the supplied values. - `notIn`: Field's value is not in the supplied values. - `between`: Field's value falls within the supplied inclusive range. - `outside`: Field's value falls outside the supplied range. - `like`: Field matches the supplied pattern. - `notLike`: Field does not match the supplied pattern.")
      ])
      .describe("The operator to apply to the filter value."),
    value: z.unknown().describe("The value to use for the filter operation."),
  })

    .describe("A base filter model that can be used to create more specific filter models.");

export const dateComparisonFilter = z
  .object({
    operator: comparisonOperators
      .describe("The operator to apply to the filter value."),
    value: z
      .union([
        isoDate
          .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`."),
        z.coerce.date(),
        z.coerce.date()
      ])
      .describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to a date value.");

export const dateRangeFilter = z
  .object({
    operator: rangeOperators
      .describe("The operator to apply to the filter value."),
    value: z
      .object({
        min: z.union([
          isoDate
            .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`."),
          z.coerce.date(),
          z.coerce.date()
        ]),
        max: z.union([
          isoDate
            .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`."),
          z.coerce.date(),
          z.coerce.date()
        ]),
      })
      .describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to a range of date values.");

export const numberComparisonFilter = z
  .object({
    operator: z
      .union([
        comparisonOperators
          .describe("Operators that filter a field based on a comparison to a value. - `gt`: Greater than a value. - `gte`: Greater than or equal to a value. - `lt`: Less than a value. - `lte`: Less than or equal to a value."),
        equivalenceOperators
          .describe("Operators that filter a field based on an exact match to a value. - `eq`: Equal to a value. - `neq`: Not equal to a value.")
      ])
      .describe("The comparison operator to apply to the filter value."),
    value: z.number().describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to a numeric value.");

export const numberRangeFilter = z
  .object({
    operator: rangeOperators
      .describe("The operator to apply to the filter value."),
    value: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to a numeric range.");

export const numberArrayFilter = z
  .object({
    operator: arrayOperators
      .describe("The operator to apply to the filter value."),
    value: z
      .array(z.number())
      .describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to an array of numeric values.");

export const moneyComparisonFilter = z
  .object({
    operator: comparisonOperators
      .describe("The operator to apply to the filter value."),
    value: money.describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to a monetary value.");

export const moneyRangeFilter = z
  .object({
    operator: rangeOperators
      .describe("The operator to apply to the filter value."),
    value: z
      .object({
        min: money
          .describe("A monetary amount and the currency in which it's denominated."),
        max: money
          .describe("A monetary amount and the currency in which it's denominated."),
      })
      .describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to a range of monetary values.");

export const stringComparisonFilter = z
  .object({
    operator: z
      .union([
        equivalenceOperators
          .describe("Operators that filter a field based on an exact match to a value. - `eq`: Equal to a value. - `neq`: Not equal to a value."),
        stringOperators
          .describe("Operators that filter a field based on a string value. - `like`: Field matches the supplied pattern (case-insensitive substring or wildcard). - `notLike`: Field does not match the supplied pattern.")
      ])
      .describe("The operator to apply to the filter value."),
    value: z.string().describe("The value to use for the filter operation."),
  })
  .describe("A filter that applies a comparison to a string value.");

export const stringArrayFilter = z
  .object({
    operator: arrayOperators
      .describe("The operator to apply to the filter value."),
    value: z
      .array(z.string())
      .describe("The value to use for the filter operation."),
  })
  .describe("Filters by comparing a field to an array of string values.");

export const appPackageRef = z
  .object({
    id: uuid.uuid().describe("The application package's unique identifier."),
    name: z.string().describe("Human-readable display name."),
  })

    .describe("A denormalized reference to an application package. Clients follow the `id` to `GET /packages/{packageId}` for the full record.");

export const formRef = z
  .object({
    id: uuid.uuid().describe("The form's unique identifier."),
    name: z.string().describe("Human-readable display name."),
  })

    .describe("A denormalized reference to a form. Form definitions themselves live in the docs site / form library and are out of scope for the v0.1.0 data API; this ref is the link to follow once a Form resource exists.");

export const appPackageStatusOptions = z
  .enum(["active", "inactive", "custom"])

    .describe("Predefined set of application package statuses. - `active`: The package is accepting applications. - `inactive`: The package is not accepting applications. - `custom`: A caller-defined status.");

export const appPackageStatus = z
  .object({
    value: appPackageStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The status of an application package.");

export const programRef = z
  .object({
    id: uuid.uuid().describe("The program's unique identifier."),
    name: z.string().describe("Human-readable display name."),
  })

    .describe("A denormalized reference to a program. Carries enough information to display without a separate lookup; clients follow the `id` to `GET /programs/{programId}` for the full record. Used for parent references, lists of related programs, and embedded program references on other models (e.g., the programs included in an AppPackage).");

export const jurisdictionLevelOptions = z
  .enum(["country", "state", "county", "municipal", "tribal", "custom"])

    .describe("Predefined set of jurisdiction levels. - `country`: A nation-state. - `state`: A first-level subdivision of a country (e.g., U.S. state, Canadian province). - `county`: A second-level subdivision (e.g., U.S. county). - `municipal`: A city, town, or other municipality. - `tribal`: A tribal nation or tribal area. - `custom`: A caller-defined jurisdiction level.");

export const jurisdictionLevel = z
  .object({
    value: jurisdictionLevelOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })

    .describe("The level of a jurisdiction, modeled as an extensible enum so implementations can supply custom levels via the `description` field.");

export const jurisdictionRef = z
  .object({
    id: uuid.uuid().describe("The jurisdiction's unique identifier."),
    name: z.string().describe("Human-readable display name."),
  })

    .describe("A denormalized reference to a jurisdiction. Carries enough information to display without a separate lookup. Used for parent references and embedded jurisdiction references on other models.");

export const jurisdictionBase = z
  .object({
    id: uuid.uuid().describe("The jurisdiction's unique identifier."),
    name: z.string().describe("Human-readable display name."),
    level: jurisdictionLevel
      .describe("The level of this jurisdiction (country, state, etc.)."),
    identifiers: identifiers
      .describe("System and cross-system identifiers for this jurisdiction."),
    parent: jurisdictionRef
      .optional()

        .describe("The parent jurisdiction, if any. Null for country-level jurisdictions."),
  })

    .describe("A geographic or administrative unit within which a program operates. Multiple standards (ISO 3166-2, U.S. Census FIPS, U.S. Census GEOID) may be valid identifiers for the same jurisdiction; `identifiers.otherIds` carries those cross-system codes.");

export const programAgency = z
  .object({
    name: z.string().describe("The agency's full name."),
    code: z
      .string()
      .optional()
      .describe("A short code or abbreviation for the agency."),
    parent: z
      .object({
        name: z.string().describe("The parent agency's name."),
        code: z
          .string()
          .optional()
          .describe("The parent agency's short code or abbreviation."),
      })
      .optional()
      .describe("The parent agency, if any."),
  })

    .describe("A government or administrative body responsible for a program. Denormalized onto Program responses; not a standalone resource in v0.1.0.");

export const appPackageBase = z
  .object({
    identifiers: identifiers
      .describe("System and cross-system identifiers for this package."),
    name: z.string().describe("Human-readable display name."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description of the package."),
    programs: z
      .array(programRef
        .describe("A denormalized reference to a program. Carries enough information to display without a separate lookup; clients follow the `id` to `GET /programs/{programId}` for the full record. Used for parent references, lists of related programs, and embedded program references on other models (e.g., the programs included in an AppPackage)."))
      .describe("The programs this package applies for. Server-managed."),
    forms: z
      .array(formRef
        .describe("A denormalized reference to a form. Form definitions themselves live in the docs site / form library and are out of scope for the v0.1.0 data API; this ref is the link to follow once a Form resource exists."))
      .optional()
      .describe("Forms attached to this package."),
    jurisdiction: jurisdictionBase
      .optional()
      .describe("The jurisdiction in which this package is available."),
    administeringAgency: programAgency
      .optional()
      .describe("The administering agency for this package."),
    status: appPackageStatus.describe("The current status of the package."),
  })

    .describe("A specific application offering (e.g., PEAK, a joint SNAP+Medicaid+TANF application). Packages mediate between Applications and Programs: a client submits an Application against an AppPackage, and the server resolves which programs to enroll the household in based on the package's `programs` list. `programs` is server-managed — clients do not set it on create/update.");

export const programBase = z
  .object({
    identifiers: identifiers
      .describe("System and cross-system identifiers for this program."),
    name: z.string().describe("The program's name."),
    parent: programRef
      .optional()

        .describe("The parent program, if any. Null for root-level (e.g., federal) programs."),
    jurisdiction: jurisdictionBase
      .optional()
      .describe("The jurisdiction in which the program operates."),
    administeringAgency: programAgency
      .optional()
      .describe("The administering agency."),
    packages: z
      .array(appPackageRef
        .describe("A denormalized reference to an application package. Clients follow the `id` to `GET /packages/{packageId}` for the full record."))
      .optional()

        .describe("Application packages that include this program. Server-managed."),
  })

    .describe("An entry in the benefits program registry. Programs are hierarchical via `parent` (e.g., \"Colorado SNAP\" inherits from \"Supplemental Nutrition Assistance Program\").");

export const appStatusOptions = z
  .enum(["draft", "submitted", "withdrawn", "custom"])

    .describe("Predefined set of application statuses. - `draft`: The application is being filled out. - `submitted`: The application has been submitted for processing. - `withdrawn`: The application was withdrawn by the household. - `custom`: A caller-defined status.");

export const appStatus = z
  .object({
    value: appStatusOptions.describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The status of an application.");

export const appFormResponse = z
  .object({
    formId: uuid.uuid().describe("The unique identifier of the form."),
    formVersion: z.string().describe("The semantic version of the form."),
    responses: z
      .record(z.string(), z.unknown())
      .describe("A map of question IDs to submitted answers."),
  })

    .describe("A response to a single form within an application, captured as a snapshot at submission time.");

export const enrollmentStatusOptions = z
  .enum(["pending", "active", "denied", "closed", "custom"])

    .describe("Predefined set of enrollment statuses. - `pending`: Enrollment is pending an eligibility determination. - `active`: Enrollment is active. - `denied`: Enrollment was denied. - `closed`: Enrollment has been closed. - `custom`: A caller-defined status.");

export const enrollmentStatus = z
  .object({
    value: enrollmentStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The status of an enrollment.");

export const enrollmentRef = z
  .object({
    id: uuid
      .uuid()

        .describe("The enrollment's unique identifier. Use with `GET /households/{id}/enrollments`."),
    programId: uuid.uuid().describe("The program this enrollment is for."),
    status: enrollmentStatus.describe("The current status of the enrollment."),
  })

    .describe("A denormalized reference to an enrollment. Returned inline on responses that need to point at enrollments without including the full record (e.g., the `enrollments` field on ApplicationBase). Carries `programId` and `status` so callers can disambiguate which enrollment they want to follow up on without an extra `GET /households/{id}/enrollments`.");

export const applicationBase = z
  .object({
    id: uuid.uuid().describe("The application's unique identifier."),
    householdId: uuid.uuid().describe("The household this application is for."),
    packageId: uuid
      .uuid()

        .describe("The application package being submitted. The server resolves which programs the household is enrolled in based on the package's `programs` list — clients do not specify programs directly."),
    formResponses: z
      .record(
        z.string(),
        appFormResponse
          .describe("A response to a single form within an application, captured as a snapshot at submission time.")
      )
      .optional()
      .describe("Form responses keyed by form identifier."),
    status: appStatus.describe("The status of the application."),
    submittedAt: z
      .union([z.coerce.date(), z.null()])
      .optional()

        .describe("The timestamp at which the application was submitted. Null while `draft`."),
    validationErrors: z
      .array(z.unknown())
      .optional()
      .describe("Non-fatal validation errors that occurred during submission."),
    customFields: z
      .record(z.string(), customField.describe("A custom field on a model"))
      .optional()
      .describe("Implementation-defined custom fields."),
    enrollments: z
      .array(enrollmentRef
        .describe("A denormalized reference to an enrollment. Returned inline on responses that need to point at enrollments without including the full record (e.g., the `enrollments` field on ApplicationBase). Carries `programId` and `status` so callers can disambiguate which enrollment they want to follow up on without an extra `GET /households/{id}/enrollments`."))
      .optional()
      .describe("Abbreviated enrollment records created by this application."),
    createdAt: z.coerce
      .date()
      .describe("The timestamp (in UTC) at which the record was created."),
    lastModifiedAt: z.coerce
      .date()

        .describe("The timestamp (in UTC) at which the record was last modified."),
  })

    .describe("A submission event linking a Household to one or more Programs. Carries a snapshot of the form responses submitted. Creates one Enrollment per program on submission, surfaced inline as `enrollments`.");

export const personIdentifiers = identifiers
  .merge(z.object({
    ssn: z
      .string()
      .optional()

        .describe("Social Security Number. **Sensitive**: must be encrypted at rest."),
  }))

    .describe("Identifiers for a Person (household member). Adds `ssn` as a named canonical identifier on top of the base `Fields.Identifiers` shape. Implementations MUST encrypt `ssn` at rest.");

export const personCitizenshipStatusOptions = z
  .enum([
    "us_citizen",
    "lawful_permanent_resident",
    "refugee",
    "asylee",
    "cuban_haitian_entrant",
    "amerasian",
    "us_national",
    "victim_of_trafficking",
    "not_applicable",
    "custom"
  ])

    .describe("Predefined set of citizenship statuses. - `us_citizen`: U.S. citizen. - `lawful_permanent_resident`: Lawful Permanent Resident (green card holder). - `refugee`: Refugee. - `asylee`: Person granted asylum. - `cuban_haitian_entrant`: Cuban or Haitian entrant. - `amerasian`: Amerasian. - `us_national`: U.S. national (non-citizen). - `victim_of_trafficking`: Certified victim of human trafficking. - `not_applicable`: Not applicable to this member. - `custom`: A caller-defined status.");

export const personCitizenshipStatus = z
  .object({
    value: personCitizenshipStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's citizenship status.");

export const personImmigrationStatusOptions = z
  .enum([
    "lpr",
    "visa_holder",
    "daca",
    "temporary_protected_status",
    "undocumented",
    "not_applicable",
    "custom"
  ])

    .describe("Predefined set of immigration statuses. - `lpr`: Lawful Permanent Resident. - `visa_holder`: Holder of a temporary visa. - `daca`: Deferred Action for Childhood Arrivals. - `temporary_protected_status`: Temporary Protected Status. - `undocumented`: Undocumented. - `not_applicable`: Not applicable (e.g., U.S. citizen). - `custom`: A caller-defined status.");

export const personImmigrationStatus = z
  .object({
    value: personImmigrationStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's immigration status.");

export const personLegalProfile = z
  .object({
    citizenshipStatus: personCitizenshipStatus
      .optional()
      .describe("The person's citizenship status."),
    immigrationStatus: personImmigrationStatus
      .optional()
      .describe("The person's immigration status."),
  })

    .describe("A grouping of a person's legal-status attributes (citizenship and immigration). Distinct from `*Status` enum wrappers — Profile types are containers for related attribute fields.");

export const personDisabilityStatusOptions = z
  .enum(["none", "ssa_disability", "ssi_recipient", "state_defined", "custom"])

    .describe("Predefined set of disability statuses. - `none`: No disability. - `ssa_disability`: SSA-determined disability. - `ssi_recipient`: Supplemental Security Income recipient. - `state_defined`: State-defined disability determination. - `custom`: A caller-defined status.");

export const personDisabilityStatus = z
  .object({
    value: personDisabilityStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's disability status.");

export const personDisability = z
  .object({
    status: personDisabilityStatus.describe("The disability status."),
    determinationDate: z
      .union([
        isoDate
          .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`."),
        z.null()
      ])
      .optional()

        .describe("The date the disability was determined. Month-level precision is acceptable."),
    determinationSource: z
      .union([z.string(), z.null()])
      .optional()

        .describe("The source of the determination (e.g., `ssa`, `state_medicaid`)."),
  })
  .describe("A person's disability information.");

export const personPregnancyStatusOptions = z
  .enum(["not_pregnant", "pregnant", "custom"])

    .describe("Predefined set of pregnancy statuses. - `not_pregnant`: Not pregnant. - `pregnant`: Pregnant. - `custom`: A caller-defined status.");

export const personPregnancyStatus = z
  .object({
    value: personPregnancyStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's pregnancy status.");

export const personPregnancy = z
  .object({
    status: personPregnancyStatus.describe("The pregnancy status."),
    expectedDueDate: z
      .union([
        isoDate
          .describe("A date on a calendar in ISO 8601 format `YYYY-MM-DD`."),
        z.null()
      ])
      .optional()
      .describe("The expected due date in ISO 8601 format."),
  })
  .describe("A person's pregnancy information.");

export const personHealthProfile = z
  .object({
    disability: personDisability
      .optional()
      .describe("The person's disability information."),
    pregnancy: personPregnancy
      .optional()
      .describe("The person's pregnancy information."),
  })

    .describe("A grouping of a person's health attributes (disability and pregnancy).");

export const personEmploymentStatusOptions = z
  .enum([
    "employed_full_time",
    "employed_part_time",
    "self_employed",
    "unemployed",
    "not_in_labor_force",
    "custom"
  ])

    .describe("Predefined set of employment statuses. - `employed_full_time`: Employed full-time. - `employed_part_time`: Employed part-time. - `self_employed`: Self-employed. - `unemployed`: Unemployed and seeking work. - `not_in_labor_force`: Not in the labor force. - `custom`: A caller-defined status.");

export const personEmploymentStatus = z
  .object({
    value: personEmploymentStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's employment status.");

export const personStudentStatusOptions = z
  .enum(["not_enrolled", "enrolled_half_time", "enrolled_full_time", "custom"])

    .describe("Predefined set of student enrollment statuses. - `not_enrolled`: Not enrolled. - `enrolled_half_time`: Enrolled half-time. - `enrolled_full_time`: Enrolled full-time. - `custom`: A caller-defined status.");

export const personStudentStatus = z
  .object({
    value: personStudentStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's student enrollment status.");

export const personCaregiverStatusOptions = z
  .enum([
    "none",
    "caregiver_child_under_6",
    "caregiver_disabled_member",
    "custom"
  ])

    .describe("Predefined set of caregiver statuses. - `none`: Not a caregiver. - `caregiver_child_under_6`: Caregiver for a child under 6. - `caregiver_disabled_member`: Caregiver for a disabled household member. - `custom`: A caller-defined status.");

export const personCaregiverStatus = z
  .object({
    value: personCaregiverStatusOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("A person's caregiver status.");

export const personWorkProfile = z
  .object({
    employmentStatus: personEmploymentStatus
      .optional()
      .describe("The person's employment status."),
    studentStatus: personStudentStatus
      .optional()
      .describe("The person's student enrollment status."),
    hoursWorkedPerWeek: z
      .bigint()
      .optional()

        .describe("Hours worked per week. Relevant to work requirement thresholds."),
    caregiverStatus: personCaregiverStatus
      .optional()
      .describe("The person's caregiver status."),
  })

    .describe("A grouping of a person's work attributes (employment, student, hours worked, caregiver). Grouped because SNAP and Medicaid work requirements share exemption categories (disability, pregnancy, caregiving, student enrollment).");

export const personIncomeSourceTypeOptions = z
  .enum([
    "wages",
    "self_employment",
    "unemployment",
    "social_security",
    "ssi",
    "child_support",
    "alimony",
    "rental",
    "interest",
    "dividends",
    "pension",
    "veterans_benefits",
    "workers_compensation",
    "tribal_per_capita",
    "custom"
  ])

    .describe("Predefined set of income source types. - `wages`: Wages or salary from employment. - `self_employment`: Self-employment income. - `unemployment`: Unemployment benefits. - `social_security`: Social Security retirement or disability benefits. - `ssi`: Supplemental Security Income. - `child_support`: Child support payments. - `alimony`: Alimony or spousal support. - `rental`: Rental income. - `interest`: Interest income. - `dividends`: Dividend income. - `pension`: Pension or retirement income. - `veterans_benefits`: Veterans benefits. - `workers_compensation`: Workers' compensation. - `tribal_per_capita`: Tribal per capita payments. - `custom`: A caller-defined income type.");

export const personIncomeSourceType = z
  .object({
    value: personIncomeSourceTypeOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The type of an income source.");

export const personIncomeSource = z
  .object({
    type: personIncomeSourceType.describe("The type of income."),
    amount: money.describe("The monetary amount per period."),
    frequency: frequency
      .describe("The frequency at which the amount is received."),
  })
  .describe("A single source of income for a person.");

export const personBase = z
  .object({
    identifiers: personIdentifiers
      .describe("System, cross-system, and named canonical identifiers for this person."),
    name: name.describe("The person's name."),
    dateOfBirth: isoDate
      .describe("Date of birth in ISO 8601 format (YYYY-MM-DD)."),
    isHeadOfHousehold: z
      .boolean()

        .describe("`true` if this person is the head of household. Exactly one per household."),
    legalProfile: personLegalProfile
      .optional()

        .describe("The person's legal-status profile (citizenship, immigration)."),
    healthProfile: personHealthProfile
      .optional()
      .describe("The person's health profile (disability, pregnancy)."),
    workProfile: personWorkProfile
      .optional()
      .describe("The person's work profile (employment, student, caregiver)."),
    incomeSources: z
      .array(personIncomeSource
        .describe("A single source of income for a person."))
      .optional()
      .describe("The person's sources of income."),
    customFields: z
      .record(z.string(), customField.describe("A custom field on a model"))
      .optional()
      .describe("Implementation-defined custom fields."),
  })

    .describe("An individual member of a household. Eligibility-relevant attributes are grouped into `legalProfile`, `healthProfile`, and `workProfile` so related fields stay together and additional fields can be added within each group without restructuring the top level.");

export const householdRelationshipTypeOptions = z
  .enum([
    "spouse",
    "domestic_partner",
    "parent",
    "child",
    "sibling",
    "tax_dependent",
    "cohabitant",
    "legal_guardian",
    "foster_parent",
    "foster_child",
    "custom"
  ])

    .describe("Predefined set of household relationship types. - `spouse`: Spouse. - `domestic_partner`: Domestic partner. - `parent`: Parent (biological, adoptive, or step). - `child`: Child (biological, adoptive, or step). - `sibling`: Sibling. - `tax_dependent`: Tax dependent. - `cohabitant`: Cohabitant not otherwise related. - `legal_guardian`: Legal guardian. - `foster_parent`: Foster parent. - `foster_child`: Foster child. - `custom`: A caller-defined relationship.");

export const householdRelationshipType = z
  .object({
    value: householdRelationshipTypeOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The type of a relationship between two household members.");

export const householdRelationship = z
  .object({
    fromMemberId: uuid
      .uuid()

        .describe("The unique identifier of the source member (`PersonIdentifiers.systemId`)."),
    toMemberId: uuid
      .uuid()
      .describe("The unique identifier of the target member."),
    relationshipType: householdRelationshipType
      .describe("The type of relationship (from → to)."),
  })

    .describe("A directed edge between two members of a household describing how they are related (e.g., parent → child).");

export const householdBase = z
  .object({
    id: uuid.uuid().describe("The household's unique identifier."),
    addresses: addressCollection
      .optional()
      .describe("The household's residential, mailing, and other addresses."),
    members: z
      .array(personBase
        .describe("An individual member of a household. Eligibility-relevant attributes are grouped into `legalProfile`, `healthProfile`, and `workProfile` so related fields stay together and additional fields can be added within each group without restructuring the top level."))

        .describe("The members of the household. At least one member is required."),
    relationships: z
      .array(householdRelationship
        .describe("A directed edge between two members of a household describing how they are related (e.g., parent → child)."))
      .optional()
      .describe("Relationships between members of the household."),
    customFields: z
      .record(z.string(), customField.describe("A custom field on a model"))
      .optional()
      .describe("Implementation-defined custom fields."),
    createdAt: z.coerce
      .date()
      .describe("The timestamp (in UTC) at which the record was created."),
    lastModifiedAt: z.coerce
      .date()

        .describe("The timestamp (in UTC) at which the record was last modified."),
  })

    .describe("The persistent eligibility data record for a group of people applying for benefits together. Accumulates over time as the household fills out additional forms.");

export const determinationHousehold = z
  .object({
    id: uuid.uuid().describe("The household this determination applies to."),
    revisionId: z
      .union([
        uuid.uuid().describe("A universally unique identifier."),
        z.null()
      ])
      .optional()
      .describe("The household revision record, if revisions are implemented."),
    snapshot: z
      .union([
        householdBase
          .describe("The persistent eligibility data record for a group of people applying for benefits together. Accumulates over time as the household fills out additional forms."),
        z.null()
      ])
      .optional()

        .describe("The full household snapshot, if revisions are not implemented."),
  })

    .describe("Reference to the household data used for an eligibility determination. If the implementation supports household revisions, `revisionId` references the immutable revision record and `snapshot` is null. If not, `snapshot` carries the full household JSON inline and `revisionId` is null. Both MAY be present if the implementation populates both.");

export const determinationOutcomeOptions = z
  .enum(["eligible", "ineligible", "pending", "needs_verification", "custom"])

    .describe("Predefined set of eligibility determination outcomes. - `eligible`: Determined eligible. - `ineligible`: Determined ineligible. - `pending`: Determination is pending additional data or processing. - `needs_verification`: Eligible pending verification of submitted data. - `custom`: A caller-defined outcome.");

export const determinationOutcome = z
  .object({
    value: determinationOutcomeOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The outcome of an eligibility determination.");

export const determinationEstimatedBenefit = z
  .object({
    amount: money.describe("The estimated monetary amount."),
    frequency: frequency
      .describe("The cadence at which the benefit would be paid."),
  })

    .describe("An estimated benefit amount and the cadence at which it would be paid.");

export const determinationBasisTypeOptions = z
  .enum(["direct", "categorical", "custom"])

    .describe("Predefined set of bases on which a determination can be made. - `direct`: The determination was made directly from the household's data. - `categorical`: The determination was made via categorical eligibility (e.g., already enrolled in a qualifying program). - `custom`: A caller-defined basis.");

export const determinationBasisType = z
  .object({
    value: determinationBasisTypeOptions
      .describe("The selected value, typed to `T`."),
    customValue: z
      .string()
      .optional()

        .describe("Caller-defined value when `value` is the `custom` option (or otherwise does not fit a predefined option in `T`)."),
    description: z
      .string()
      .optional()
      .describe("Human-readable description or annotation for the value."),
  })
  .describe("The type of basis on which a determination was made.");

export const determinationBasis = z
  .object({
    type: determinationBasisType.describe("The type of basis."),
    sourceProgramId: uuid
      .uuid()
      .optional()

        .describe("The program that confers categorical eligibility. Required when `type` is `categorical`."),
    sourceEnrollmentId: uuid
      .uuid()
      .optional()

        .describe("The enrollment that confers categorical eligibility. Required when `type` is `categorical`."),
  })

    .describe("The basis on which a determination was made. For `categorical`, `sourceProgramId` and `sourceEnrollmentId` are required.");

export const determinationProducer = z
  .object({
    adapterId: z
      .string()

        .describe("The identifier of the adapter that produced this determination."),
    adapterVersion: z.string().describe("The semantic version of the adapter."),
    rulesVersion: z
      .string()

        .describe("The rules version used by the adapter (e.g., a date stamp like \"2026-05\")."),
  })
  .describe("Provenance information for an eligibility determination.");

export const eligibilityDeterminationBase = z
  .object({
    id: uuid.uuid().describe("The determination's unique identifier."),
    household: determinationHousehold
      .describe("Reference to the household data used for this determination."),
    outcome: determinationOutcome.describe("The outcome of the determination."),
    estimatedBenefit: z
      .union([
        determinationEstimatedBenefit
          .describe("An estimated benefit amount and the cadence at which it would be paid."),
        z.null()
      ])
      .optional()

        .describe("The estimated benefit, if eligible and the amount is calculable."),
    basis: determinationBasis
      .describe("The basis on which the determination was made."),
    determinedAt: z.coerce
      .date()
      .describe("The timestamp at which the determination was made."),
    producedBy: determinationProducer
      .describe("Provenance information for the determination."),
  })
  .describe("A point-in-time eligibility outcome for a specific Enrollment.");

export const enrollmentBase = z
  .object({
    id: uuid.uuid().describe("The enrollment's unique identifier."),
    householdId: uuid
      .uuid()
      .describe("The household this enrollment belongs to."),
    programId: uuid.uuid().describe("The program this enrollment is for."),
    applicationId: uuid
      .uuid()
      .describe("The application that created this enrollment."),
    status: enrollmentStatus.describe("The current status of the enrollment."),
    determinations: z
      .array(eligibilityDeterminationBase
        .describe("A point-in-time eligibility outcome for a specific Enrollment."))
      .optional()

        .describe("Eligibility determinations for this enrollment, ordered by `determinedAt` ascending."),
    createdAt: z.coerce
      .date()
      .describe("The timestamp (in UTC) at which the record was created."),
    lastModifiedAt: z.coerce
      .date()

        .describe("The timestamp (in UTC) at which the record was last modified."),
  })

    .describe("The persistent relationship between a Household and a Program. Created when an Application is submitted. Accumulates EligibilityDeterminations over time.");

export const versions = z
  .enum(["0.1.0"])
  .describe("Versions of the CommonBenefits protocol.");
