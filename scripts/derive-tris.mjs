// The threes ("tris") of the site, /pronostici/tris (rules: scripts/lib/tris.mjs).
//
// Runs in `npm run build` after scripts/archive-predictions.mjs. On the day a three is due, the first build locks it in
// the predictions archive (<archive>/tris.json, kept in the `archivio-pronostici` branch with the rest): from then on
// the site and the Telegram channel show those three matches, with the probabilities they had when it was locked, and
// the three is graded with the results as they come in. Locked threes are never changed or deleted.
//
// Writes:
//   <archive>/tris.json   { "<id>/<day>": lock }  (lock: scripts/lib/tris.mjs lockOf)
//   src/data/tris.json    every three with the result of each match, newest first, and the totals
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_TIME_FILE } from "../src/lib/eventTiming.mjs";
import { TRIS, TRIS_IDS, chooseTris, lockKey, romeDayOf } from "./lib/tris.mjs";

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

// ---------------------------------------------------------------------------------------------- lock today's threes
const lockFile = path.join(archiveDir, "tris.json");
const locks = readJson(lockFile, {});
const today = romeDayOf(nowMs);
const added = [];
// without the archive there is nothing to choose from (local build without .cache): do not write it
if (entries.length) {
  for (const id of TRIS_IDS) {
    if (locks[lockKey(id, today)]) continue;
    const lock = chooseTris(id, entries, { nowMs, currentIds });
    if (!lock) continue;
    locks[lockKey(id, today)] = lock;
    added.push(`${TRIS[id].title} (${lock.picks.map((p) => p.label).join(", ")})`);
  }
  if (added.length) {
    // one three per line, oldest first: every commit diff shows the three just locked
    const lines = Object.entries(locks)
      .sort(([a], [b]) => a.split("/")[1].localeCompare(b.split("/")[1]) || a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`);
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(lockFile, `{\n${lines.join(",\n")}\n}\n`);
  }
}

// ---------------------------------------------------------------------------------------------- site data
const tris = Object.values(locks)
  .filter((l) => TRIS[l.id])
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
        hit: r ? r.index === p.index : null,
        void: !r && !!e?.void,
      };
    });
    const graded = picks.filter((p) => p.hit !== null);
    const started = picks.some((p) => Date.parse(p.kickoff) <= nowMs);
    const done = picks.every((p) => p.hit !== null || p.void);
    return {
      id: l.id,
      slug: TRIS[l.id].slug,
      title: TRIS[l.id].title,
      day: l.day,
      locked: l.locked,
      all: l.all,
      picks,
      hits: graded.filter((p) => p.hit).length,
      status: done ? "concluso" : started ? "in-corso" : "in-attesa",
    };
  })
  .sort((a, b) => b.day.localeCompare(a.day) || TRIS_IDS.indexOf(a.id) - TRIS_IDS.indexOf(b.id));

// totals of the threes with all three matches played: how often all three came in, against the model's expectation
const complete = tris.filter((t) => t.status === "concluso" && t.picks.every((p) => p.hit !== null));
const stats = {
  n: complete.length,
  allThree: complete.filter((t) => t.hits === 3).length,
  expected: complete.reduce((s, t) => s + t.all, 0),
  picks: complete.length * 3,
  pickHits: complete.reduce((s, t) => s + t.hits, 0),
};

fs.writeFileSync(
  path.join(root, "src/data/tris.json"),
  JSON.stringify({ generatedAt: new Date(nowMs).toISOString(), tris: tris.slice(0, 120), stats }) + "\n",
);
console.log(
  `Tris: ${tris.length} in archivio${added.length ? `, bloccati oggi: ${added.join("; ")}` : ""}; conclusi ${stats.n}, tutti e tre azzeccati ${stats.allThree}`,
);
