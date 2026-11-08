// National teams: Italian names of the teams API-Football names in English ("Ivory Coast" → "Costa d'Avorio"),
// and whether a match is played at home, from the country of its stadium.
// No imports: also used by the live data worker (workers/live).

/** Names ICU does not give (home nations, football-only names) or gives in a form nobody uses on a scoreboard. */
const OVERRIDES = {
  england: "Inghilterra",
  scotland: "Scozia",
  wales: "Galles",
  northernireland: "Irlanda del Nord",
  republicofireland: "Irlanda",
  ireland: "Irlanda",
  usa: "Stati Uniti",
  unitedstates: "Stati Uniti",
  korearepublic: "Corea del Sud",
  southkorea: "Corea del Sud",
  koreadpr: "Corea del Nord",
  northkorea: "Corea del Nord",
  ivorycoast: "Costa d'Avorio",
  cotedivoire: "Costa d'Avorio",
  congodr: "RD Congo",
  drcongo: "RD Congo",
  democraticrepublicofthecongo: "RD Congo",
  congo: "Congo",
  czechrepublic: "Repubblica Ceca",
  czechia: "Repubblica Ceca",
  turkey: "Turchia",
  turkiye: "Turchia",
  capeverdeislands: "Capo Verde",
  capeverde: "Capo Verde",
  chinesetaipei: "Taipei Cinese",
  chinapr: "Cina",
  macedonia: "Macedonia del Nord",
  northmacedonia: "Macedonia del Nord",
  fyrmacedonia: "Macedonia del Nord",
  bosnia: "Bosnia ed Erzegovina",
  bosniaandherzegovina: "Bosnia ed Erzegovina",
  faroeislands: "Isole Fær Øer",
  curacao: "Curaçao",
  kosovo: "Kosovo",
  palestine: "Palestina",
  hongkong: "Hong Kong",
  macau: "Macao",
  swaziland: "Eswatini",
  eswatini: "Eswatini",
  gambia: "Gambia",
  thegambia: "Gambia",
  tahiti: "Tahiti",
  stkittsandnevis: "Saint Kitts e Nevis",
  saintkittsandnevis: "Saint Kitts e Nevis",
  stlucia: "Santa Lucia",
  saintlucia: "Santa Lucia",
  stvincentandthegrenadines: "Saint Vincent e Grenadine",
  saintvincentandthegrenadines: "Saint Vincent e Grenadine",
  antiguaandbarbuda: "Antigua e Barbuda",
  trinidadandtobago: "Trinidad e Tobago",
  saotomeandprincipe: "São Tomé e Príncipe",
  usvirginislands: "Isole Vergini americane",
  britishvirginislands: "Isole Vergini britanniche",
  caymanislands: "Isole Cayman",
  turksandcaicosislands: "Turks e Caicos",
  solomonislands: "Isole Salomone",
  centralafricanrepublic: "Repubblica Centrafricana",
  dominicanrepublic: "Repubblica Dominicana",
  equatorialguinea: "Guinea Equatoriale",
  newzealand: "Nuova Zelanda",
  newcaledonia: "Nuova Caledonia",
  papuanewguinea: "Papua Nuova Guinea",
  southafrica: "Sudafrica",
  southsudan: "Sud Sudan",
  saudiarabia: "Arabia Saudita",
  unitedarabemirates: "Emirati Arabi Uniti",
  timorleste: "Timor Est",
  easttimor: "Timor Est",
  russia: "Russia",
  vietnam: "Vietnam",
  syria: "Siria",
  iran: "Iran",
  laos: "Laos",
  brunei: "Brunei",
  moldova: "Moldavia",
};

/** Lower case, no accents, letters only, "&" and "St." spelt out: "Bosnia & Herzegovina" → "bosniaandherzegovina". */
export const countryKey = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z]/g, "");

let fromIcu = null;
/** English country name → Italian, from the ICU data of the runtime (every ISO 3166 region). */
function icuNames() {
  if (fromIcu) return fromIcu;
  fromIcu = new Map();
  try {
    const en = new Intl.DisplayNames(["en"], { type: "region" });
    const it = new Intl.DisplayNames(["it"], { type: "region" });
    const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const a of A)
      for (const b of A) {
        const code = a + b;
        let name;
        try {
          name = en.of(code);
        } catch {
          continue;
        }
        if (!name || name === code) continue;
        const italian = it.of(code);
        // "Congo - Kinshasa" and similar forms are left to OVERRIDES
        if (italian && !italian.includes(" - ")) fromIcu.set(countryKey(name), italian.replace(/’/g, "'"));
      }
  } catch {
    /* runtime without ICU: OVERRIDES only, English names otherwise */
  }
  return fromIcu;
}

/** Italian name of a national team ("Italy" → "Italia"). The short name is the same: it makes the URL slugs, and
 *  the narrow rows of the match lists shorten long names by themselves (src/lib/teamNames.ts). */
export function nationalTeamName(apiName) {
  const key = countryKey(apiName);
  const name = OVERRIDES[key] ?? icuNames().get(key) ?? String(apiName ?? "").trim();
  return { name, shortName: name };
}

/** Same country? API-Football writes countries with hyphens ("South-Korea") and teams with spaces ("Korea Republic"). */
export function sameCountry(teamName, country) {
  if (!teamName || !country) return false;
  const a = countryKey(teamName);
  const b = countryKey(country);
  if (a === b) return true;
  const na = nationalTeamName(teamName).name;
  const nb = nationalTeamName(country.replace(/-/g, " ")).name;
  return countryKey(na) === countryKey(nb);
}

/**
 * Site team of a national team (API-Football team in a fixture): its entry in the id map, created the first time with
 * the Italian name and id TEAM_OFFSET + API id. National teams are never paired with clubs of older data.
 * `onNew()` is called for every team created. Shared by scripts/fetch-football.mjs and scripts/backfill-archive.mjs.
 */
export function nationalTeamResolver(map, logo, teamOffset, onNew = () => {}) {
  return (t) => {
    const key = String(t.id);
    let entry = map.footballTeams[key];
    if (!entry) {
      const { name, shortName } = nationalTeamName(t.name);
      const tla = /^[A-Z]{3}$/.test(t.code ?? "") ? t.code : name.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
      entry = map.footballTeams[key] = { id: teamOffset + t.id, name, shortName, tla, national: true };
      onNew(entry);
    }
    return { ...entry, crest: logo(t.logo) };
  };
}
