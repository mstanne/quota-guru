// Quick update of scores and standings between the full data refreshes (workflow .github/workflows/live-scores.yml,
// every 15 minutes). Starts from the src/data/football.json of the last full run and, only if a match is under way or
// just finished, asks API-Football for those matches by id (1 request per 20 matches) and for the standings of the
// competitions where a match has just ended (1 request each). Everything else (calendar, head-to-head, teams,
// details, highlights, texts) stays as the last full run left it.
//
// Usage:  API_FOOTBALL_KEY=<key> node scripts/fetch-live-scores.mjs
// Writes "active" and "changed" (true/false) to $GITHUB_OUTPUT: the workflow rebuilds the site only when changed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiSports, loadDotEnv } from "./lib/api-sports.mjs";
import { COMPETITIONS, compactFixture, compactStandings } from "./fetch-football.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "football.json");
const STORE = path.join(root, ".cache", "match-details", "football-store.json");

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
        if (!m.apiId) return false;
        if (PLAYING.has(m.status)) return true;
        if (FINAL.has(m.status)) return false;
        const t = Date.parse(m.utcDate);
        return now >= t - BEFORE_MS && now <= t + AFTER_MS;
      })
      .map((m) => ({ c, m })),
  );
}

const sameResult = (a, b) =>
  a.status === b.status && JSON.stringify(a.score) === JSON.stringify(b.score) && a.utcDate === b.utcDate;

async function main() {
  loadDotEnv(root);
  const key = process.env.API_FOOTBALL_KEY;
  if (!key || !fs.existsSync(OUT)) {
    console.warn("Chiave o dati di partenza mancanti: nessun aggiornamento.");
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
  const api = apiSports("football", key);

  const byApiId = new Map(live.map(({ c, m }) => [m.apiId, { c, m }]));
  const fixtures = [];
  const ids = [...byApiId.keys()];
  for (let i = 0; i < ids.length; i += 20) fixtures.push(...(await api.get(`/fixtures?ids=${ids.slice(i, i + 20).join("-")}`)));

  const ended = new Set();
  let changed = 0;
  for (const f of fixtures) {
    const hit = byApiId.get(f.fixture?.id);
    if (!hit) continue;
    const old = hit.m;
    // same teams and same id as before: only status and score change
    const fresh = compactFixture(
      f,
      (t) => (t.id === f.teams.home.id ? old.homeTeam : old.awayTeam),
      () => old.id,
    );
    if (sameResult(old, fresh)) continue;
    Object.assign(old, { status: fresh.status, score: fresh.score, utcDate: fresh.utcDate });
    changed++;
    console.log(
      `  ${old.homeTeam.shortName} – ${old.awayTeam.shortName}: ${fresh.status} ` +
        `${fresh.score.fullTime.home ?? "-"}-${fresh.score.fullTime.away ?? "-"}`,
    );
    if (fresh.status === "FINISHED") ended.add(hit.c);
  }

  const seasons = (() => {
    try {
      return JSON.parse(fs.readFileSync(STORE, "utf8")).seasons ?? {};
    } catch {
      return {};
    }
  })();
  for (const c of ended) {
    const def = COMPETITIONS.find((x) => x.code === c.code);
    const year = seasons[c.code]?.year ?? Number(c.season?.startDate?.slice(0, 4));
    if (!def || !year) continue;
    try {
      const teams = new Map(c.matches.flatMap((m) => [m.homeTeam, m.awayTeam]).map((t) => [t.name, t]));
      const s = await api.get(`/standings?league=${def.api}&season=${year}`);
      // the clubs are already in the standings of the full run: keep their site ids
      const prevTeams = new Map((c.standings ?? []).flatMap((g) => g.table).map((r) => [r.team.crest, r.team]));
      const st = compactStandings(s[0]?.league?.standings ?? [], (t) => prevTeams.get(t.logo) ?? teams.get(t.name) ?? null);
      if (st.length && st.every((g) => g.table.every((r) => r.team))) {
        c.standings = st;
        console.log(`  classifica aggiornata: ${c.name}`);
      }
    } catch (err) {
      console.warn(`  classifica ${c.name} non aggiornata: ${err.message.slice(0, 80)}`);
    }
  }

  if (changed) {
    snap.generatedAt = new Date(now).toISOString();
    fs.writeFileSync(OUT + ".tmp", JSON.stringify(snap) + "\n");
    fs.renameSync(OUT + ".tmp", OUT);
  }
  console.log(`Partite cambiate: ${changed} (${api.stats().requests} richieste)`);
  output({ active: true, changed: changed > 0 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    // never break the site: the next full run fixes everything
    console.warn("Aggiornamento rapido non riuscito:", err.message);
    output({ active: true, changed: false });
  });
}
