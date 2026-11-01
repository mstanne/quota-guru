// Competitions on the site, shared by the data scripts and the live data worker (workers/live): no imports, so it
// also runs on Cloudflare. `api`: API-Football league id.

/** Competitions in display order. `code`: the site's code (kept from football-data.org: history keys, routes). */
export const COMPETITIONS = [
  { code: "SA", slug: "serie-a", name: "Serie A", api: 135, area: "Italy", domestic: true },
  { code: "SB", slug: "serie-b", name: "Serie B", api: 136, area: "Italy", domestic: true },
  { code: "CL", slug: "champions-league", name: "Champions League", api: 2, area: "Europe" },
  { code: "EL", slug: "europa-league", name: "Europa League", api: 3, area: "Europe" },
  { code: "ECL", slug: "conference-league", name: "Conference League", api: 848, area: "Europe" },
  { code: "PL", slug: "premier-league", name: "Premier League", api: 39, area: "England", domestic: true },
  { code: "PD", slug: "liga", name: "LaLiga", api: 140, area: "Spain", domestic: true },
  { code: "BL1", slug: "bundesliga", name: "Bundesliga", api: 78, area: "Germany", domestic: true },
  { code: "FL1", slug: "ligue-1", name: "Ligue 1", api: 61, area: "France", domestic: true },
  { code: "DED", slug: "eredivisie", name: "Eredivisie", api: 88, area: "Netherlands", domestic: true },
  { code: "PPL", slug: "primeira-liga", name: "Primeira Liga", api: 94, area: "Portugal", domestic: true },
  { code: "ELC", slug: "championship", name: "Championship", api: 40, area: "England", domestic: true },
  { code: "BSA", slug: "brasileirao", name: "Brasileirão", api: 71, area: "Brazil", domestic: true },
];
