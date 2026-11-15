// Local imports between the repository's own files (relative paths: "./x.mjs", "../src/lib/y.ts"), read from the
// source text without running anything. Used by scripts/check-script-imports.mjs (pull request check) and
// scripts/deploy-mode.mjs (quick or full refresh after a push to main).
//
// Only static strings count: `import … from "…"`, `export … from "…"`, `import "…"` and `import("…")`.
// Package imports ("node:fs", "react") and imports built at run time are ignored.
import fs from "node:fs";
import path from "node:path";

const CODE = /\.(mjs|cjs|js|jsx|ts|tsx|mts)$/;
const SPECIFIERS = [
  /\bimport\s+(?:type\s+)?[\w*{}\s,$]*?\s*from\s*["']([^"']+)["']/g,
  /\bexport\s+(?:type\s+)?[\w*{}\s,$]*?\s*from\s*["']([^"']+)["']/g,
  /\bimport\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
];

export const isCode = (file) => CODE.test(file);

/** Relative specifiers of a source file (without comments), in order of appearance, without duplicates. */
export function localSpecifiers(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
  const found = new Set();
  for (const re of SPECIFIERS) for (const m of text.matchAll(re)) if (/^\.\.?\//.test(m[1])) found.add(m[1]);
  return [...found];
}

/**
 * File an import points to, relative to `root` (posix separators), or null if it does not exist.
 * `strict`: Node's rule for relative ESM imports (the exact file, extension included), for scripts run by `node`;
 * otherwise also the bundler's guesses (".ts", ".tsx", "/index.ts"…), for files bundled by Vite.
 */
export function resolveImport(
  root,
  fromFile,
  specifier,
  { strict = false, exists = (f) => fs.existsSync(path.join(root, f)) } = {},
) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier.replace(/[?#].*$/, "")));
  const candidates = strict
    ? [base]
    : [
        base,
        ...[".ts", ".tsx", ".mjs", ".js", ".jsx"].map((e) => base + e),
        ...["ts", "tsx", "js"].map((e) => `${base}/index.${e}`),
      ];
  for (const c of candidates) if (exists(c) && !fs.statSync(path.join(root, c)).isDirectory()) return c;
  return null;
}

/**
 * Every repository file reached from `entries` through local imports (entries included), relative to `root`.
 * `missing` lists the imports that point to no file: [{ from, specifier }].
 */
export function importClosure(root, entries, { strict = false } = {}) {
  const files = new Set();
  const missing = [];
  const queue = [...entries];
  while (queue.length) {
    const file = queue.shift();
    if (files.has(file)) continue;
    files.add(file);
    if (!isCode(file)) continue;
    let source;
    try {
      source = fs.readFileSync(path.join(root, file), "utf8");
    } catch {
      continue;
    }
    for (const spec of localSpecifiers(source)) {
      const target = resolveImport(root, file, spec, { strict });
      if (target) queue.push(target);
      else missing.push({ from: file, specifier: spec });
    }
  }
  return { files, missing };
}
