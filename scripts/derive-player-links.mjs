// Player ids for the match details saved before the ids were kept (runs at every build, no network).
// The match pages link every player name to the player's page through the API-Football id that the details now
// carry (scripts/lib/match-details.mjs: line-ups, events, best player). Details saved earlier have names only: this
// script finds the id in the squad of the same club and season (data/team-seasons-api.json) and writes it into
// src/data/football-details.json. A name is matched only when exactly one player of that squad fits it; otherwise
// it stays without a link.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return fallback;
  }
};

// letters that do not decompose into a plain letter plus an accent
const LETTERS = { ł: "l", Ł: "L", ø: "o", Ø: "O", đ: "d", Đ: "D", ß: "ss", þ: "th", Þ: "Th", æ: "ae", Æ: "Ae", ı: "i", ð: "d" };
const norm = (s) =>
  String(s ?? "")
    .replace(/[łŁøØđĐßþÞæÆıð]/g, (c) => LETTERS[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Finds a player of `squad` ({ id, name, first, last }[]) from a name as API-Football writes it in matches:
 * "G. Scamacca", "Daniel Maldini", "Vinícius Júnior". Returns the id only when exactly one player fits.
 */
export function matchPlayer(name, squad) {
  const n = norm(name);
  if (!n || !squad?.length) return null;
  const one = (list) => (list.length === 1 ? list[0].id : null);
  // 1. same name as in the squad list
  const exact = squad.filter((p) => norm(p.name) === n);
  if (exact.length) return one(exact);
  // 2. full name ("Daniel Maldini") or first given name and surname
  const full = squad.filter((p) => {
    const first = norm(p.first);
    const last = norm(p.last);
    return last && (n === `${first} ${last}` || n === `${first.split(" ")[0]} ${last}`);
  });
  if (full.length) return one(full);
  // 3. initial and surname ("D. Maldini") or surname alone, against the surname of the squad
  const m = n.match(/^(?:([a-z])\.? )?(.+)$/);
  const initial = m?.[1] ?? null;
  const surname = m?.[2] ?? n;
  const bySurname = squad.filter((p) => {
    const last = norm(p.last);
    const listed = norm(p.name).replace(/^[a-z]\. /, "");
    const fits =
      last === surname || last.endsWith(` ${surname}`) || last.startsWith(`${surname} `) || listed === surname || listed.endsWith(` ${surname}`);
    return fits && (!initial || norm(p.first).startsWith(initial) || norm(p.name).startsWith(initial));
  });
  return one(bySurname);
}

function main() {
  const file = path.join(root, "src", "data", "football-details.json");
  const details = read("src/data/football-details.json", {});
  const football = read("src/data/football.json", { competitions: [] });
  const api = read("data/team-seasons-api.json", { football: {} });
  const seasonOf = (date, code) => {
    const y = Number(date.slice(0, 4));
    return code === "BSA" ? y : Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  };
  let filled = 0;
  let missing = 0;
  for (const c of football.competitions ?? [])
    for (const m of c.matches ?? []) {
      const d = details[m.id];
      if (!d) continue;
      const y = seasonOf(m.utcDate, c.code);
      const squad = { home: api.football?.[`${m.homeTeam.id}-${y}`], away: api.football?.[`${m.awayTeam.id}-${y}`] };
      // the club's own squad; own goals may be filed under either club, so they look in both
      const both = [...(squad.home ?? []), ...(squad.away ?? [])];
      const find = (name, side, anySide) => matchPlayer(name, anySide ? both : squad[side]);
      const set = (obj, key, name, side, anySide = false) => {
        if (obj[key] !== undefined && obj[key] !== null) return;
        if (!name) return;
        const id = find(name, side, anySide);
        if (id != null) (obj[key] = id), filled++;
        else missing++;
      };
      for (const side of ["home", "away"]) {
        const l = d.lineups?.[side];
        for (const p of [...(l?.starters ?? []), ...(l?.bench ?? [])]) set(p, "id", p.name, side);
      }
      for (const e of d.timeline ?? []) {
        set(e, "playerId", e.player, e.side, e.detail === "Own Goal");
        set(e, "otherId", e.other, e.side);
      }
      if (d.top) set(d.top, "id", d.top.name, d.top.side);
    }
  if (filled) fs.writeFileSync(file, JSON.stringify(details) + "\n");
  console.log(`Id dei giocatori nelle partite già scaricate: ${filled} trovati, ${missing} senza corrispondenza sicura.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
