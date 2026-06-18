import { describe, expect, it } from "vitest";
import { z } from "zod";
import { WidgetBaseSchema } from "../../src/schemas/widget";
import { withCustomFields } from "../../src/extensions/schemas";

describe("withCustomFields", () => {
  it("returns a schema that parses custom fields with their typed value", () => {
    const Schema = withCustomFields(WidgetBaseSchema, {
      legacyId: {
        fieldType: "object",
        value: z.object({ system: z.string(), id: z.number() }),
      },
      category: {
        fieldType: "string",
      },
    } as const);

    const parsed = Schema.parse({
      id: "123e4567-e89b-42d3-a456-426614174000",
      name: "Widget A",
      color: "red",
      weight: 5,
      customFields: {
        legacyId: {
          name: "legacyId",
          fieldType: "object",
          value: { system: "old", id: 42 },
        },
        category: {
          name: "category",
          fieldType: "string",
          value: "tools",
        },
      },
    });

    expect(parsed.customFields?.legacyId?.value).toEqual({ system: "old", id: 42 });
    expect(parsed.customFields?.category?.value).toBe("tools");
  });

  it("fills in default name from the record key", () => {
    const Schema = withCustomFields(WidgetBaseSchema, {
      category: { fieldType: "string" },
    } as const);

    const parsed = Schema.parse({
      id: "123e4567-e89b-42d3-a456-426614174000",
      name: "W",
      color: "red",
      weight: 1,
      customFields: {
        category: {
          fieldType: "string",
          value: "tools",
        },
      },
    });
    expect(parsed.customFields?.category?.name).toBe("category");
  });

  it("rejects a typed custom field with mismatched value type", () => {
    const Schema = withCustomFields(WidgetBaseSchema, {
      legacyId: { fieldType: "integer" },
    } as const);

    expect(() =>
      Schema.parse({
        id: "123e4567-e89b-42d3-a456-426614174000",
        name: "W",
        color: "red",
        weight: 1,
        customFields: {
          legacyId: { name: "legacyId", fieldType: "integer", value: "not-a-number" },
        },
      })
    ).toThrow();
  });
});
