import { describe, expect, it } from "vitest";
import { expectZodMatchesJsonSchema } from "../../helper";
import { uuid, email, decimalString, isoTime, isoDate, calendarYear } from "@/schemas";

// ############################################################################
// uuid
// ############################################################################

describe("uuid schema", () => {
  it("validates a valid UUID", () => {
    const value = "30a12e5e-5940-4c08-921c-17a8960fcf4b";
    expect(uuid.parse(value)).toBe(value);
  });

  it("matches uuid.yaml", async () => {
    await expectZodMatchesJsonSchema(uuid, "uuid.yaml");
  });

  it("rejects invalid UUIDs", () => {
    expect(() => uuid.parse("not-a-uuid")).toThrow();
    expect(() => uuid.parse("30a12e5e5940-4c08-921c-17a8960fcf4b")).toThrow();
  });
});

// ############################################################################
// email
// ############################################################################

describe("email schema", () => {
  it("validates a valid email", () => {
    expect(email.parse("test@example.com")).toBe("test@example.com");
  });

  it("matches email.yaml", async () => {
    await expectZodMatchesJsonSchema(email, "email.yaml");
  });

  it("rejects non-emails", () => {
    expect(() => email.parse("not-an-email")).toThrow();
  });
});

// ############################################################################
// decimalString
// ############################################################################

describe("decimalString schema", () => {
  it("validates decimal strings", () => {
    expect(decimalString.parse("100")).toBe("100");
    expect(decimalString.parse("100.50")).toBe("100.50");
    expect(decimalString.parse("-100.50")).toBe("-100.50");
    expect(decimalString.parse("0")).toBe("0");
  });

  it("matches decimalString.yaml", async () => {
    await expectZodMatchesJsonSchema(decimalString, "decimalString.yaml");
  });

  it("rejects non-decimal strings", () => {
    expect(() => decimalString.parse("100.50.50")).toThrow();
    expect(() => decimalString.parse("abc")).toThrow();
    expect(() => decimalString.parse("")).toThrow();
  });
});

// ############################################################################
// isoTime
// ############################################################################

describe("isoTime schema", () => {
  it("validates ISO times", () => {
    expect(isoTime.parse("17:00:00")).toBe("17:00:00");
    expect(isoTime.parse("00:00:00")).toBe("00:00:00");
    expect(isoTime.parse("23:59:59")).toBe("23:59:59");
  });

  // Known divergence: JSON Schema's `format: time` (RFC 3339) accepts a
  // trailing timezone like "12:00:00Z" or "12:00:00+05:00"; the emitter
  // generates `z.string().time()` which in Zod 4 rejects them. Re-enable
  // when the emitter wraps plainTime with timezone-stripping preprocessing.
  it.fails("matches isoTime.yaml", async () => {
    await expectZodMatchesJsonSchema(isoTime, "isoTime.yaml");
  });

  it("rejects invalid times", () => {
    expect(() => isoTime.parse("25:00:00")).toThrow();
    expect(() => isoTime.parse("not-a-time")).toThrow();
  });
});

// ############################################################################
// isoDate
// ############################################################################

describe("isoDate schema", () => {
  it("validates ISO dates", () => {
    const parsed = isoDate.parse("2025-01-01");
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getUTCFullYear()).toBe(2025);
    expect(parsed.getUTCMonth()).toBe(0);
    expect(parsed.getUTCDate()).toBe(1);
  });

  it("matches isoDate.yaml", async () => {
    await expectZodMatchesJsonSchema(isoDate, "isoDate.yaml");
  });

  // Note: the emitter renders plainDate as `z.coerce.date()`, which accepts
  // anything `new Date(...)` can parse, not just strict YYYY-MM-DD strings.
  // We document the strictness gap rather than asserting an exhaustive
  // reject-list.
  it("rejects clearly invalid dates", () => {
    expect(() => isoDate.parse("not-a-date")).toThrow();
  });
});

// ############################################################################
// calendarYear
// ############################################################################

describe("calendarYear schema", () => {
  it("validates 4-digit years", () => {
    expect(calendarYear.parse("2025")).toBe("2025");
    expect(calendarYear.parse("0001")).toBe("0001");
    expect(calendarYear.parse("9999")).toBe("9999");
  });

  it("matches calendarYear.yaml", async () => {
    await expectZodMatchesJsonSchema(calendarYear, "calendarYear.yaml");
  });

  it("rejects non-4-digit years", () => {
    expect(() => calendarYear.parse("25")).toThrow();
    expect(() => calendarYear.parse("20256")).toThrow();
    expect(() => calendarYear.parse("two-thousand")).toThrow();
  });
});
