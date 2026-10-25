// Matching team names across sources (football-data.org, YouTube titles, API-Sports):
// "FC Bayern München" ~ "FC BAYERN" ~ "Bayern Munich", "Queens Park Rangers FC" ~ "QPR".

// Generic words in club names, ignored when comparing.
const STOP = new Set(
  "FC AC AS SS SSC US ACF CFC BC CALCIO HELLAS SPA SC SV VFL VFB TSV FSV TSG BSC AFC CF CD UD RC RCD SD CA SE EC FR FBC FBPA AF CR GD CS SBV".split(
    " ",
  ),
);
// Other sources' names for a few clubs, by football-data.org short code.
const ALIASES = {
  FCB: ["Bayern Munich", "Barcelona"],
  BMG: ["Borussia Monchengladbach"],
  ATL: ["Atletico Madrid"],
  INT: ["Inter"],
};

export const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)));
const subset = (a, b) => a.size > 0 && [...a].every((w) => b.has(w));

/** A team as other sources may name it: full name, short name, three-letter code and known aliases. */
export function team(t) {
  const names = [t.name, t.shortName, t.tla, ...(ALIASES[t.tla] ?? [])].filter(Boolean);
  const all = new Set(names.flatMap((n) => [...tokens(n)]));
  return { all, names: names.map(tokens) };
}

/** `name` (from another source) is the team if its words all belong to the team's names, or it contains one whole. */
export function sameTeam(name, t) {
  const words = tokens(name);
  return subset(words, t.all) || t.names.some((n) => subset(n, words));
}
