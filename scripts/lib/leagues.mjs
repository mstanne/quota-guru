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
  // National teams (`national`): own prediction model (scripts/lib/national-fit.mjs), seasons chosen by date instead of
  // `current` (qualifiers run over two years), team names in Italian (scripts/lib/national-teams.mjs).
  //   apiName: name API-Football gives the league: checked at every run, a different one stops the competition
  //   confed: confederation (prediction model); tournament: final phase of a tournament, played on neutral ground
  //   except by the hosts; standings / leaders: false when the competition has no table or top scorers
  ...[
    { code: "WC", slug: "mondiali", name: "Mondiali", api: 1, apiName: "World Cup", area: "World", tournament: true },
    { code: "UNL", slug: "nations-league", name: "Nations League", api: 5, apiName: "UEFA Nations League", area: "Europe", confed: "UEFA" },
    { code: "EURO", slug: "europei", name: "Europei", api: 4, apiName: "Euro Championship", area: "Europe", confed: "UEFA", tournament: true },
    { code: "EUROQ", slug: "qualificazioni-europei", name: "Qualificazioni Europei", api: 960, apiName: "Euro Championship - Qualification", area: "Europe", confed: "UEFA" },
    { code: "WCQE", slug: "qualificazioni-mondiali-europa", name: "Qualificazioni Mondiali Europa", api: 32, apiName: "World Cup - Qualification Europe", area: "Europe", confed: "UEFA" },
    { code: "WCQSA", slug: "qualificazioni-mondiali-sudamerica", name: "Qualificazioni Mondiali Sudamerica", api: 34, apiName: "World Cup - Qualification South America", area: "South America", confed: "CONMEBOL" },
    { code: "COPA", slug: "copa-america", name: "Copa América", api: 9, apiName: "Copa America", area: "South America", confed: "CONMEBOL", tournament: true },
    { code: "WCQAF", slug: "qualificazioni-mondiali-africa", name: "Qualificazioni Mondiali Africa", api: 29, apiName: "World Cup - Qualification Africa", area: "Africa", confed: "CAF" },
    { code: "AFCON", slug: "coppa-d-africa", name: "Coppa d'Africa", api: 6, apiName: "Africa Cup of Nations", area: "Africa", confed: "CAF", tournament: true },
    { code: "AFCONQ", slug: "qualificazioni-coppa-d-africa", name: "Qualificazioni Coppa d'Africa", api: 36, apiName: "Africa Cup of Nations - Qualification", area: "Africa", confed: "CAF" },
    { code: "WCQAS", slug: "qualificazioni-mondiali-asia", name: "Qualificazioni Mondiali Asia", api: 30, apiName: "World Cup - Qualification Asia", area: "Asia", confed: "AFC" },
    { code: "ASIA", slug: "coppa-d-asia", name: "Coppa d'Asia", api: 7, apiName: "Asian Cup", area: "Asia", confed: "AFC", tournament: true },
    { code: "ASIAQ", slug: "qualificazioni-coppa-d-asia", name: "Qualificazioni Coppa d'Asia", api: 35, apiName: "Asian Cup - Qualification", area: "Asia", confed: "AFC" },
    { code: "WCQNA", slug: "qualificazioni-mondiali-concacaf", name: "Qualificazioni Mondiali CONCACAF", api: 31, apiName: "World Cup - Qualification CONCACAF", area: "North America", confed: "CONCACAF" },
    { code: "GOLD", slug: "gold-cup", name: "Gold Cup", api: 22, apiName: "CONCACAF Gold Cup", area: "North America", confed: "CONCACAF", tournament: true },
    { code: "CNL", slug: "concacaf-nations-league", name: "CONCACAF Nations League", api: 536, apiName: "CONCACAF Nations League", area: "North America", confed: "CONCACAF" },
    { code: "WCQOC", slug: "qualificazioni-mondiali-oceania", name: "Qualificazioni Mondiali Oceania", api: 33, apiName: "World Cup - Qualification Oceania", area: "Oceania", confed: "OFC" },
    { code: "WCQPO", slug: "spareggi-mondiali", name: "Spareggi intercontinentali Mondiali", api: 37, apiName: "World Cup - Qualification Intercontinental Play-offs", area: "World", tournament: true, leaders: false },
    { code: "FRI", slug: "amichevoli-nazionali", name: "Amichevoli internazionali", api: 10, apiName: "Friendlies", area: "World", standings: false, leaders: false },
  ].map((c) => ({ ...c, national: true })),
];

/** Competitions of national teams (see above). */
export const NATIONAL = COMPETITIONS.filter((c) => c.national);
export const isNational = (code) => NATIONAL.some((c) => c.code === code || c.slug === code);
