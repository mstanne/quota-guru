// Names of football clubs as shown to readers: the full name Italians use ("Atlético Madrid", "Barcellona"),
// never the source's nicknames or abbreviations ("Atleti", "Barça", "Man United", "S. Praha").
//
// Plain JavaScript shared by the site and the scripts (Telegram posts, images, editorial texts).
// Only the display changes: the data keep their short names, which build the URLs (footballCore.ts, TEAM_SLUGS)
// and must never change. Every club not listed shows its short name as it is.
// The list is in team-full-names.json (also read by the video scripts, scripts/guide-videos).
// Add a line there when a club's short name is a nickname, an abbreviation or an English/local form Italians don't use.

import full from "./team-full-names.json" with { type: "json" };

/** Short name in the data → name shown on the site, on the Telegram channel and in the videos (team-full-names.json). */
const FULL = full;

/** Name to show for a club's short name in the data ("Atleti" → "Atlético Madrid"). */
export const fullName = (short) => (Object.hasOwn(FULL, short) ? FULL[short] : short);

/** Name to show for a club: its full Italian name, else its short name, else the official name. */
export const teamName = (t) => (t.shortName ? fullName(t.shortName) : t.name);

/** A "Casa – Trasferta" label built from the short names (archive, tris, multiple) with the names to show. */
export const fullLabel = (label) =>
  String(label)
    .split(" – ")
    .map((s) => fullName(s))
    .join(" – ");

/**
 * The same data with the clubs' full names in every `label` ("Atleti – Viking" → "Atlético Madrid – Viking",
 * "2 · Barça" → "2 · Barcellona"): the archive, the tris and the multiples keep the short names of the data, readers
 * see the full ones. Ids, paths and keys are left as they are.
 */
export function withFullNames(x) {
  if (Array.isArray(x)) return x.map(withFullNames);
  if (!x || typeof x !== "object") return x;
  const out = {};
  for (const [k, v] of Object.entries(x)) {
    if (k === "label" && typeof v === "string") {
      const pick = /^([12X]) · (.+)$/.exec(v);
      out[k] = pick ? `${pick[1]} · ${fullName(pick[2])}` : fullLabel(v);
    } else out[k] = withFullNames(v);
  }
  return out;
}
