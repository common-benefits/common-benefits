import "../types.tsp";

namespace CommonBenefits.Fields;

using Types;

/** A monetary amount and the currency in which it's denominated. */
@example(Examples.Money.usdWithCents, #{ title: "US dollars and cents" })
@example(Examples.Money.euroWithoutCents, #{ title: "Euros displayed without cents" })
@example(Examples.Money.usdNegative, #{ title: "A negative amount of US dollars and cents" })
@Versioning.added(Versions.v0_1)
model Money {
  /** The amount of money. */
  amount: decimalString;

  /** The ISO 4217 currency code in which the amount is denominated. */
  currency: string;
}

namespace Examples.Money {
  /** A positive USD amount with cents. */
  const usdWithCents = #{ amount: "10000.50", currency: "USD" };

  /** A positive EUR amount without cents. */
  const euroWithoutCents = #{ amount: "5000", currency: "EUR" };

  /** A negative USD amount in accounting format. */
  const usdNegative = #{ amount: "-50.50", currency: "USD" };
}
