import $RefParser from "@apidevtools/json-schema-ref-parser";
import mergeAllOf from "json-schema-merge-allof";
import { stripIds } from "./strip-ids";

/**
 * Loads a schema by file path, resolves all $ref references, and returns
 * the raw dereferenced result. Uses @apidevtools/json-schema-ref-parser.
 */
export async function resolveSchemaRefs(schemaPath: string): Promise<Record<string, unknown>> {
  return (await $RefParser.dereference(schemaPath)) as Record<string, unknown>;
}

/**
 * Fully dereferences a schema file: resolves all $ref references, merges
 * allOf entries (from TypeSpec `extends` patterns), strips $schema (which
 * can confuse downstream AJV consumers like JsonForms), and strips all
 * $id fields from the inlined tree.
 *
 * See `strip-ids.ts` for the explanation of the duplicate-$id bug.
 * This is the main entry point for preparing a schema for rendering or sampling.
 */
export async function dereferenceSchema(schemaPath: string): Promise<Record<string, unknown>> {
  const resolved = await resolveSchemaRefs(schemaPath);
  // For allOf merges, the base schema (child) comes first and allOf entries
  // (parent) come after. Use defaultResolver: values[0] so child overrides parent.
  const merged = mergeAllOf(resolved, {
    resolvers: {
      defaultResolver: (values) => values[0],
    },
  }) as Record<string, unknown>;
  delete merged.$schema;
  return stripIds(merged);
}
