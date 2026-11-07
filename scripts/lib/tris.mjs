// The threes ("tris"): the three matches where the football model is most sure of one outcome, and the chance that
// all three come in, the product, much lower than each one. Informative: it shows how quickly "sure" outcomes stop
// being sure when put together.
//
// One place for the rules, shared by the site (scripts/derive-tris.mjs → /pronostici/tris) and the Telegram channel
// (scripts/telegram/rubriche.mjs), so both show the same three matches:
//   weekend  on Saturday, Saturday and Sunday matches of the five top leagues
//   cups     one per cup, on the first day of each matchweek (Champions: Tuesday and Wednesday together)
// The site build locks each three in the predictions archive (`archivio-pronostici` branch, tris.json) at its first
// build of that day; Telegram posts the locked three and picks its own only if the lock is missing.
//
// `entries` are predictions archive entries (scripts/archive-predictions.mjs):
//   { id, kickoff, label: "Home – Away", where: competition name, path, prediction: { p: [1, X, 2] }, hit?, result?, void? }

export const TRIS = {
  "tris-weekend": {
    slug: "weekend",
    title: "Il tris del weekend",
    short: "Weekend",
    emoji: "🎯",
    leagues: ["Serie A", "Premier League", "LaLiga", "Bundesliga", "Ligue 1"],
    days: [6],
    min: 6,
    when: "il sabato mattina, con le partite di sabato e domenica di Serie A, Premier League, LaLiga, Bundesliga e Ligue 1",
  },
  "tris-champions": {
    slug: "champions-league",
    title: "Il tris di Champions",
    short: "Champions League",
    emoji: "🏆",
    leagues: ["Champions League"],
    cup: true,
    days: [2, 3],
    min: 4,
    when: "il martedì mattina di ogni giornata, con le partite di martedì e mercoledì",
  },
  "tris-europa-league": {
    slug: "europa-league",
    title: "Il tris di Europa League",
    short: "Europa League",
    emoji: "🟠",
    leagues: ["Europa League"],
    cup: true,
    days: [3, 4],
    min: 4,
    when: "la mattina del primo giorno di ogni giornata",
  },
  "tris-conference": {
    slug: "conference-league",
    title: "Il tris di Conference",
    short: "Conference League",
    emoji: "🟢",
    leagues: ["Conference League"],
    cup: true,
    days: [3, 4],
    min: 4,
    when: "la mattina del primo giorno di ogni giornata",
  },
};
export const TRIS_IDS = Object.keys(TRIS);

// ---------------------------------------------------------------------------------------------- Rome time
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function romeParts(ms) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: WEEKDAYS[p.weekday] };
}
const offset = (ms) => {
  const r = romeParts(ms);
  return Math.round((Date.parse(`${r.day}T${r.time}:00Z`) - Math.floor(ms / 60000) * 60000) / 60000);
};
/** Instant of a Rome calendar day at midnight. */
function romeMidnight(day) {
  const guess = Date.parse(`${day}T00:00:00Z`);
  const ms = guess - offset(guess) * 60000;
  return ms - (offset(ms) - offset(guess)) * 60000;
}
const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------------------------- selection
const maxP = (e) => Math.max(...e.prediction.p);
const topOf = (p) => p.indexOf(Math.max(...p));
const SIGNS = ["1", "X", "2"];

/** "vittoria Inter", "pareggio". */
export function outcomeText(label, index) {
  const [home, away] = label.split(" – ");
  return index === 1 ? "pareggio" : `vittoria ${index === 0 ? home : away}`;
}

/**
 * The three of `id` for the Rome day of `nowMs`, or null when none is due that day (wrong weekday, not the first day
 * of a cup matchweek, too few matches with a prediction).
 * `currentIds`: ids of the matches in the current data (archive entries of matches no longer there are skipped).
 */
export function chooseTris(id, entries, { nowMs, currentIds }) {
  const t = TRIS[id];
  const { day: today, weekday } = romeParts(nowMs);
  if (!t.days.includes(weekday)) return null;
  const leagues = new Set(t.leagues);
  const open = (e) => !e.void && e.prediction?.p && (!currentIds || currentIds.has(e.id)) && leagues.has(e.where);
  const start = romeMidnight(today);
  if (t.cup) {
    // first day of the matchweek: matches today, none in the three days before
    const before = romeMidnight(addDays(today, -3));
    if (!entries.some((e) => open(e) && romeParts(Date.parse(e.kickoff)).day === today)) return null;
    if (entries.some((e) => leagues.has(e.where) && Date.parse(e.kickoff) >= before && Date.parse(e.kickoff) < start))
      return null;
  }
  const end = romeMidnight(addDays(today, 2));
  const list = entries.filter((e) => open(e) && Date.parse(e.kickoff) > nowMs && Date.parse(e.kickoff) < end);
  if (list.length < t.min) return null;
  const three = [...list]
    .sort((a, b) => maxP(b) - maxP(a) || a.kickoff.localeCompare(b.kickoff) || a.id - b.id)
    .slice(0, 3)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id - b.id);
  return lockOf(id, today, three, nowMs);
}

/** The record kept in tris.json: enough to show and grade the three even after the matches leave the data. */
export function lockOf(id, day, three, nowMs) {
  const picks = three.map((e) => {
    const index = topOf(e.prediction.p);
    return {
      id: e.id,
      kickoff: e.kickoff,
      label: e.label,
      where: e.where,
      path: e.path,
      index,
      sign: SIGNS[index],
      outcome: outcomeText(e.label, index),
      p: e.prediction.p[index],
    };
  });
  return {
    id,
    day,
    locked: new Date(nowMs).toISOString(),
    picks,
    all: picks.reduce((x, e) => x * e.p, 1),
  };
}

export const lockKey = (id, day) => `${id}/${day}`;
export const romeDayOf = (ms) => romeParts(ms).day;
