// Quick update of scores and standings between the full data refreshes (workflow .github/workflows/live-scores.yml,
// every 15 minutes). Starts from the src/data/football.json of the last full run and, only if a match is under way or
// just finished, asks football-data.org for the matches of those days (1 request) and for the standings of the
// competitions where a match has just ended (1 request each). Everything else (calendar, head-to-head, teams,
// API-Sports details, highlights, texts) stays as the last full run left it.
//
// Usage:  FOOTBALL_DATA_TOKEN=<token> node scripts/fetch-live-scores.mjs
// Writes "active" and "changed" (true/false) to $GITHUB_OUTPUT: the workflow rebuilds the site only when changed.
// Note: the football-data.org free plan has no real-time scores (they come with some delay).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// API responses must not be served from the short disk cache of the full download
process.env.FOOTBALL_DATA_CACHE_MINUTES ??= "0";
const { COMPETITIONS, api, compactMatch, compactStanding, loadDotEnv } = await import("./fetch-football-data.mjs");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "football.json");

const BEFORE_MS = 10 * 60e3; // from 10 minutes before kick-off...
const AFTER_MS = 4 * 3600e3; // ...to 4 hours after it, while the match is not final
const FINAL = new Set(["FINISHED", "AWARDED", "CANCELLED", "POSTPONED"]);
const PLAYING = new Set(["IN_PLAY", "PAUSED", "SUSPENDED"]);

function output(values) {
  const line = Object.entries(values)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, line + "\n");
  console.log(line.replace(/\n/g, ", "));
}

/** Matches worth checking now: under way, or around kick-off and not final yet. */
export function liveMatches(competitions, now = Date.now()) {
  return competitions.flatMap((c) =>
    c.matches
      .filter((m) => {
        if (PLAYING.has(m.status)) return true;
        if (FINAL.has(m.status)) return false;
        const t = Date.parse(m.utcDate);
        return now >= t - BEFORE_MS && now <= t + AFTER_MS;
      })
      .map((m) => ({ c, m })),
  );
}

const sameResult = (a, b) =>
  a.status === b.status &&
  JSON.stringify(a.score) === JSON.stringify(b.score) &&
  (a.goals?.length ?? 0) === (b.goals?.length ?? 0) &&
  a.utcDate === b.utcDate;

async function main() {
  loadDotEnv();
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token || !fs.existsSync(OUT)) {
    console.warn("Token o dati di partenza mancanti: nessun aggiornamento.");
    return output({ active: false, changed: false });
  }
  const snap = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const now = Date.now();
  const live = liveMatches(snap.competitions ?? [], now);
  if (!live.length) {
    console.log("Nessuna partita in corso o appena finita.");
    return output({ active: false, changed: false });
  }
  console.log(`Partite da controllare: ${live.length}`);

  const days = live.map(({ m }) => m.utcDate.slice(0, 10)).sort();
  const today = new Date(now).toISOString().slice(0, 10);
  const from = days[0];
  const to = days.at(-1) > today ? days.at(-1) : today;
  const codes = [...new Set(live.map(({ c }) => c.code))].join(",");
  const res = await api(`/matches?competitions=${codes}&dateFrom=${from}&dateTo=${to}`, token);

  const byId = new Map((snap.competitions ?? []).flatMap((c) => c.matches.map((m, i) => [m.id, { c, i }])));
  const ended = new Set();
  let changed = 0;
  for (const raw of res.matches ?? []) {
    const hit = byId.get(raw.id);
    if (!hit) continue;
    const old = hit.c.matches[hit.i];
    const fresh = compactMatch(raw);
    // scorers and cards added by the full run (separate requests) are kept
    if (!fresh.goals && old.goals) fresh.goals = old.goals;
    if (!fresh.cards && old.cards) fresh.cards = old.cards;
    if (sameResult(old, fresh)) continue;
    hit.c.matches[hit.i] = fresh;
    changed++;
    console.log(
      `  ${fresh.homeTeam.shortName} – ${fresh.awayTeam.shortName}: ${old.status} → ${fresh.status} ` +
        `${fresh.score.fullTime.home ?? "-"}-${fresh.score.fullTime.away ?? "-"}`,
    );
    if (fresh.status === "FINISHED" && old.status !== "FINISHED") ended.add(hit.c.code);
  }

  for (const code of ended) {
    const c = snap.competitions.find((x) => x.code === code);
    try {
      const s = await api(`/competitions/${code}/standings`, token);
      const standings = (s.standings || [])
        .filter((g) => g.type === "TOTAL")
        .map((g) => ({ stage: g.stage, group: g.group, table: g.table.map(compactStanding) }));
      if (standings.length) {
        c.standings = standings;
        console.log(`  classifica aggiornata: ${COMPETITIONS.find((x) => x.code === code)?.name ?? code}`);
      }
    } catch (err) {
      console.warn(`  classifica ${code} non aggiornata: ${err.message.slice(0, 80)}`);
    }
  }

  if (changed) {
    snap.generatedAt = new Date(now).toISOString();
    const tmp = OUT + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(snap) + "\n");
    fs.renameSync(tmp, OUT);
  }
  console.log(`Partite cambiate: ${changed}`);
  output({ active: true, changed: changed > 0 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    // never break the site: the next full run fixes everything
    console.warn("Aggiornamento rapido non riuscito:", err.message);
    output({ active: true, changed: false });
  });
}
