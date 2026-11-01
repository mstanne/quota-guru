// Keeps the site's ids stable across data sources (data/id-map.json, saved with the data in the `dati` branch).
//
// Match and team ids are used everywhere: archive of published predictions, model history, highlights, details,
// team pages. Until November 2026 they came from football-data.org (football) and BALLDONTLIE (NBA); now the data
// come from API-Sports. The first time an API-Sports team or match is seen it is paired with the same team / match
// of the previous data (same league, same teams, kick-off within 36 hours) and keeps its old id; anything new gets
// the API-Sports id plus an offset, so it can never collide with an old one. Pairings are kept forever.
//
// Teams keep their old names too (they make the URL slugs of team and match pages), with the API-Sports logo.
import fs from "node:fs";
import { norm, sameTeam, team as teamMatcher } from "./teams.mjs";

export const TEAM_OFFSET = 10_000_000; // same offsets used since 2026 for Serie B and the European cups
export const MATCH_OFFSET = 1_000_000_000;
const PAIR_WINDOW_MS = 36 * 3600e3;

export function loadIdMap(file) {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    /* first run */
  }
  for (const k of ["footballTeams", "footballMatches", "nbaTeams", "nbaGames"]) data[k] ??= {};
  return data;
}

export function saveIdMap(file, data) {
  fs.writeFileSync(file, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }) + "\n");
}

/**
 * Football teams. `previous`: teams of the previous data, as [{ team, comps: Set<slug> }].
 * Returns resolve(apiTeam, compSlug) → site team { id, name, shortName, tla, crest }.
 */
export function footballTeamResolver(map, previous, logo) {
  const known = previous.map((p) => ({ ...p, matcher: teamMatcher(p.team) }));
  const taken = new Set(Object.values(map.footballTeams).map((t) => t.id));
  return (apiTeam, compSlug) => {
    const key = String(apiTeam.id);
    let t = map.footballTeams[key];
    if (!t) {
      // prefer a club of the same competition, then any club; the pairing must be unambiguous
      // several candidates ("Deportivo": La Coruña or Alavés): keep the one whose name is exactly the same
      const exact = (list) =>
        list.length > 1 ? list.filter((p) => [p.team.name, p.team.shortName].some((n) => n && norm(n) === norm(apiTeam.name))) : list;
      const pick = (list) => exact(list.filter((p) => !taken.has(p.team.id) && sameTeam(apiTeam.name, p.matcher)));
      let hits = pick(known.filter((p) => p.comps.has(compSlug)));
      if (hits.length !== 1) hits = pick(known);
      const old = hits.length === 1 ? hits[0].team : null;
      t = old
        ? { id: old.id, name: old.name, shortName: old.shortName || old.name, tla: old.tla || "" }
        : { id: TEAM_OFFSET + apiTeam.id, name: apiTeam.name, shortName: apiTeam.name, tla: tlaOf(apiTeam.name) };
      map.footballTeams[key] = t;
      taken.add(t.id);
    }
    return { ...t, crest: logo(apiTeam.logo) };
  };
}

/**
 * Match ids. `previous`: matches of the previous data as [{ match, comp: slug }] (site ids, site team ids).
 * Returns resolve(fixtureId, compSlug, homeId, awayId, utcDate) → site match id.
 */
export function matchIdResolver(store, previous) {
  const taken = new Set(Object.values(store));
  return (apiId, compSlug, homeId, awayId, utcDate) => {
    const key = String(apiId);
    if (store[key] != null) return store[key];
    const t = Date.parse(utcDate);
    const old = previous.find(
      ({ match, comp }) =>
        comp === compSlug &&
        !taken.has(match.id) &&
        match.homeTeam.id === homeId &&
        match.awayTeam.id === awayId &&
        Math.abs(Date.parse(match.utcDate) - t) <= PAIR_WINDOW_MS,
    );
    const id = old ? old.match.id : MATCH_OFFSET + apiId;
    store[key] = id;
    taken.add(id);
    return id;
  };
}

function tlaOf(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}
