namespace CommonBenefits.Fields;

/** The set of JSON schema types supported by a custom field.
 *
 * - `string`: A sequence of characters.
 * - `number`: A numeric value (integer or decimal).
 * - `integer`: A whole number without decimals.
 * - `boolean`: A `true` or `false` value.
 * - `object`: A nested object with its own properties.
 * - `array`: An ordered list of values.
 */
@Versioning.added(Versions.v0_1)
enum CustomFieldType {
  /** A sequence of characters. */
  string,

  /** A numeric value (integer or decimal). */
  number,

  /** A whole number without decimals. */
  integer,

  /** A `true` or `false` value. */
  boolean,

  /** A nested object with its own properties. */
  object,

  /** An ordered list of values. */
  array,
}

/** Model for defining custom fields that are specific to a given implementation.
 *
 * @example How to define a custom field using this model
 *
 * ```typespec
 * model Agency extends CustomField {
 *   name: "agency";
 *   fieldType: CustomFieldType.string;
 *
 *   @example("Department of Health and Human Services")
 *   value: string;
 *
 *   description?: "The agency administering this benefit";
 * }
 * ```
 */
@example(Examples.CustomField.programArea, #{ title: "String field for program area" })
@example(Examples.CustomField.eligibilityTypes, #{ title: "Array field for eligibility types" })
@doc("A custom field on a model")
@Versioning.added(Versions.v0_1)
model CustomField {
  /** Name of the custom field. */
  name: string;

  /** The JSON schema type to use when de-serializing the `value` field. */
  fieldType: CustomFieldType;

  /** Link to the full JSON schema for this custom field. */
  schema?: url;

  /** Value of the custom field. */
  value: unknown;

  /** Description of the custom field's purpose. */
  description?: string;
}

namespace Examples.CustomField {
  const programArea = #{
    name: "programArea",
    fieldType: CustomFieldType.string,
    value: "Food assistance",
    description: "Primary focus area of the benefit program",
    schema: "https://example.com/program-areas.json",
  };

  const agency = #{
    name: "agency",
    fieldType: CustomFieldType.string,
    value: "Department of Health and Human Services",
    description: "The agency administering this benefit",
  };

  const eligibilityTypes = #{
    name: "eligibilityType",
    fieldType: CustomFieldType.array,
    value: #["individual", "household"],
    description: "Types of eligible applicants",
  };
}
