// Pull request check (.github/workflows/check-pr.yml): the workflows that check out only some files of the repository
// (`sparse-checkout` in .github/workflows/*.yml) must list every file their scripts import.
// On 14 November 2026 src/lib/broadcast.ts started importing src/lib/intl.ts, which was not in the list of telegram.yml:
// the Telegram channel stopped until the list was fixed (PR #127). This check would have stopped the pull request.
//
// For every sparse checkout: the code files in the list (files, or every file under a listed folder) are followed
// through their local imports with Node's rule (exact file, extension included, since these scripts run with `node`).
// Errors: an import that points to no file, or to a file that is not in the list.
// Not checked: files read with fs at run time (data, fonts…), which have no import to follow.
// Also checked: every script under scripts/ (run with `node` in the full checkout) and what it imports must resolve
// with Node's rule, so a TypeScript file imported by a script needs the ".ts" in its own imports too.
//
// Usage: node scripts/check-script-imports.mjs   (exit 1 with the list of problems)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isCode, localSpecifiers, resolveImport } from "./lib/local-imports.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wfDir = path.join(root, ".github", "workflows");

/** Lists of paths under every `sparse-checkout: |` of a workflow, with the job they belong to. */
export function sparseCheckouts(yamlText) {
  const lines = yamlText.split("\n");
  const out = [];
  let job = null;
  let inJobs = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^jobs:\s*$/.test(line)) inJobs = true;
    else if (/^\S/.test(line)) inJobs = false;
    const j = inJobs && line.match(/^  ([\w-]+):\s*$/);
    if (j) job = j[1];
    const m = line.match(/^(\s*)sparse-checkout:\s*\|\s*$/);
    if (!m) continue;
    const paths = [];
    for (let k = i + 1; k < lines.length; k++) {
      const l = lines[k];
      if (!l.trim()) continue;
      if (l.search(/\S/) <= m[1].length) break;
      paths.push(l.trim().replace(/^\//, "").replace(/\/$/, ""));
    }
    out.push({ job, paths });
  }
  return out;
}

const listAll = (rel) => {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  if (!fs.statSync(abs).isDirectory()) return [rel];
  return fs
    .readdirSync(abs, { recursive: true })
    .map((f) => path.posix.join(rel, f.split(path.sep).join("/")))
    .filter((f) => !fs.statSync(path.join(root, f)).isDirectory());
};

export function checkWorkflow(file) {
  const problems = [];
  for (const { job, paths } of sparseCheckouts(fs.readFileSync(file, "utf8"))) {
    const where = `${path.basename(file)} (job ${job})`;
    for (const p of paths)
      if (!fs.existsSync(path.join(root, p)))
        problems.push(`${where}: "${p}" è nell'elenco ma non esiste nel repository`);
    const included = new Set(paths.flatMap(listAll));
    const inList = (f) => included.has(f);
    const seen = new Set();
    const queue = [...included].filter(isCode);
    while (queue.length) {
      const f = queue.shift();
      if (seen.has(f)) continue;
      seen.add(f);
      for (const spec of localSpecifiers(fs.readFileSync(path.join(root, f), "utf8"))) {
        const target = resolveImport(root, f, spec, { strict: true });
        if (!target) {
          const guess = resolveImport(root, f, spec);
          problems.push(
            `${where}: ${f} importa "${spec}", che Node non trova` +
              (guess ? ` (esiste ${guess}: scrivi l'import con l'estensione)` : ""),
          );
        } else if (!inList(target)) {
          problems.push(`${where}: ${f} importa ${target}, che manca dall'elenco del checkout parziale`);
        } else if (isCode(target)) queue.push(target);
      }
    }
  }
  return problems;
}

/** Imports Node cannot resolve in the scripts run with `node` (scripts/**) and in the files they import. */
export function checkNodeScripts() {
  const problems = [];
  const seen = new Set();
  const queue = listAll("scripts").filter((f) => /\.(mjs|js)$/.test(f));
  while (queue.length) {
    const f = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const spec of localSpecifiers(fs.readFileSync(path.join(root, f), "utf8"))) {
      const target = resolveImport(root, f, spec, { strict: true });
      if (target) {
        if (isCode(target)) queue.push(target);
        continue;
      }
      const guess = resolveImport(root, f, spec);
      problems.push(
        `script node: ${f} importa "${spec}", che Node non trova` +
          (guess ? ` (esiste ${guess}: scrivi l'import con l'estensione)` : ""),
      );
    }
  }
  return { problems, files: seen.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = fs
    .readdirSync(wfDir)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => path.join(wfDir, f));
  const node = checkNodeScripts();
  const problems = [...files.flatMap(checkWorkflow), ...node.problems];
  const n = files.reduce((s, f) => s + sparseCheckouts(fs.readFileSync(f, "utf8")).length, 0);
  if (problems.length) {
    for (const p of problems) console.log(`::error::${p}`);
    console.log(`Import: ${problems.length} problemi (${n} checkout parziali, ${node.files} file degli script node)`);
    process.exit(1);
  }
  console.log(`Checkout parziali: ${n} elenchi controllati, tutti gli import sono inclusi`);
  console.log(`Script node: ${node.files} file controllati, tutti gli import si risolvono`);
}
