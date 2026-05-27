import { pages } from "./protocol-pages";

// ============================================================================
// Types
// ============================================================================

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
