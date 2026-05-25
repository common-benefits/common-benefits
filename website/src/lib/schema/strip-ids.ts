/**
 * Recursively removes `$id` fields from a schema object.
 *
 * After full $ref inlining via $RefParser.dereference(), the same $id can
 * appear multiple times in the schema tree — once per composite that
 * references the same sub-schema. AJV (used internally by JsonForms,
 * validation pipelines, etc.) throws "resolves to more than one schema"
 * when it encounters duplicate $id values. Stripping them prevents that
 * error while leaving the structural schema intact.
 */
export function stripIds<T>(schema: T): T {
  return JSON.parse(
    JSON.stringify(schema, (key, value) => {
      if (key === "$id" && typeof value === "string") return undefined;
      return value;
    })
  ) as T;
}
