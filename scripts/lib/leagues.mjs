// Competitions on the site, shared by the data scripts, the site (src/lib/competitionKinds.ts) and the live data worker
// (workers/live): no imports, so it also runs on Cloudflare and in the browser. `api`: API-Football league id.
//
// Kinds of club competitions:
//   domestic   a league: standings, team pages; `info`: shown only for information (standings, clubs, matches) and used
//              as data by the prediction model, but no predictions (lower divisions: their clubs meet the big ones in
//              the national cups); `tier`: level of the league in its country
//   cup        a national cup or (`supercup`) a national super cup: knockout matches, predictions with the chance of
//              going through; no team pages (they follow the leagues)
//   (none)     European cups (Champions League, Europa League, Conference League)
//   apiName / country: name and country API-Football gives the league, checked at every run: a different one stops
//   the competition (a wrong id would publish another competition under this name)
//   twoLegs    rounds played over two legs (home and away); the others are single matches
//   homeFinal  the final (or the super cup) is played at a club's ground; otherwise on neutral ground
//   calendar   seasons within one calendar year (Brazil); leaders: false for competitions without top-scorer lists

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
  { code: "BSA", slug: "brasileirao", name: "Brasileirão", api: 71, area: "Brazil", domestic: true, calendar: true },
  // National cups and super cups (November 2026)
  ...[
    { code: "CI", slug: "coppa-italia", name: "Coppa Italia", api: 137, apiName: "Coppa Italia", country: "Italy", twoLegs: ["SEMI_FINALS"] },
    { code: "FAC", slug: "fa-cup", name: "FA Cup", api: 45, apiName: "FA Cup", country: "England" },
    { code: "EFL", slug: "carabao-cup", name: "Carabao Cup", api: 48, apiName: "League Cup", country: "England", twoLegs: ["SEMI_FINALS"] },
    { code: "CDR", slug: "copa-del-rey", name: "Copa del Rey", api: 143, apiName: "Copa del Rey", country: "Spain", twoLegs: ["SEMI_FINALS"] },
    { code: "DFB", slug: "dfb-pokal", name: "DFB-Pokal", api: 81, apiName: "DFB Pokal", country: "Germany" },
    { code: "CDF", slug: "coupe-de-france", name: "Coupe de France", api: 66, apiName: "Coupe de France", country: "France" },
    { code: "KNVB", slug: "knvb-beker", name: "KNVB Beker", api: 90, apiName: "KNVB Beker", country: "Netherlands" },
    { code: "TP", slug: "taca-de-portugal", name: "Taça de Portugal", api: 96, apiName: "Taça de Portugal", country: "Portugal", twoLegs: ["SEMI_FINALS"] },
    { code: "CDB", slug: "copa-do-brasil", name: "Copa do Brasil", api: 73, apiName: "Copa Do Brasil", country: "Brazil", calendar: true, homeFinal: true, twoLegs: ["LAST_128", "LAST_64", "LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"] },
    ...[
      { code: "SCI", slug: "supercoppa-italiana", name: "Supercoppa Italiana", api: 547, apiName: "Super Cup", country: "Italy" },
      { code: "CS", slug: "community-shield", name: "Community Shield", api: 528, apiName: "Community Shield", country: "England" },
      { code: "SCE", slug: "supercopa-de-espana", name: "Supercopa de España", api: 556, apiName: "Super Cup", country: "Spain" },
      { code: "DFLS", slug: "supercoppa-di-germania", name: "Supercoppa di Germania", api: 529, apiName: "Super Cup", country: "Germany", homeFinal: true },
      { code: "TDC", slug: "trophee-des-champions", name: "Trophée des Champions", api: 526, apiName: "Trophée des Champions", country: "France" },
      { code: "JCS", slug: "johan-cruijff-schaal", name: "Johan Cruijff Schaal", api: 543, apiName: "Super Cup", country: "Netherlands" },
      { code: "SPT", slug: "supertaca", name: "Supertaça", api: 550, apiName: "Super Cup", country: "Portugal" },
      { code: "SCB", slug: "supercopa-do-brasil", name: "Supercopa do Brasil", api: 632, apiName: "Supercopa do Brasil", country: "Brazil", calendar: true },
    ].map((c) => ({ ...c, supercup: true, leaders: false })),
  ].map((c) => ({ ...c, area: c.country, cup: true })),
  // Lower divisions: information and data for the model only (no predictions)
  ...[
    { code: "SCA", slug: "serie-c-girone-a", name: "Serie C Girone A", api: 138, apiName: "Serie C - Girone A", country: "Italy", tier: 3 },
    { code: "SCBG", slug: "serie-c-girone-b", name: "Serie C Girone B", api: 942, apiName: "Serie C - Girone B", country: "Italy", tier: 3 },
    { code: "SCC", slug: "serie-c-girone-c", name: "Serie C Girone C", api: 943, apiName: "Serie C - Girone C", country: "Italy", tier: 3 },
    { code: "LO", slug: "league-one", name: "League One", api: 41, apiName: "League One", country: "England", tier: 3 },
    { code: "SD", slug: "segunda-division", name: "Segunda División", api: 141, apiName: "Segunda División", country: "Spain", tier: 2 },
    { code: "BL2", slug: "2-bundesliga", name: "2. Bundesliga", api: 79, apiName: "2. Bundesliga", country: "Germany", tier: 2 },
    { code: "FL2", slug: "ligue-2", name: "Ligue 2", api: 62, apiName: "Ligue 2", country: "France", tier: 2 },
    { code: "ED", slug: "eerste-divisie", name: "Eerste Divisie", api: 89, apiName: "Eerste Divisie", country: "Netherlands", tier: 2 },
    { code: "PPL2", slug: "liga-portugal-2", name: "Liga Portugal 2", api: 95, apiName: "Segunda Liga", country: "Portugal", tier: 2 },
    { code: "BSB", slug: "brasileirao-serie-b", name: "Brasileirão Série B", api: 72, apiName: "Serie B", country: "Brazil", tier: 2, calendar: true },
  ].map((c) => ({ ...c, area: c.country, domestic: true, info: true })),
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

/** National cups and super cups (see above). */
export const NATIONAL_CUPS = COMPETITIONS.filter((c) => c.cup);
/** Lower divisions shown only for information, without predictions. */
export const INFO_LEAGUES = COMPETITIONS.filter((c) => c.info);
const byKey = (list) => new Set(list.flatMap((c) => [c.code, c.slug]));
const INFO = byKey(INFO_LEAGUES);
const CUP = byKey(NATIONAL_CUPS);
const CALENDAR = byKey(COMPETITIONS.filter((c) => c.calendar));
/** `code`: site code or slug of a competition. */
export const isInfoLeague = (code) => INFO.has(code);
export const isNationalCup = (code) => CUP.has(code);
/** Seasons within one calendar year (Brazil): "2026" instead of "2026/27". */
export const isCalendarSeason = (code) => CALENDAR.has(code);
/** API-Football season of a club competition's match on `date` (YYYY-MM-DD…): the year it starts in. */
export const seasonYearOf = (date, code) => {
  const y = Number(date.slice(0, 4));
  return isCalendarSeason(code) ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
};
