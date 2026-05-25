import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@common-benefits/core",
  diagnostics: {},
} as const);

export const { reportDiagnostic, createDiagnostic } = $lib;
