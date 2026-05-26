/** Extract a single named declaration (model/enum/union/interface/scalar/alias)
 * from a TypeSpec source file, along with any preceding JSDoc and decorators.
 *
 * Works on the conventional TypeSpec layout used in this repo: implicit
 * namespace at the top (`namespace X;`), declarations at column 0, block
 * declarations closing with `}` at column 0, separated by blank lines.
 *
 * Returns `null` if the name isn't found at the top level of the file.
 */
export function extractTypeSpecDeclaration(source: string, name: string): string | null {
  const lines = source.split("\n");
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const declRegex = new RegExp(`^(model|enum|union|interface|scalar|alias)\\s+${escaped}\\b`);

  let startLine = -1;
  let declKind = "";
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(declRegex);
    if (match) {
      startLine = i;
      declKind = match[1];
      break;
    }
  }
  if (startLine < 0) return null;

  // Walk backwards to include any contiguous non-empty preceding lines
  // (decorators, JSDoc, multi-line decorators).
  let prefixStart = startLine;
  for (let i = startLine - 1; i >= 0; i--) {
    if (lines[i].trim() === "") break;
    prefixStart = i;
  }

  // Find end of declaration.
  let endLine = startLine;
  if (declKind === "scalar" || declKind === "alias") {
    for (let i = startLine; i < lines.length; i++) {
      if (lines[i].trimEnd().endsWith(";")) {
        endLine = i;
        break;
      }
    }
  } else if (lines[startLine].trimEnd().endsWith("}")) {
    // Single-line declaration like `model X extends Y<T> {}`.
    endLine = startLine;
  } else {
    for (let i = startLine + 1; i < lines.length; i++) {
      if (lines[i] === "}") {
        endLine = i;
        break;
      }
    }
  }

  return lines.slice(prefixStart, endLine + 1).join("\n");
}
