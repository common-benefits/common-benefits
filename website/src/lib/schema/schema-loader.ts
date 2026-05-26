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

  /**
   * Like `loadSchemaByName`, but resolves any top-level `allOf` `$ref`s by
   * inlining the referenced schema's `properties` and `required`. Nested
   * `$ref`s inside properties stay intact so the table can still link to
   * them as cross-references.
   *
   * Used for models that extend a base via TypeSpec `extends` (which emits
   * as `allOf: [$ref]`) — e.g., `*Status` wrappers extending
   * `ExtensibleEnumT<T>`, or `Ok` / `Paginated` extending `Success`.
   */
  static loadResolvedSchemaByName(schemaName: string): JsonSchema {
    return this.resolveTopLevelAllOf(this.loadSchemaByName(schemaName));
  }

  /**
   * Like `loadRawYamlByName`, but for schemas with top-level `allOf` it
   * returns the merged form serialized to YAML. Schemas without `allOf`
   * return the original file contents verbatim so formatting is preserved.
   */
  static loadResolvedYamlByName(schemaName: string): string {
    const original = this.loadSchemaByName(schemaName);
    if (!Array.isArray(original.allOf)) return this.loadRawYamlByName(schemaName);
    const resolved = this.resolveTopLevelAllOf(original);
    return yaml.dump(resolved, { lineWidth: -1 });
  }

  private static resolveTopLevelAllOf(schema: JsonSchema): JsonSchema {
    if (!Array.isArray(schema.allOf)) return schema;

    const merged: JsonSchema = {
      ...schema,
      properties: { ...(schema.properties ?? {}) },
      required: [...(schema.required ?? [])],
    };

    for (const part of schema.allOf) {
      let resolved: JsonSchema = part;
      if (part.$ref) {
        const refFile = part.$ref.replace(/^.*[\\/]/, "");
        try {
          resolved = this.resolveTopLevelAllOf(this.loadFromFile(join(Paths.SCHEMAS_DIR, refFile)));
        } catch {
          continue;
        }
      }
      Object.assign(merged.properties!, resolved.properties ?? {});
      for (const f of resolved.required ?? []) {
        if (!merged.required!.includes(f)) merged.required!.push(f);
      }
    }

    delete merged.allOf;
    return merged;
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
