import * as path from "node:path";

/**
 * Centralized file path configuration for the CommonBenefits website.
 *
 * All paths are absolute so callers never need to call process.cwd() directly.
 *
 * Directory layout (relative to WEBSITE_ROOT unless noted):
 *
 *   public/
 *     schemas/yaml/      (copied from lib/core/tsp-output by the typespec build)
 *     openapi/
 *   src/
 *     content/docs/
 *       protocol/        (hand-written narrative MDX for overview/pagination/sorting)
 *     pages/protocol/    (auto-generated routes from the catalog)
 *
 * REPO_ROOT is the parent of WEBSITE_ROOT — used to resolve TypeSpec source
 * paths declared in the catalog (e.g. "lib/core/lib/fields/address.tsp").
 */
export class Paths {
  /** Absolute path to the website directory (process.cwd() at build time). */
  static readonly WEBSITE_ROOT = process.cwd();
  /** Absolute path to the repo root (parent of the website directory). */
  static readonly REPO_ROOT = path.resolve(Paths.WEBSITE_ROOT, "..");

  static readonly PUBLIC_DIR = path.join(Paths.WEBSITE_ROOT, "public");
  static readonly SCHEMAS_DIR = path.join(Paths.PUBLIC_DIR, "schemas", "yaml");
  static readonly OPENAPI_DIR = path.join(Paths.PUBLIC_DIR, "openapi");

  static readonly CONTENT_DOCS_DIR = path.join(Paths.WEBSITE_ROOT, "src/content/docs");
  static readonly PROTOCOL_DOCS_DIR = path.join(Paths.CONTENT_DOCS_DIR, "protocol");
}
