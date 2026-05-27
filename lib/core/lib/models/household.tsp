import "../fields/index.tsp";
import "../types.tsp";
import "./person.tsp";

namespace CommonBenefits.Models;

// #########################################################
// HouseholdRelationshipType
// #########################################################

/** Predefined set of household relationship types.
 *
 * - `spouse`: Spouse.
 * - `domestic_partner`: Domestic partner.
 * - `parent`: Parent (biological, adoptive, or step).
 * - `child`: Child (biological, adoptive, or step).
 * - `sibling`: Sibling.
 * - `tax_dependent`: Tax dependent.
 * - `cohabitant`: Cohabitant not otherwise related.
 * - `legal_guardian`: Legal guardian.
 * - `foster_parent`: Foster parent.
 * - `foster_child`: Foster child.
 * - `custom`: A caller-defined relationship.
 */
@Versioning.added(Versions.v0_1)
enum HouseholdRelationshipTypeOptions {
  spouse,
  domestic_partner,
  parent,
  child,
  sibling,
  tax_dependent,
  cohabitant,
  legal_guardian,
  foster_parent,
  foster_child,
  custom,
}

/** The type of a relationship between two household members. */
@Versioning.added(Versions.v0_1)
model HouseholdRelationshipType extends Fields.ExtensibleEnumT<HouseholdRelationshipTypeOptions> {}

// #########################################################
// HouseholdRelationship
// #########################################################

/** A directed edge between two members of a household describing how they
 * are related (e.g., parent → child).
 */
@example(Examples.Household.parentChild)
@Versioning.added(Versions.v0_1)
model HouseholdRelationship {
  /** The unique identifier of the source member (`PersonIdentifiers.systemId`). */
  fromMemberId: Types.uuid;

  /** The unique identifier of the target member. */
  toMemberId: Types.uuid;

  /** The type of relationship (from → to). */
  relationshipType: HouseholdRelationshipType;
}

// #########################################################
// HouseholdBase
// #########################################################

/** The persistent eligibility data record for a group of people applying for
 * benefits together. Accumulates over time as the household fills out
 * additional forms.
 */
@example(Examples.Household.singleAdult)
@Versioning.added(Versions.v0_1)
model HouseholdBase {
  /** The household's unique identifier. */
  id: Types.uuid;

  /** The household's residential, mailing, and other addresses. */
  addresses?: Fields.AddressCollection;

  /** The members of the household. At least one member is required. */
  members: PersonBase[];

  /** Relationships between members of the household. */
  relationships?: HouseholdRelationship[];

  /** Implementation-defined custom fields. */
  customFields?: Record<Fields.CustomField>;

  /** Standard system metadata (createdAt, lastModifiedAt). */
  ...Fields.SystemMetadata;
}

// #########################################################
// Examples
// #########################################################

namespace Examples.Household {
  const parentChild = #{
    fromMemberId: "30a12e5e-5940-4c08-921c-17a8960fcf4b",
    toMemberId: "40a12e5e-5940-4c08-921c-17a8960fcf4b",
    relationshipType: #{ value: HouseholdRelationshipTypeOptions.parent, description: "" },
  };

  const singleAdult = #{
    id: "50a12e5e-5940-4c08-921c-17a8960fcf4b",
    members: #[Examples.Person.headOfHousehold],
    createdAt: utcDateTime.fromISO("2026-05-24T10:00:00Z"),
    lastModifiedAt: utcDateTime.fromISO("2026-05-24T10:00:00Z"),
  };
}
