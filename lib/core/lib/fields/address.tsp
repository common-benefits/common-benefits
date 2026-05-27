import "../types.tsp";

namespace CommonBenefits.Fields;

/** The time period during which a household or person occupied an address.
 *
 * `endDate` is `null` (or omitted) for currently-occupied addresses;
 * `isCurrent` is the authoritative signal regardless of date values.
 */
@example(Examples.Address.currentPeriod)
@example(Examples.Address.previousPeriod)
@Versioning.added(Versions.v0_1)
model AddressPeriod {
  /** The date the address was first occupied, in ISO 8601 (YYYY-MM-DD). */
  startDate: Types.isoDate;

  /** The date the address was vacated. `null` if currently occupied. */
  endDate?: Types.isoDate | null;

  /** `true` if this is the current address. */
  isCurrent: boolean;
}

/** A mailing address. */
@example(Examples.Address.apartment)
@Versioning.added(Versions.v0_1)
model Address {
  /** The primary street address line. */
  street1: string;

  /** Additional street address information (e.g., apartment number, suite, etc.). */
  street2?: string;

  /** The city or municipality name. */
  city: string;

  /** The state, province, or region name. */
  stateOrProvince: string;

  /** The country name or ISO country code. */
  country: string;

  /** The postal or ZIP code for the address. */
  postalCode: string;

  /** The latitude coordinate of the address location. */
  latitude?: numeric;

  /** The longitude coordinate of the address location. */
  longitude?: numeric;

  /** Additional geospatial data in GeoJSON format. */
  geography?: Record<unknown>;

  /** The time period during which the address was occupied. */
  period?: AddressPeriod;
}

/** A collection of addresses with named slots for residential and mailing
 * addresses plus an open map of additional addresses keyed by a
 * caller-defined label (e.g., "previous", "work", "satellite").
 */
@example(Examples.Address.personalCollection)
@example(Examples.Address.orgCollection)
@Versioning.added(Versions.v0_1)
model AddressCollection {
  /** The primary residential address. */
  residential: Address;

  /** The mailing address, if different from the residential address. */
  mailing?: Address;

  /** Additional addresses keyed by a caller-defined label (e.g., "previous", "work"). */
  otherAddresses?: Record<Address>;
}

namespace Examples.Address {
  const currentPeriod = #{
    startDate: Types.isoDate.fromISO("2023-06-01"),
    endDate: null,
    isCurrent: true,
  };

  const previousPeriod = #{
    startDate: Types.isoDate.fromISO("2020-01-01"),
    endDate: Types.isoDate.fromISO("2023-05-31"),
    isCurrent: false,
  };

  const apartment = #{
    street1: "123 Main St",
    city: "Anytown",
    stateOrProvince: "CA",
    country: "US",
    postalCode: "12345",
  };

  const residential = #{
    street1: "123 Main St",
    city: "Denver",
    stateOrProvince: "CO",
    country: "US",
    postalCode: "80201",
    period: currentPeriod,
  };

  const previousAddress = #{
    street1: "456 Oak Ave",
    city: "Aurora",
    stateOrProvince: "CO",
    country: "US",
    postalCode: "80010",
    period: previousPeriod,
  };

  const orgAddress = #{
    street1: "456 Main St",
    street2: "Suite 100",
    city: "Anytown",
    stateOrProvince: "CA",
    country: "US",
    postalCode: "12345",
  };

  const international = #{
    street1: "123 Rue Principale",
    city: "Montreal",
    stateOrProvince: "QC",
    country: "CA",
    postalCode: "H2Y 1C6",
  };

  const personalCollection = #{
    residential: residential,
    otherAddresses: #{ previous: previousAddress },
  };

  const orgCollection = #{
    residential: orgAddress,
    mailing: orgAddress,
    otherAddresses: #{ satellite: orgAddress, international: international },
  };
}
