// Every result of the current season of a competition, for the Under/Over and Goal statistics.
// The snapshot (src/data/football.json) holds only the last 45 days; the full current season is downloaded at every
// data update into data/football-history.json (scripts/fetch-football-data.mjs, updateHistory). Both are merged
// by match id, the snapshot winning (it is the fresher of the two).
// Without the history (local build without token) only the snapshot is available: `complete` is then false and the
// pages say how many matches the numbers are based on.

const played = (m) => ["FINISHED", "AWARDED"].includes(m.status) && m.score?.fullTime?.home != null;

/** Season start year of a result: European seasons start in July, the Brasileirão follows the calendar year. */
export const seasonOfDate = (date, code) => {
  const y = Number(date.slice(0, 4));
  return code === "BSA" ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
};

/**
 * @param comp     competition of the snapshot (code, season, matches, standings)
 * @param history  content of data/football-history.json
 * @returns { results: [{ id, date, home, away, hg, ag }], complete: boolean }
 */
export function seasonResults(comp, history) {
  const season = Number(comp.season?.startDate?.slice(0, 4)) || null;
  const byId = new Map();
  if (season)
    for (const r of history?.results ?? [])
      if (r.comp === comp.code && seasonOfDate(r.date, comp.code) === season)
        byId.set(String(r.id), { id: r.id, date: r.date, home: r.home, away: r.away, hg: r.hg, ag: r.ag });
  for (const m of comp.matches ?? [])
    if (played(m))
      byId.set(String(m.id), {
        id: m.id,
        date: m.utcDate,
        home: m.homeTeam.id,
        away: m.awayTeam.id,
        hg: m.score.fullTime.home,
        ag: m.score.fullTime.away,
      });
  const results = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));
  // complete when every league game of the table is there (cups with several groups or knock-outs: compare totals)
  const table = (comp.standings ?? []).flatMap((g) => g.table);
  const tableGames = table.reduce((a, r) => a + (r.playedGames ?? 0), 0) / 2;
  const complete = tableGames > 0 ? results.length >= tableGames : false;
  return { results, complete };
}
