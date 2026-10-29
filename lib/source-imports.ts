import path from "node:path";

export type SourceImport = { value: string; start: number; end: number };
type Token = { kind: "word" | "string" | "symbol"; value: string; start: number; end: number };

/** Small lexical reader: comments and non-import strings never become dependencies. */
function tokens(source: string): Token[] {
  const result: Token[] = [];
  for (let index = 0; index < source.length;) {
    const start = index, character = source[index];
    if (/\s/.test(character)) { index++; continue; }
    if (source.startsWith("//", index)) { const end = source.indexOf("\n", index + 2); index = end < 0 ? source.length : end + 1; continue; }
    if (source.startsWith("/*", index)) { const end = source.indexOf("*/", index + 2); index = end < 0 ? source.length : end + 2; continue; }
    if (character === "`") {
      // Template strings are not literal module specifiers. Their text may include source examples.
      for (index++; index < source.length; index++) { if (source[index] === "\\") index++; else if (source[index] === "`") { index++; break; } }
      continue;
    }
    if (character === '"' || character === "'") {
      for (index++; index < source.length; index++) { if (source[index] === "\\") index++; else if (source[index] === character) { index++; break; } }
      result.push({ kind: "string", value: source.slice(start + 1, index - 1), start, end: index }); continue;
    }
    if (/[A-Za-z_$]/.test(character)) {
      for (index++; index < source.length && /[A-Za-z0-9_$-]/.test(source[index]); index++);
      result.push({ kind: "word", value: source.slice(start, index), start, end: index }); continue;
    }
    result.push({ kind: "symbol", value: character, start, end: ++index });
  }
  return result;
}

/** Static imports/re-exports, literal import()/require(), and CSS @import references. */
export function sourceImports(source: string, filename: string): SourceImport[] {
  const list = tokens(source), references = new Map<number, SourceImport>(), css = filename.endsWith(".css");
  const add = (token: Token | undefined) => { if (token?.kind === "string") references.set(token.start, { value: token.value, start: token.start, end: token.end }); };
  for (let index = 0; index < list.length; index++) {
    const token = list[index], next = list[index + 1];
    if (css) {
      if (token.value !== "@" || next?.value !== "import") continue;
      const target = list[index + 2];
      if (target?.kind === "string") add(target);
      else if (target?.value === "url" && list[index + 3]?.value === "(") {
        const value = list[index + 4];
        if (value?.kind === "string") add(value);
        else {
          const open = list[index + 3].end, close = source.indexOf(")", open), raw = source.slice(open, close).trim();
          if (close > open && raw) { const start = source.indexOf(raw, open); references.set(start, { value: raw, start, end: start + raw.length }); }
        }
      }
      continue;
    }
    if (token.kind !== "word" || !["import", "export", "require"].includes(token.value) || list[index - 1]?.value === ".") continue;
    if ((token.value === "import" || token.value === "require") && next?.value === "(") { add(list[index + 2]); continue; }
    if (token.value === "require") continue;
    if (token.value === "import" && next?.kind === "string") { add(next); continue; }
    if (!next || next.value === "." || next.value === ":" || token.value === "export" && !["type", "*", "{"].includes(next.value)) continue;
    for (let candidate = index + 1; candidate < list.length; candidate++) {
      const current = list[candidate];
      if ([";", "=", "(", ")"].includes(current.value)) break;
      if (current.value === "from" && list[candidate + 1]?.kind === "string") { add(list[candidate + 1]); break; }
    }
  }
  return [...references.values()].sort((a, b) => a.start - b.start);
}

/** Package roots, not string prefixes: react-markdown remains an external dependency. */
export function externalPackage(specifier: string): string | undefined {
  if (specifier.startsWith(".") || specifier.startsWith("@/")) return undefined;
  if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+(?:\/[a-z0-9._/-]+)?$/i.test(specifier)) throw new Error(`Unsupported source import: ${specifier}`);
  const name = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
  return name === "react" || name === "react-dom" ? undefined : name;
}

export function sourceAlias(specifier: string): string | undefined {
  if (!specifier.startsWith("@/")) return undefined;
  if (specifier === "@/components/ui" || specifier.startsWith("@/components/ui/") || specifier === "@/lib/utils" || specifier === "@/lib/utils.ts") return specifier.slice(2);
  throw new Error("Source dependency outside component folders");
}

export function relativeSourceImport(from: string, dependency: string): string {
  const relative = path.posix.relative(path.posix.dirname(from), dependency).replace(/\.(tsx?|jsx?)$/, "");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

export function rewriteSourceImports(source: string, replacements: readonly (SourceImport & { replacement: string })[]): string {
  let result = source;
  for (const item of [...replacements].sort((a, b) => b.start - a.start)) result = result.slice(0, item.start) + JSON.stringify(item.replacement) + result.slice(item.end);
  return result;
}

/** Moving an example must preserve its links to the shared source tree. */
export function relocateSource(source: string, from: string, to: string): string {
  return rewriteSourceImports(source, sourceImports(source, from).filter((item) => item.value.startsWith(".")).map((item) => ({ ...item, replacement: relativeSourceImport(to, path.posix.normalize(path.posix.join(path.posix.dirname(from), item.value))) })));
}
