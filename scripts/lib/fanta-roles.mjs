// Fantasy roles of the official list of the game (data/fantacalcio-ruoli.json, "listone"): classic role (P, D, C, A)
// and Mantra roles (Por, Dc, Dd, Ds, B, E, M, C, T, W, A, Pc), matched to the API-Football players by club and name.
// The fantacalcio pages use these roles instead of the API positions.
//
// The list names players as "Surname", "Surname X." or "Surname Xy." (initial of the first name, two letters when
// two players share the surname, "D.S." for several names): a player matches when every word of the surname is a word
// of his API name (or the surname written without spaces is one of them, "De Bruyne" / "DeBruyne") and the initial
// starts one of his names. First within his club; then, for players who moved, in all the clubs of the league, but only
// when a single player matches.
import fs from "node:fs";
import path from "node:path";

const FOLD = { ø: "o", ß: "ss", ł: "l", đ: "d", ð: "d", æ: "ae", ı: "i", œ: "oe", þ: "th" };
/** Lower-case words without accents. */
export function words(s) {
  const t = String(s ?? "")
    .toLowerCase()
    .replace(/[øßłđðæıœþ]/g, (c) => FOLD[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
  return t ? t.split(" ") : [];
}
/** Club key: first word of the name ("Como 1907" / "Como", "Venezia FC" / "Venezia"). */
export const clubKey = (name) => words(name)[0] ?? "";

/** "Martinez Jo." → surname words ["martinez"], initials ["jo"]; "Ederson D.S." → ["ederson"], ["d", "s"]. */
function parse(name) {
  const parts = String(name).trim().split(/\s+/);
  const initials = [];
  while (parts.length > 1 && /^([A-Za-zÀ-ÿ]{1,3}\.)+$/.test(parts[parts.length - 1])) {
    initials.unshift(...parts.pop().split(".").filter(Boolean).map((x) => words(x).join("")));
  }
  return { surname: words(parts.join(" ")), initials };
}

function matches(p, want) {
  const all = [...words(p.first), ...words(p.last), ...words(p.name)];
  const set = new Set(all);
  const glued = want.surname.join("");
  const surnameOk = want.surname.every((w) => set.has(w)) || set.has(glued) || words(p.last).join("") === glued;
  if (!surnameOk) return false;
  if (!want.initials.length) return true;
  // the initial: the first name (or the abbreviation of the API name, "L." in "L. Martínez"); with more letters
  // ("Jo.", "Lu.") the start of a name; several ("D.S.") each the start of one of his names
  // ("Jo.", "Lu.") the start of a name or the initials of two first names ("Hj." Hamed Junior); several ("D.S.")
  // each the start of one of his names. Other names count too ("Vitinha O.": Vítor Manuel Carvalho Oliveira).
  const firsts = [...words(p.first), ...words(String(p.name).split(".")[0])];
  const others = all.filter((w) => !want.surname.includes(w));
  if (want.initials.length === 1) {
    const i = want.initials[0];
    return (
      others.some((w) => w.startsWith(i)) ||
      (i.length === 2 && firsts.length >= 2 && words(p.first).map((w) => w[0]).join("").startsWith(i))
    );
  }
  return want.initials.every((i) => others.some((w) => w.startsWith(i)));
}

/**
 * Map API player id → { role, mantra } for the players of the given squads.
 * @param root repository root
 * @param squads [{ club: name of the club on the site, players: API-Football squad rows with id, name, first, last }]
 * @returns { byId: Map, unmatched: list entries without a player, loaded: whether the list exists }
 */
export function fantaRoles(root, squads) {
  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(path.join(root, "data", "fantacalcio-ruoli.json"), "utf8")).players ?? [];
  } catch {
    return { byId: new Map(), unmatched: [], loaded: false };
  }
  const byClub = new Map();
  for (const s of squads) {
    const k = clubKey(s.club);
    byClub.set(k, [...(byClub.get(k) ?? []), ...s.players]);
  }
  const everyone = [...byClub.values()].flat();
  const byId = new Map();
  const taken = new Set();
  const unmatched = [];
  const pending = [];
  const pick = (cands) => {
    const ids = [...new Set(cands.map((p) => p.id))].filter((id) => !taken.has(id));
    return ids.length === 1 ? ids[0] : null;
  };
  const assign = (id, e) => {
    taken.add(id);
    byId.set(id, { role: e.r, mantra: e.rm ?? [] });
  };
  // an entry without initials does not take a player that another entry with the same surname and initials fits
  // (in the club pass, entries of the same club; in the league pass, any: "Pessina" of one club, "Pessina Mas." moved)
  const parsed = list.map((e) => [e, parse(e.name)]);
  const withInitials = parsed.filter(([, w]) => w.initials.length);
  const claimedByOther = (p, want, club) =>
    !want.initials.length &&
    withInitials.some(
      ([o, w]) => (club == null || clubKey(o.team) === club) && w.surname.join(" ") === want.surname.join(" ") && matches(p, w),
    );
  // first in the club; the rest after, so a player already matched in his club is not taken twice
  for (const [e, want] of parsed) {
    const club = clubKey(e.team);
    const id = pick((byClub.get(club) ?? []).filter((p) => matches(p, want) && !claimedByOther(p, want, club)));
    if (id != null) assign(id, e);
    else pending.push([e, want]);
  }
  for (const [e, want] of pending) {
    const id =
      want.surname.join("").length >= 4 ? pick(everyone.filter((p) => matches(p, want) && !claimedByOther(p, want))) : null;
    if (id != null) assign(id, e);
    else unmatched.push(e);
  }
  return { byId, unmatched, loaded: true };
}

/** Mantra roles in words (title of the role badge). */
export const MANTRA_NAMES = {
  Por: "Portiere",
  Dc: "Difensore centrale",
  Dd: "Difensore destro",
  Ds: "Difensore sinistro",
  B: "Braccetto",
  E: "Esterno",
  M: "Mediano",
  C: "Centrocampista",
  T: "Trequartista",
  W: "Ala",
  A: "Attaccante",
  Pc: "Punta centrale",
};
