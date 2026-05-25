import OpenAPISampler from "openapi-sampler";
import { join } from "node:path";
import { Paths } from "../paths";
import { dereferenceSchema } from "./ref-resolver";
import { findSchema } from "../protocol-catalog";
import { SchemaLoader } from "./schema-loader";

/**
 * Generates a sample example for a given schema name.
 *
 * For TypeSpec-emitted schemas: dereferences the YAML file from disk (so nested
 * $refs are inlined), then runs openapi-sampler. This produces a complete example
 * even when only nested sub-schemas have @example decorators.
 *
 * For inline-defined schemas (primitives like `string`, `integer`): runs the
 * sampler against the inline JSON Schema directly. Honors an explicit `example`
 * field on the catalog entry if provided.
 */
export async function generateSchemaExample(schemaName: string): Promise<string> {
  const found = findSchema(schemaName);
  if (!found) {
    throw new Error(`Schema "${schemaName}" is not in protocol-catalog.ts.`);
  }

  const source = found.entry.source;

  if (source.kind === "inline" && source.example !== undefined) {
    return source.example;
  }

  if (source.kind === "inline") {
    const parsed = SchemaLoader.parseYaml(source.jsonSchema);
    const sample = OpenAPISampler.sample(parsed as Parameters<typeof OpenAPISampler.sample>[0]);
    return JSON.stringify(sample, null, 2);
  }

  // TypeSpec source: dereference the compiled YAML, then sample.
  const filePath = join(Paths.SCHEMAS_DIR, `${schemaName}.yaml`);
  const resolved = await dereferenceSchema(filePath);
  const sample = OpenAPISampler.sample(resolved as Parameters<typeof OpenAPISampler.sample>[0]);
  return JSON.stringify(sample, null, 2);
}
