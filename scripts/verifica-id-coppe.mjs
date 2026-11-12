// Temporary: checks API-Football league ids for national cups, super cups and lower divisions. Prints names only.
import { apiSports } from "./lib/api-sports.mjs";
const api = apiSports("football", process.env.API_FOOTBALL_KEY);
const ids = [137,45,48,143,81,66,90,96,73,547,528,556,529,526,543,550,559,138,942,943,41,141,79,62,89,95,72,435,436];
for (const id of ids) {
  const r = await api.get(`/leagues?id=${id}`);
  const l = r[0];
  if (!l) { console.log(`${id}\tNON TROVATA`); continue; }
  const cur = l.seasons?.find((s) => s.current) ?? l.seasons?.at(-1);
  const cov = cur?.coverage?.fixtures ?? {};
  console.log(`${id}\t${l.league.name}\t${l.league.type}\t${l.country.name}\tseason=${cur?.year} ${cur?.start}..${cur?.end}\tstandings=${cur?.coverage?.standings} events=${cov.events} lineups=${cov.lineups} stats=${cov.statistics_fixtures} players=${cov.players} injuries=${cur?.coverage?.injuries}\tseasons=${l.seasons.map((s)=>s.year).join(",")}`);
}
for (const c of ["Italy","England","Spain","Germany","France","Netherlands","Portugal","Brazil"]) {
  const r = await api.get(`/leagues?country=${c}`);
  console.log(`--- ${c}`);
  for (const l of r) if (l.league.type === "Cup" || /serie c|league one|segunda|2\. bundesliga|ligue 2|eerste|liga portugal 2|serie b|primera rfef|national/i.test(l.league.name)) console.log(`${l.league.id}\t${l.league.name}\t${l.league.type}`);
}
// rounds of the current season of each cup and supercup
for (const id of [137,45,48,143,81,66,90,96,73,547,528,556,529,526,543,550]) {
  const l = (await api.get(`/leagues?id=${id}`))[0];
  if (!l) continue;
  const cur = l.seasons?.find((s) => s.current) ?? l.seasons?.at(-1);
  const rounds = await api.get(`/fixtures/rounds?league=${id}&season=${cur.year}`);
  console.log(`ROUNDS ${id} ${cur.year}: ${rounds.join(" | ")}`);
}
// Serie C standings shape
const st = await api.get(`/standings?league=138&season=2026`);
console.log("SERIE C groups:", (st[0]?.league?.standings ?? []).map((g) => `${g[0]?.group} (${g.length})`).join(" | "));
console.log("requests:", api.stats?.().requests);
