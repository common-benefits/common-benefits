import "../fields/index.tsp";
import "../types.tsp";

namespace CommonBenefits.Models;

// #########################################################
// JurisdictionLevelOptions
// #########################################################

/** Predefined set of jurisdiction levels.
 *
 * - `country`: A nation-state.
 * - `state`: A first-level subdivision of a country (e.g., U.S. state, Canadian province).
 * - `county`: A second-level subdivision (e.g., U.S. county).
 * - `municipal`: A city, town, or other municipality.
 * - `tribal`: A tribal nation or tribal area.
 * - `custom`: A caller-defined jurisdiction level.
 */
@Versioning.added(Versions.v0_1)
enum JurisdictionLevelOptions {
  country,
  state,
  county,
  municipal,
  tribal,
  custom,
}

/** The level of a jurisdiction, modeled as an extensible enum so
 * implementations can supply custom levels via the `description` field.
 */
@Versioning.added(Versions.v0_1)
model JurisdictionLevel is Fields.ExtensibleEnumT<JurisdictionLevelOptions>;

// #########################################################
// JurisdictionRef
// #########################################################

/** A denormalized reference to a jurisdiction. Carries enough information
 * to display without a separate lookup. Used for parent references and
 * embedded jurisdiction references on other models.
 */
@Versioning.added(Versions.v0_1)
model JurisdictionRef {
  /** The jurisdiction's unique identifier. */
  id: Types.uuid;

  /** Human-readable display name. */
  name: string;
}

// #########################################################
// JurisdictionBase
// #########################################################

/** A geographic or administrative unit within which a program operates.
 *
 * Multiple standards (ISO 3166-2, U.S. Census FIPS, U.S. Census GEOID) may
 * be valid identifiers for the same jurisdiction; `identifiers.otherIds`
 * carries those cross-system codes.
 */
@example(Examples.Jurisdiction.colorado)
@Versioning.added(Versions.v0_1)
model JurisdictionBase {
  /** The jurisdiction's unique identifier. */
  id: Types.uuid;

  /** Human-readable display name. */
  name: string;

  /** The level of this jurisdiction (country, state, etc.). */
  level: JurisdictionLevel;

  /** System and cross-system identifiers for this jurisdiction. */
  identifiers: Fields.Identifiers;

  /** The parent jurisdiction, if any. Null for country-level jurisdictions. */
  parent?: JurisdictionRef;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.Jurisdiction {
  const colorado = #{
    id: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
    name: "Colorado",
    level: #{ value: JurisdictionLevelOptions.state, description: "" },
    identifiers: #{
      systemId: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
      otherIds: #{
        iso_3166_2: #{
          registry: "iso_3166_2",
          value: "US-CO",
          description: "ISO 3166-2 subdivision code",
        },
        us_census_fips: #{
          registry: "us_census_fips",
          value: "08",
          description: "U.S. Census 2-digit state FIPS code",
        },
      },
    },
    parent: #{ id: "40a12e5e-5940-4c08-921c-17a8960fcf4b", name: "United States" },
  };
}
