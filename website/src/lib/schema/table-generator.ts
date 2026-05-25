import type { JsonSchema } from "./schema-loader";

export interface PropertyRow {
  property: string;
  /** Inner HTML for the Type column (may contain anchor tags for cross-links). */
  type: string;
  required: boolean;
  description: string;
}

export interface EnumRow {
  value: string;
  description: string;
}

/**
 * Generates table rows for SchemaTable from a parsed JSON Schema.
 *
 * Pass `getSchemaDocPath` (typically `getDocPath` from `protocol-catalog.ts`)
 * so the Type column can render `<a href="/protocol/fields/address">Address</a>`
 * for properties that reference other catalog entries — including primitives
 * (`string`, `integer`, etc.) which are catalog entries on the types pages.
 */
export class TableGenerator {
  static generatePropertyRows(
    schema: JsonSchema,
    getSchemaDocPath?: (typeName: string) => string | undefined
  ): PropertyRow[] {
    const rows: PropertyRow[] = [];
    const required = new Set<string>();

    if (Array.isArray(schema.allOf)) {
      for (const part of schema.allOf) {
        if (part.properties) {
          rows.push(
            ...this.processProperties(part.properties, part.required ?? [], getSchemaDocPath)
          );
          for (const f of part.required ?? []) required.add(f);
        }
      }
    }

    if (schema.properties) {
      rows.push(
        ...this.processProperties(schema.properties, schema.required ?? [], getSchemaDocPath)
      );
      for (const f of schema.required ?? []) required.add(f);
    }

    const uniq = new Map<string, PropertyRow>();
    for (const row of rows) {
      if (required.has(row.property)) row.required = true;
      uniq.set(row.property, row);
    }
    return Array.from(uniq.values());
  }

  static generateEnumRows(schema: JsonSchema): EnumRow[] {
    if (!Array.isArray(schema.enum)) return [];
    return schema.enum.map((value) => ({
      value: String(value),
      description: this.extractEnumDescription(schema, String(value)),
    }));
  }

  private static processProperties(
    properties: Record<string, JsonSchema>,
    required: string[],
    getSchemaDocPath?: (typeName: string) => string | undefined
  ): PropertyRow[] {
    return Object.entries(properties).map(([name, propSchema]) => ({
      property: name,
      type: this.formatType(propSchema, getSchemaDocPath),
      required: required.includes(name),
      description: propSchema.description ?? "",
    }));
  }

  /**
   * Formats a property type for the Type column.
   *
   * Handles: $ref (linked when known), arrays (items[]), unions (anyOf/oneOf as `A | B`),
   * enums (literal values), and bare scalars. Bare scalars like `string` and `integer`
   * also get linked when they're catalog entries (primitives live on the types pages).
   */
  private static formatType(
    schema: JsonSchema,
    getSchemaDocPath?: (typeName: string) => string | undefined
  ): string {
    if (schema.$ref) {
      const name = this.refName(schema.$ref);
      return this.linkOrCode(name, getSchemaDocPath);
    }
    if (Array.isArray(schema.anyOf) || Array.isArray(schema.oneOf)) {
      const variants = (schema.anyOf ?? schema.oneOf)!;
      return variants.map((v) => this.formatType(v, getSchemaDocPath)).join(" | ");
    }
    if (schema.type === "array" && schema.items) {
      return `${this.formatType(schema.items, getSchemaDocPath)}[]`;
    }
    if (Array.isArray(schema.enum)) {
      return schema.enum.map((v) => `<code>${String(v)}</code>`).join(" | ");
    }
    if (typeof schema.type === "string") {
      return this.linkOrCode(schema.type, getSchemaDocPath);
    }
    return "<code>unknown</code>";
  }

  private static linkOrCode(
    name: string,
    getSchemaDocPath?: (typeName: string) => string | undefined
  ): string {
    const docPath = getSchemaDocPath?.(name);
    return docPath ? `<a href="${docPath}"><code>${name}</code></a>` : `<code>${name}</code>`;
  }

  private static refName(ref: string): string {
    const last = ref.split(/[/#]/).filter(Boolean).pop() ?? ref;
    return last.replace(/\.yaml$/, "");
  }

  /**
   * Pulls a per-value description from a markdown-style enum description.
   * Recognizes "- `value`: description" lines.
   */
  private static extractEnumDescription(schema: JsonSchema, value: string): string {
    if (!schema.description) return "";
    for (const line of schema.description.split("\n")) {
      if (line.includes(`\`${value}\``)) {
        const match = line.match(/`[^`]+`:\s*(.+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  }
}
