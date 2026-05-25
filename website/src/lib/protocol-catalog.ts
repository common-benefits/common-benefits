export type ProtocolCategory = "types" | "fields" | "filters" | "responses" | "models";

/** Where a schema's content comes from. */
export type SchemaSource =
  | {
      /** Schema is emitted from TypeSpec into `public/schemas/yaml/<schema>.yaml`. */
      kind: "typespec";
      /** Path to the `.tsp` source file, relative to repo root. Drives the TypeSpec tab. */
      sourcePath: string;
    }
  | {
      /** Schema is defined inline (e.g. JSON Schema primitives like `string`, `integer`). */
      kind: "inline";
      /** Inline JSON Schema YAML string. */
      jsonSchema: string;
      /** Optional inline example body (one or more values, free-form). */
      example?: string;
    };

export interface SchemaEntry {
  /** Schema name as referenced in `<SchemaTable schema="..." />` and JSON Schema `$ref`s. */
  schema: string;
  source: SchemaSource;
}

export interface PageEntry {
  /** URL slug under `/protocol/<category>/` (or `/protocol/` for narrative pages). */
  page: string;
  title: string;
  description?: string;
  /** Category drives the sidebar grouping AND the URL prefix. Omit for narrative pages at /protocol/<page>. */
  category?: ProtocolCategory;
  /** Schemas rendered on this page, in order. */
  schemas: SchemaEntry[];
  /**
   * If true, this page is hand-written MDX (under `src/content/docs/protocol/`) and `[slug].astro`
   * will not generate it. The schemas array still feeds `getDocPath` so the schemas are
   * cross-linkable from elsewhere.
   */
  narrative?: boolean;
}

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

// ============================================================================
// Lookups
// ============================================================================

interface ResolvedSchema {
  page: PageEntry;
  entry: SchemaEntry;
}

const schemaIndex = new Map<string, ResolvedSchema>();
for (const page of pages) {
  for (const entry of page.schemas) {
    schemaIndex.set(entry.schema, { page, entry });
  }
}

/** Returns the page metadata + schema entry for a given schema name. */
export const findSchema = (name: string): ResolvedSchema | undefined => schemaIndex.get(name);

/** Returns all PageEntries in a category that are NOT narrative (i.e. driven by [slug].astro). */
export const pagesByCategory = (category: ProtocolCategory): PageEntry[] =>
  pages.filter((p) => p.category === category && !p.narrative);

/** Returns getStaticPaths-shaped data for the dynamic [slug].astro route in a category. */
export const bySlug = (category: ProtocolCategory) =>
  pagesByCategory(category).map((p) => ({ params: { slug: p.page }, props: p }));

/** Resolves a schema name to its `/protocol/.../#anchor` URL, or undefined if unknown. */
export const getDocPath = (name: string): string | undefined => {
  const found = schemaIndex.get(name);
  if (!found) return undefined;
  const { page } = found;
  const base = page.category ? `/protocol/${page.category}/${page.page}` : `/protocol/${page.page}`;
  return `${base}#${name.toLowerCase()}`;
};
