import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { Paths } from "../paths";
import { findSchema, type SchemaSource } from "../protocol-catalog";

/** JSON Schema object structure (subset we use). */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
  enum?: unknown[];
  items?: JsonSchema;
  $ref?: string;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  format?: string;
  $defs?: Record<string, JsonSchema>;
  examples?: unknown[];
  example?: unknown;
  [key: string]: unknown;
}

export class SchemaLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "SchemaLoadError";
  }
}

/**
 * Loads parsed JSON Schemas from either compiled YAML in public/schemas/yaml/
 * (TypeSpec-emitted) or from inline catalog definitions. Caches parsed schemas
 * by name.
 */
export class SchemaLoader {
  private static schemaCache = new Map<string, JsonSchema>();

  /** Parses a YAML string into a JsonSchema. */
  static parseYaml(content: string): JsonSchema {
    const data = yaml.load(content, { schema: yaml.CORE_SCHEMA }) as JsonSchema;
    if (!data) throw new SchemaLoadError("Schema YAML is empty or invalid");
    return data;
  }

  /** Loads a schema by absolute path. */
  static loadFromFile(absoluteSchemaPath: string): JsonSchema {
    if (this.schemaCache.has(absoluteSchemaPath)) {
      return this.schemaCache.get(absoluteSchemaPath)!;
    }
    try {
      const content = readFileSync(absoluteSchemaPath, "utf-8");
      const data = this.parseYaml(content);
      this.schemaCache.set(absoluteSchemaPath, data);
      return data;
    } catch (error) {
      if (error instanceof SchemaLoadError) throw error;
      throw new SchemaLoadError(
        `Error reading schema file ${absoluteSchemaPath}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Loads a schema by its name, consulting the catalog to determine whether
   * the source is a compiled YAML file or an inline definition.
   */
  static loadSchemaByName(schemaName: string): JsonSchema {
    const cacheKey = `name:${schemaName}`;
    if (this.schemaCache.has(cacheKey)) return this.schemaCache.get(cacheKey)!;

    const found = findSchema(schemaName);
    if (!found) {
      throw new SchemaLoadError(`Schema "${schemaName}" is not registered in protocol-catalog.ts.`);
    }
    const source = found.entry.source;
    const data =
      source.kind === "typespec"
        ? this.loadFromFile(join(Paths.SCHEMAS_DIR, `${schemaName}.yaml`))
        : this.parseYaml(source.jsonSchema);
    this.schemaCache.set(cacheKey, data);
    return data;
  }

  /** Returns the raw YAML string for a schema (compiled file contents OR inline JSON Schema). */
  static loadRawYamlByName(schemaName: string): string {
    const found = findSchema(schemaName);
    if (!found) {
      throw new SchemaLoadError(`Schema "${schemaName}" is not registered in protocol-catalog.ts.`);
    }
    const source: SchemaSource = found.entry.source;
    if (source.kind === "inline") return source.jsonSchema;
    return readFileSync(join(Paths.SCHEMAS_DIR, `${schemaName}.yaml`), "utf-8");
  }

  static isEnumSchema(schema: JsonSchema): boolean {
    return Boolean(schema.enum);
  }

  static isObjectSchema(schema: JsonSchema): boolean {
    return schema.type === "object" && Boolean(schema.properties);
  }

  static clearCaches(): void {
    this.schemaCache.clear();
  }
}
