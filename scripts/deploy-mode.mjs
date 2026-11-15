// Full or quick refresh for a push to main (.github/workflows/deploy.yml).
//
// Full: downloads everything from the APIs (football, NBA, tennis, details, highlights, archive, player extras,
// Claude rewrites) and then builds. Quick: the build starts from the data of the last refresh kept in the workflow
// cache (.cache/match-details/snapshot.tgz, the same data live-scores.yml updates every 15 minutes), so a merge that
// changes only the site's code is online in a few minutes without calling the APIs. The full refresh still runs every
// 3 hours, so the data are never older than that.
//
// A push gets the full refresh if any changed file
//   - is one of the data files kept in the snapshot (the download steps write them),
//   - is a download script or a file it imports (scripts/lib/…, src/lib/editorial/…), or
//   - is the workflow, the data branch script, the installed packages (package-lock.json) or this file.
// Everything else (pages, components, styles, models, derive scripts, the build) → quick.
//
// Usage: git diff --name-only A B | node scripts/deploy-mode.mjs
// Prints the decision; with GITHUB_OUTPUT set also writes `rapido=true|false` and `motivo=…` for the workflow.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importClosure } from "./lib/local-imports.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The scripts of the download steps of deploy.yml skipped by the quick refresh (keep in step with the workflow).
export const DOWNLOAD_SCRIPTS = [
  "scripts/fetch-football.mjs",
  "scripts/fetch-basket-data.mjs",
  "scripts/fetch-tennis-data.mjs",
  "scripts/fetch-match-details.mjs",
  "scripts/fetch-highlights.mjs",
  "scripts/backfill-archive.mjs",
  "scripts/fetch-player-extras.mjs",
  "scripts/archive-data.mjs",
  "scripts/generate-editorial.mjs",
];

// Contents of snapshot.tgz (step "Keep the downloaded data for the quick live-score runs" of deploy.yml).
const SNAPSHOT = [
  /^src\/data\/(football|basket|tennis|football-details|basket-details|highlights|editorial-ai)\.json$/,
  /^data\//,
  /^public\/stato-dati\.json$/,
  /^public\/loghi\//,
];

const SETUP = [
  ".github/workflows/deploy.yml",
  "scripts/data-branch.sh",
  "scripts/deploy-mode.mjs",
  // a new or updated package changes the lock file; package.json alone (e.g. the "build" script) does not
  "package-lock.json",
  ".nvmrc",
];

/** { quick, reason } for the list of changed files (repository paths). */
export function decide(changed) {
  if (!changed.length) return { quick: false, reason: "elenco dei file cambiati non disponibile" };
  const setup = changed.find((f) => SETUP.includes(f));
  if (setup) return { quick: false, reason: `cambiato ${setup}` };
  const data = changed.find((f) => SNAPSHOT.some((re) => re.test(f)));
  if (data) return { quick: false, reason: `cambiato un file di dati (${data})` };
  const { files } = importClosure(root, DOWNLOAD_SCRIPTS);
  files.add("scripts/lib/local-imports.mjs");
  const dl = changed.find((f) => files.has(f));
  if (dl) return { quick: false, reason: `cambiato ${dl}, usato dagli script di download` };
  return { quick: true, reason: `${changed.length} file cambiati, nessuno riguarda il download dei dati` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const changed = fs
    .readFileSync(0, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const { quick, reason } = decide(changed);
  console.log(`${quick ? "Aggiornamento rapido" : "Aggiornamento completo"}: ${reason}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `rapido=${quick}\nmotivo=${reason}\n`);
}
