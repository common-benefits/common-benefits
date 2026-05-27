import "../types.tsp";

namespace CommonBenefits.Fields;

/** A single cross-system identifier entry. Captures the registry (the system
 * that issued the ID), the value within that registry, and an optional
 * description.
 */
@example(Examples.Identifiers.isoEntry)
@Versioning.added(Versions.v0_1)
model IdEntry {
  /** The registry or external system this identifier belongs to (e.g., "iso_3166_2", "co_cbms"). */
  registry: string;

  /** The identifier value within that registry. */
  value: string;

  /** Optional human-readable description of the identifier. */
  description?: string;
}

/** A collection of identifiers for a model. Includes the system-assigned
 * identifier (`systemId`) plus an open map of cross-system identifiers
 * (`otherIds`) keyed by a caller-defined label.
 *
 * Model-specific named canonical identifiers (e.g., `ssn` on Person) are
 * added by extending this model in the relevant model file.
 */
@example(Examples.Identifiers.programIdentifiers)
@Versioning.added(Versions.v0_1)
model Identifiers {
  /** The system-assigned identifier. */
  systemId: Types.uuid;

  /** Cross-system identifiers keyed by a caller-defined label. */
  otherIds?: Record<IdEntry>;
}

namespace Examples.Identifiers {
  const isoEntry = #{
    registry: "iso_3166_2",
    value: "US-CO",
    description: "ISO 3166-2 subdivision code",
  };

  const programIdentifiers = #{
    systemId: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
    otherIds: #{
      benefits_gov: #{
        registry: "benefits_gov",
        value: "SNAP-CO",
        description: "Benefits.gov program identifier",
      },
    },
  };
}
