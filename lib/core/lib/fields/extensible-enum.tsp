namespace CommonBenefits.Fields;

/** An open enum: an optional `value` of unspecified shape plus a free-form
 * `description`. Use this when the value set is open-ended and a typed
 * constraint isn't appropriate. For typed variants, see `ExtensibleEnumT<T>`.
 */
@example(Examples.ExtensibleEnum.customStatus)
@Versioning.added(Versions.v0_1)
model ExtensibleEnum {
  /** The selected value. May be from a predefined set or a caller-defined value. */
  value: unknown;

  /** Caller-defined value when `value` does not fit a predefined option. */
  customValue?: string;

  /** Human-readable description or annotation for the value. */
  description?: string;
}

/** A typed open enum: `value` is constrained to a caller-supplied enum (or
 * other type), with a free-form `description` for annotation or custom-value
 * details.
 *
 * @template T The type (typically an enum) accepted for `value`.
 *
 * @example How to instantiate a typed extensible enum
 *
 * ```typespec
 * enum CitizenshipStatusOptions {
 *   us_citizen,
 *   lawful_permanent_resident,
 *   custom,
 * }
 *
 * model CitizenshipStatus is ExtensibleEnumT<CitizenshipStatusOptions>;
 * ```
 */
@Versioning.added(Versions.v0_1)
model ExtensibleEnumT<T> {
  /** The selected value, typed to `T`. */
  value: T;

  /** Caller-defined value when `value` is the `custom` option (or otherwise
   * does not fit a predefined option in `T`). */
  customValue?: string;

  /** Human-readable description or annotation for the value. */
  description?: string;
}

namespace Examples.ExtensibleEnum {
  const customStatus = #{ value: "us_citizen", description: "U.S. citizen by birth" };
}
