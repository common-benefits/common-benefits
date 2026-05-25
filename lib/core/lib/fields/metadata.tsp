namespace CommonBenefits.Fields;

/** Standard system-level metadata about a given record.
 *
 * @example How to spread the SystemMetadata props into another record
 *
 * ```typespec
 * model Application {
 *   id: uuid;
 *   title: string;
 *
 *   // Includes SystemMetadata props in the root of the Application model
 *   ...SystemMetadata;
 * }
 * ```
 */
@example(Examples.Metadata.system)
model SystemMetadata {
  /** The timestamp (in UTC) at which the record was created. */
  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;

  /** The timestamp (in UTC) at which the record was last modified. */
  @visibility(Lifecycle.Read)
  lastModifiedAt: utcDateTime;
}

namespace Examples.Metadata {
  const system = #{
    createdAt: utcDateTime.fromISO("2025-01-01T17:01:01"),
    lastModifiedAt: utcDateTime.fromISO("2025-01-02T17:30:00"),
  };
}
