/**
 * Scalar Zod types used by hand-written SDK schemas.
 *
 * Copied from the CommonGrants SDK (lib/ts-sdk/src/schemas/zod/types.ts) so the
 * SDK has its own foundation while we wait for the equivalent types to be emitted
 * from TypeSpec into `src/generated/`.
 */

import { z } from "zod";

export const UuidSchema = z.string().uuid();

export const DecimalStringSchema = z
  .string()
  .regex(/^-?[0-9]+\.?[0-9]*$/, "Must be a valid decimal number represented as a string");

const ensureUTC = (date: string) => {
  const d = new Date(date);
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds()
    )
  );
};

export const UTCDateTimeSchema = z.string().datetime().transform(ensureUTC);

export const ISODateSchema = z
  .string()
  .date()
  .transform((str) => new Date(str));

export const ISOTimeSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    return val.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
  }
  return val;
}, z.string().time());

export const OffsetDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .transform((str) => new Date(str));
