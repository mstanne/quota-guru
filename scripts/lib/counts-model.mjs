// Corners and cards of football matches: the same team model as the goals (scripts/lib/poisson-model.mjs, attack and
// defence of every team, home advantage and level of each competition, recent games weigh more), fitted on the corners
// won and on the cards received instead of the goals. Plus the share of goals scored in the first half.
//
// Data: the permanent archive data/archivio/calcio/<competition>/<season>/<month>.json (statistics of every finished
// match, from API-Football). Clubs only: national teams play too few games with statistics.
//
// Counts vary more than a Poisson count would (cards above all: referees, derbies): `phi` is the measured ratio
// variance / mean, used by the site to widen the distribution (negative binomial, src/lib/footballMarkets.ts).
import fs from "node:fs";
import path from "node:path";
import { fitModel, expectedGoals } from "./poisson-model.mjs";
import { COMPETITIONS } from "./leagues.mjs";
import { CUPS } from "./football-fit.mjs";

const CLUB = COMPETITIONS.filter((c) => !c.national);
const CODE = new Map(CLUB.map((c) => [c.slug, c.code]));
const DAY = 86400000;

/**
 * Finished club matches of the archive with their statistics, from `fromMs` on:
 * { id, date, comp, home, away, corners: [h, a] | null, cards: [h, a] | null, ht: [h, a] | null, ft: [h, a] | null }.
 */
export function loadArchiveStats(archiveDir, fromMs = 0) {
  const base = path.join(archiveDir, "calcio");
  const out = [];
  if (!fs.existsSync(base)) return out;
  for (const slug of fs.readdirSync(base)) {
    const comp = CODE.get(slug);
    if (!comp) continue;
    for (const season of fs.readdirSync(path.join(base, slug))) {
      const dir = path.join(base, slug, season);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) {
        // month files: skip whole months before the start
        if (Date.parse(`${f.slice(0, 7)}-01T00:00:00Z`) + 31 * DAY < fromMs) continue;
        let data;
        try {
          data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        } catch {
          continue;
        }
        for (const m of Object.values(data.matches ?? {})) {
          if (m.status !== "FINISHED" || Date.parse(m.utcDate) < fromMs || !m.home?.id || !m.away?.id) continue;
          const s = m.stats;
          const num = (x) => (Number.isFinite(x) ? x : x == null ? 0 : NaN);
          const pair = (k) => {
            if (!s?.home || !s?.away || s.home[k] === undefined) return null;
            const v = [num(s.home[k]), num(s.away[k])];
            return v.every(Number.isFinite) ? v : null;
          };
          const c = pair("Corner Kicks");
          const y = pair("Yellow Cards");
          const r = pair("Red Cards");
          const sc = m.score ?? {};
          const ft = sc.regularTime?.home != null ? sc.regularTime : sc.fullTime;
          out.push({
            id: m.id,
            date: m.utcDate,
            comp,
            home: m.home.id,
            away: m.away.id,
            corners: c,
            cards: y && r ? [y[0] + r[0], y[1] + r[1]] : null,
            ht: sc.halfTime?.home != null ? [sc.halfTime.home, sc.halfTime.away] : null,
            ft: ft?.home != null ? [ft.home, ft.away] : null,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Count model options: league strengths do not apply to corners and cards (no priors, little spread). */
// Tuned in November 2026 on the 2026-27 season (monthly refits, log-loss of the over/under lines): corners with a
// strong pull towards the average team (their team differences are small and noisy), cards with a shorter memory.
const TUNED = {
  corners: { halfLifeDays: 365, teamSigma: 0.1 },
  cards: { halfLifeDays: 150, teamSigma: 0.2 },
};
const COUNT_FIT = (asOf, k, o = {}) => ({
  asOf,
  cups: CUPS,
  options: { homeMean: 0.1, leagueSigma: 0.1, ...TUNED[k], ...o },
});

/** Ratio variance / mean of the counts around the model's expectation (≥ 1). */
function dispersion(model, rows) {
  let chi = 0;
  let n = 0;
  for (const r of rows) {
    const e = expectedGoals(model, r);
    for (const [y, mu] of [
      [r.hg, e.home],
      [r.ag, e.away],
    ]) {
      chi += (y - mu) ** 2 / mu;
      n++;
    }
  }
  return n ? Math.max(1, Math.round((chi / n) * 1000) / 1000) : 1;
}

/**
 * Fits corners and cards on the matches before `asOf` (last three years) and the first-half share of goals.
 * Returns { asOf, half, corners: { model, phi }, cards: { model, phi } } (models as poisson-model.mjs fitModel).
 */
export function fitCounts(matches, asOf, tune = {}) {
  const asOfMs = Date.parse(asOf);
  const recent = matches.filter((m) => Date.parse(m.date) < asOfMs && Date.parse(m.date) >= asOfMs - 3 * 365 * DAY);
  const rows = (k) => recent.filter((m) => m[k]).map((m) => ({ date: m.date, comp: m.comp, home: m.home, away: m.away, hg: m[k][0], ag: m[k][1] }));
  const fit = (k) => {
    const rs = rows(k);
    const model = fitModel(rs, COUNT_FIT(asOf, k, tune[k]));
    // dispersion on the last season's games only (the ratings are fitted on them too, so this is a slight underestimate)
    const phi = dispersion(model, rs.filter((r) => Date.parse(r.date) >= asOfMs - 365 * DAY));
    return { model: slim(model), phi, n: rs.length };
  };
  // first half: share of the 90-minute goals scored before the break
  let h1 = 0;
  let all = 0;
  for (const m of recent) if (m.ht && m.ft) (h1 += m.ht[0] + m.ht[1]), (all += m.ft[0] + m.ft[1]);
  return { asOf, half: all ? Math.round((h1 / all) * 1000) / 1000 : 0.444, corners: fit("corners"), cards: fit("cards") };
}

/** Only what expectedGoals needs, rounded (the file travels with the data). */
function slim(m) {
  const r = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10000) / 10000]));
  return {
    options: { homeMean: m.options.homeMean },
    mu: r(m.mu),
    home: r(m.home),
    att: r(m.att),
    def: r(m.def),
    league: r(m.league),
    teamLeague: m.teamLeague,
    games: Object.fromEntries(Object.entries(m.games).map(([k, v]) => [k, Math.round(v * 10) / 10])),
  };
}

/** Expected corners or cards [home, away] of a fixture, or null when a team has too few games in the data. */
export function expectedCounts(part, f, minGames = 4) {
  const m = part.model;
  if ((m.games[f.home] ?? 0) < minGames || (m.games[f.away] ?? 0) < minGames) return null;
  const e = expectedGoals(m, f);
  return [Math.round(e.home * 100) / 100, Math.round(e.away * 100) / 100];
}
