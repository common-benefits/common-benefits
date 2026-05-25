namespace CommonBenefits.Filters;

// ############################################################################
// Filter operators
// ############################################################################

/** Operators that filter a field based on an exact match to a value.
 *
 * - `eq`: Equal to a value.
 * - `neq`: Not equal to a value.
 */
enum EquivalenceOperators {
  /** Equal to a value. */
  eq,

  /** Not equal to a value. */
  neq,
}

/** Operators that filter a field based on a comparison to a value.
 *
 * - `gt`: Greater than a value.
 * - `gte`: Greater than or equal to a value.
 * - `lt`: Less than a value.
 * - `lte`: Less than or equal to a value.
 */
enum ComparisonOperators {
  /** Greater than a value. */
  gt,

  /** Greater than or equal to a value. */
  gte,

  /** Less than a value. */
  lt,

  /** Less than or equal to a value. */
  lte,
}

/** Operators that filter a field based on an array of values.
 *
 * - `in`: Field's value is one of the supplied values.
 * - `notIn`: Field's value is not in the supplied values.
 */
enum ArrayOperators {
  /** Field's value is one of the supplied values. */
  in,

  /** Field's value is not in the supplied values. */
  notIn,
}

/** Operators that filter a field based on a string value.
 *
 * - `like`: Field matches the supplied pattern (case-insensitive substring or wildcard).
 * - `notLike`: Field does not match the supplied pattern.
 */
enum StringOperators {
  /** Field matches the supplied pattern (case-insensitive substring or wildcard). */
  like,

  /** Field does not match the supplied pattern. */
  notLike,
}

/** Operators that filter a field based on a range of values.
 *
 * - `between`: Field's value falls within the supplied inclusive range.
 * - `outside`: Field's value falls outside the supplied range.
 */
enum RangeOperators {
  /** Field's value falls within the supplied inclusive range. */
  between,

  /** Field's value falls outside the supplied range. */
  outside,
}

/** Union of every filter operator across equivalence, comparison, array, range, and string operators.
 *
 * - `eq`: Equal to a value.
 * - `neq`: Not equal to a value.
 * - `gt`: Greater than a value.
 * - `gte`: Greater than or equal to a value.
 * - `lt`: Less than a value.
 * - `lte`: Less than or equal to a value.
 * - `in`: Field's value is one of the supplied values.
 * - `notIn`: Field's value is not in the supplied values.
 * - `between`: Field's value falls within the supplied inclusive range.
 * - `outside`: Field's value falls outside the supplied range.
 * - `like`: Field matches the supplied pattern.
 * - `notLike`: Field does not match the supplied pattern.
 */
enum AllOperators {
  ...EquivalenceOperators,
  ...ComparisonOperators,
  ...ArrayOperators,
  ...RangeOperators,
  ...StringOperators,
}

// ############################################################################
// Filter model
// ############################################################################

/** A base filter model that can be used to create more specific filter models. */
model DefaultFilter {
  /** The operator to apply to the filter value. */
  operator:
    | EquivalenceOperators
    | ComparisonOperators
    | ArrayOperators
    | StringOperators
    | RangeOperators
    | AllOperators;

  /** The value to use for the filter operation. */
  value: unknown;
}
