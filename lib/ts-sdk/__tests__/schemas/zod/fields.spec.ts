import { describe, expect, it } from "vitest";
import { expectZodMatchesJsonSchema } from "../../helper";
import {
  address,
  addressCollection,
  customField,
  customFieldType,
  emailCollection,
  money,
  name as nameSchema,
  phone,
  phoneCollection,
} from "@/schemas";

// ############################################################################
// Address
// ############################################################################

describe("address schema", () => {
  it("validates a complete Address", () => {
    expect(() =>
      address.parse({
        street1: "123 Main St",
        city: "Anytown",
        stateOrProvince: "CA",
        country: "US",
        postalCode: "12345",
      })
    ).not.toThrow();
  });

  it("matches Address.yaml", async () => {
    await expectZodMatchesJsonSchema(address, "Address.yaml");
  });
});

// ############################################################################
// AddressCollection
// ############################################################################

describe("addressCollection schema", () => {
  it("matches AddressCollection.yaml", async () => {
    await expectZodMatchesJsonSchema(addressCollection, "AddressCollection.yaml");
  });
});

// ############################################################################
// CustomField + CustomFieldType (extensible enum)
// ############################################################################

describe("customFieldType schema", () => {
  it("accepts all six CustomFieldType values", () => {
    for (const value of ["string", "number", "integer", "boolean", "object", "array"]) {
      expect(customFieldType.parse(value)).toBe(value);
    }
  });

  it("matches CustomFieldType.yaml", async () => {
    await expectZodMatchesJsonSchema(customFieldType, "CustomFieldType.yaml");
  });

  it("rejects unknown values", () => {
    expect(() => customFieldType.parse("decimal")).toThrow();
  });
});

describe("customField schema", () => {
  it("validates a minimal CustomField", () => {
    expect(() =>
      customField.parse({
        name: "agency",
        fieldType: "string",
        value: "Department of Health and Human Services",
      })
    ).not.toThrow();
  });

  it("matches CustomField.yaml", async () => {
    await expectZodMatchesJsonSchema(customField, "CustomField.yaml");
  });
});

// ############################################################################
// EmailCollection
// ############################################################################

describe("emailCollection schema", () => {
  it("validates a collection with a primary email", () => {
    expect(() => emailCollection.parse({ primary: "primary@example.com" })).not.toThrow();
  });

  it("matches EmailCollection.yaml", async () => {
    await expectZodMatchesJsonSchema(emailCollection, "EmailCollection.yaml");
  });
});

// ############################################################################
// Money
// ############################################################################

describe("money schema", () => {
  it("validates a Money value", () => {
    expect(() =>
      money.parse({
        amount: "100.50",
        currency: "USD",
      })
    ).not.toThrow();
  });

  it("matches Money.yaml", async () => {
    await expectZodMatchesJsonSchema(money, "Money.yaml");
  });

  it("rejects non-decimal amount strings", () => {
    expect(() => money.parse({ amount: "abc", currency: "USD" })).toThrow();
  });
});

// ############################################################################
// Name
// ############################################################################

describe("name schema", () => {
  it("validates a Name value", () => {
    expect(() =>
      nameSchema.parse({
        firstName: "Ada",
        lastName: "Lovelace",
      })
    ).not.toThrow();
  });

  it("matches Name.yaml", async () => {
    await expectZodMatchesJsonSchema(nameSchema, "Name.yaml");
  });
});

// ############################################################################
// Phone + PhoneCollection
// ############################################################################

describe("phone schema", () => {
  it("matches Phone.yaml", async () => {
    await expectZodMatchesJsonSchema(phone, "Phone.yaml");
  });
});

describe("phoneCollection schema", () => {
  it("matches PhoneCollection.yaml", async () => {
    await expectZodMatchesJsonSchema(phoneCollection, "PhoneCollection.yaml");
  });
});
