// Player names and page URLs, shared by the build scripts (scripts/derive-players.mjs) and the site (src/lib/players.ts).
// API-Football names are often abbreviated ("L. Martínez"): the page uses the first given name and the surname
// ("Lautaro Martínez") in that case, the API name otherwise ("Vinícius Júnior").

const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** @param {{ name: string, first?: string | null, last?: string | null }} p */
export function playerName(p) {
  const abbreviated = /(^|\s)\p{Lu}\.\s/u.test(`${p.name} `) || /^\p{Lu}\.\S/u.test(p.name ?? "");
  if (abbreviated && p.first && p.last) return `${p.first.split(/\s+/)[0]} ${p.last}`;
  return p.name || [p.first, p.last].filter(Boolean).join(" ");
}

export const PLAYER_BASE = "/calcio/giocatori";

/** Page URL: name plus the API-Football id, unique and stable ("/calcio/giocatori/lautaro-martinez-217"). */
export const playerUrl = (p) => `${PLAYER_BASE}/${slugify(playerName(p)) || "giocatore"}-${p.id}`;

/** Data file of a player (the data is split in 32 parts, so a page loads only its own part). */
export const playerPart = (id) => Number(id) % 32;

// NBA players: /basket/nba/giocatori/<name>-<API-NBA id> (API-NBA ids, a different numbering from API-Football)
export const NBA_PLAYER_BASE = "/basket/nba/giocatori";
export const nbaPlayerUrl = (p) => `${NBA_PLAYER_BASE}/${slugify(p.name) || "giocatore"}-${p.id}`;
/** Data file of an NBA player (8 parts: a page loads only its own). */
export const nbaPlayerPart = (id) => Number(id) % 8;
