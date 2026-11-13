// The multiples of the day, /pronostici/multiple (rules: scripts/lib/multiple.mjs).
//
// Runs in `npm run build` after scripts/archive-predictions.mjs. The first build of each Rome day locks that day's
// multiples in the predictions archive (<archive>/multiple.json, kept in the `archivio-pronostici` branch with the
// rest): from then on the site shows those picks with the probabilities they had when locked, graded with the results
// as they come in. Locked multiples are never changed or deleted.
//
// Writes:
//   <archive>/multiple.json   { "<id>/<day>": lock }
//   src/data/multiple.json    every multiple with the result of each pick, newest first, and the totals per kind
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";
import { MULTIPLE, MULTIPLE_IDS, chooseMultiples, lockKey, pickTest, romeDayOf } from "./lib/multiple.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archiveDir = path.resolve(root, process.env.PREDICTION_ARCHIVE_DIR ?? ".cache/predictions-archive");
const readJson = (f, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return fallback;
  }
};

let nowMs;
try {
  nowMs = Date.parse(fs.readFileSync(path.join(root, BUILD_TIME_FILE), "utf8").trim());
} catch {
  nowMs = Date.now();
}
if (!Number.isFinite(nowMs)) nowMs = Date.now();

const calcioDir = path.join(archiveDir, "calcio");
const entries = fs.existsSync(calcioDir)
  ? fs
      .readdirSync(calcioDir)
      .filter((n) => n.endsWith(".json"))
      .flatMap((n) => Object.values(readJson(path.join(calcioDir, n), {})))
  : [];
const byId = new Map(entries.map((e) => [e.id, e]));
const football = readJson(path.join(root, "src/data/football.json"), { competitions: [] });
const currentIds = new Set(football.competitions.flatMap((c) => c.matches.map((m) => m.id)));

// ---------------------------------------------------------------------------------------------- lock today's multiples
const lockFile = path.join(archiveDir, "multiple.json");
const locks = readJson(lockFile, {});
const today = romeDayOf(nowMs);
const added = [];
// without the archive there is nothing to choose from (local build without .cache): do not write it
if (entries.length && !MULTIPLE_IDS.some((id) => locks[lockKey(id, today)])) {
  const chosen = chooseMultiples(entries, { nowMs, currentIds });
  for (const [id, lock] of Object.entries(chosen)) {
    locks[lockKey(id, today)] = lock;
    added.push(`${MULTIPLE[id].short} (${lock.picks.length} esiti, ${(lock.all * 100).toFixed(1)}%)`);
  }
  // the day is decided once, even when no multiple was possible (no matches): later builds of the day do not add one
  locks[`_giorno/${today}`] = { day: today, locked: new Date(nowMs).toISOString(), n: added.length };
  // one multiple per line, oldest first: every commit diff shows the multiples just locked
  const lines = Object.entries(locks)
    .sort(([a], [b]) => a.split("/")[1].localeCompare(b.split("/")[1]) || a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`);
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(lockFile, `{\n${lines.join(",\n")}\n}\n`);
}

// ---------------------------------------------------------------------------------------------- site data
const multiple = Object.values(locks)
  .filter((l) => MULTIPLE[l.id])
  .map((l) => {
    const picks = l.picks.map((p) => {
      const e = byId.get(p.id);
      const r = e?.result;
      return {
        ...p,
        // a rescheduled match follows its new date
        kickoff: e?.kickoff ?? p.kickoff,
        path: e?.path ?? p.path,
        result: r ? `${r.home}-${r.away}` : null,
        hit: r ? pickTest(p.key, r.home, r.away) : null,
        void: !r && !!e?.void,
      };
    });
    const graded = picks.filter((p) => p.hit !== null);
    const started = picks.some((p) => Date.parse(p.kickoff) <= nowMs);
    const done = picks.every((p) => p.hit !== null || p.void);
    const lost = graded.some((p) => !p.hit);
    return {
      id: l.id,
      slug: MULTIPLE[l.id].slug,
      title: MULTIPLE[l.id].title,
      day: l.day,
      locked: l.locked,
      all: l.all,
      picks,
      hits: graded.filter((p) => p.hit).length,
      // lost as soon as one pick is wrong; won when every played pick came in (postponed matches left out)
      outcome: lost ? "persa" : done && graded.length ? "vinta" : null,
      status: done ? "concluso" : started ? "in-corso" : "in-attesa",
    };
  })
  .sort((a, b) => b.day.localeCompare(a.day) || MULTIPLE_IDS.indexOf(a.id) - MULTIPLE_IDS.indexOf(b.id));

// totals per kind, on the multiples that are settled: how often they came in against the model's expectation
const stats = Object.fromEntries(
  MULTIPLE_IDS.map((id) => {
    const settled = multiple.filter((m) => m.id === id && m.outcome);
    return [
      id,
      {
        n: settled.length,
        won: settled.filter((m) => m.outcome === "vinta").length,
        expected: Math.round(settled.reduce((s, m) => s + m.all, 0) * 10) / 10,
      },
    ];
  }),
);

fs.writeFileSync(
  path.join(root, "src/data/multiple.json"),
  JSON.stringify({ generatedAt: new Date(nowMs).toISOString(), multiple: multiple.slice(0, 160), stats }) + "\n",
);
console.log(
  `Multiple: ${multiple.length} in archivio${added.length ? `, bloccate oggi: ${added.join("; ")}` : ""}; ` +
    MULTIPLE_IDS.map((id) => `${MULTIPLE[id].short} ${stats[id].won}/${stats[id].n}`).join(", "),
);
