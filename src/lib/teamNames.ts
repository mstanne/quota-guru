// Shorter team names for the narrow rows of the match lists on phones ("Red Bull Salzburg" → "Salisburgo").
// Only the display changes: links, pages and the slip keep the names of the data.

/** Common Italian or short names of clubs whose data name is long. Keys are compared case- and accent-free. */
const KNOWN: Record<string, string> = {
  "red bull salzburg": "Salisburgo",
  "rb salzburg": "Salisburgo",
  "olympique lyonnais": "Lione",
  "olympique lyon": "Lione",
  "olympique marseille": "Marsiglia",
  "olympique de marseille": "Marsiglia",
  "paris saint germain": "PSG",
  "paris saint-germain": "PSG",

  "borussia monchengladbach": "Gladbach",
  "borussia m'gladbach": "Gladbach",
  "bayer leverkusen": "Leverkusen",
  "eintracht frankfurt": "Francoforte",
  "atletico madrid": "Atlético",
  "manchester united": "Man United",
  "manchester city": "Man City",
  "tottenham hotspur": "Tottenham",
  "nottingham forest": "Nottingham",
  "brighton hove": "Brighton",
  "brighton & hove albion": "Brighton",
  wolverhampton: "Wolves",
  "wolverhampton wanderers": "Wolves",
  "shakhtar donetsk": "Shakhtar",
  "union saint-gilloise": "Union SG",
  "union st. gilloise": "Union SG",
  "viktoria plzen": "Plzen",
  "shamrock rovers": "Shamrock",
  "lincoln red imps": "Lincoln",
  "omonia nicosia": "Omonia",
  "go ahead eagles": "Go Ahead",
  "az alkmaar": "AZ",
  "crvena zvezda": "Stella Rossa",
  "fk crvena zvezda": "Stella Rossa",
  "dinamo zagreb": "Dinamo Z.",
  "rayo vallecano": "Rayo",
  "crystal palace": "C. Palace",
  "sheffield utd": "Sheffield U.",
  "clube do remo": "Remo",
  "vasco da gama": "Vasco",
  "estoril praia": "Estoril",
  "sl. bratislava": "Slovan",
  "slovan bratislava": "Slovan",
  "ferencvarosi tc": "Ferencváros",
  "west bromwich albion": "West Brom",
  "west bromwich": "West Brom",
  "queens park rangers": "QPR",
  "preston north end": "Preston",
  "preston ne": "Preston",
  "sheffield wednesday": "Sheffield W.",
  "sheffield united": "Sheffield U.",
  "sporting braga": "Braga",
  "sc braga": "Braga",
  "athletic club": "Athletic",
  "athletic bilbao": "Athletic",
  "deportivo alaves": "Alavés",
  "borussia dortmund": "Dortmund",
};

// club-type words that add nothing in a list ("FC Midtjylland" → "Midtjylland")
const GENERIC = new Set(
  "FC FK SK AC AS SS US AFC CF SC BK NK GNK HNK KAA KRC RSC PFC SV TC SL CFR IF FF AIK HJK".split(" "),
);

// last words that only say "club": dropped when the town alone fits
const SUFFIX = new Set(
  "City United Town County Rovers Athletic Wanderers Albion Rangers Hotspur Argyle Orient".split(" "),
);

const key = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Display name for a phone-width row: at most ~11 characters (what fits next to three cells) when a short form exists. */
export function compactTeamName(name: string, max = 11): string {
  if (name.length <= max) return name;
  const known = KNOWN[key(name)];
  if (known) return known;
  const words = name.split(/\s+/).filter((w) => !GENERIC.has(w.replace(/\.$/, "")));
  const stripped = words.join(" ");
  if (stripped && stripped.length <= max) return stripped;
  if (KNOWN[key(stripped)]) return KNOWN[key(stripped)];
  // "Coventry City" → "Coventry", "Leeds United" → "Leeds": the town says it all
  if (words.length > 1 && SUFFIX.has(words[words.length - 1])) {
    const town = words.slice(0, -1).join(" ");
    if (town.length <= max) return town;
  }
  // "Real Sociedad" → "R. Sociedad"
  if (words.length > 1 && !SUFFIX.has(words[words.length - 1])) {
    const initial = `${words[0][0]}. ${words.slice(1).join(" ")}`;
    if (initial.length <= max) return initial;
  }
  return stripped || name;
}

/** Text for searching team names: lower case, no accents or punctuation. */
export const searchKey = (s: string) =>
  key(s)
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ");
