// Where a match is shown in Italy, from the TV rights deals of the 2026/27 season (no data feed has the channels).
// Only what the deals settle is said: when the channel of one match depends on a weekly choice (the Champions
// League match on Prime Video, the NBA games on Sky) the text says so instead of guessing.
// Check at the start of every season (rights change hands): sources in the pull request that added this file.
//   Serie A      DAZN all 380 matches; Sky 3 per round, co-exclusive, in fixed slots: Saturday 20:45, Sunday 18:00,
//                Monday 20:45 (contract to 2028/29). Rounds without one of those slots (no Monday match, midweek
//                rounds) have a Sky match elsewhere that the deal does not name: the page then says so.
//   Serie B      DAZN and Prime Video (LaB Channel)
//   Champions    Sky and NOW 185 of 203 matches, final included; Prime Video the best Wednesday match (18)
//   Europa League, Conference League   Sky and NOW, every match
//   Premier League, Bundesliga   Sky and NOW;   LaLiga   DAZN
//   NBA          Sky Sport Basket and NOW a selection of games; every game on NBA League Pass
//   National teams  every match of Italy on Rai 1 and RaiPlay; Nations League 2026/27: Sky and NOW hold the rights
//                and show a selection of the other matches (some free-to-air on TV8 or Mediaset), so the page says to
//                check the schedule (Calcio e Finanza, 1 October 2026). Other national-team competitions: not shown.
//   Coppa Italia, Supercoppa Italiana   Mediaset (Canale 5, Italia 1, Mediaset Infinity), deal 2024/25–2026/27
//   FA Cup       DAZN and Eurosport (Discovery+), co-exclusive, to 2027/28 (not every match: the page says to check)
//   Copa del Rey DAZN, to 2028/29;   Supercopa de España   free streaming on Cronache di Spogliatoio
//                (Calcio e Finanza, 20 June 2026 and 4 November 2025)
// Ligue 1, Eredivisie, Primeira Liga, Championship, Brasileirão, the other national cups and super cups and the lower
// divisions: no verified 2026/27 deal, so nothing is shown.

export const BROADCAST_SEASON = "2026/27";

export interface Broadcast {
  /** e.g. "DAZN e Sky" */
  channels: string;
  /** when the channel of this match is not settled by the deal */
  note?: string;
  /** set when the channels come from the broadcasters' schedule checked by the daily agent (src/data/tv-schedule.json) */
  verifiedAt?: string;
}

/**
 * One match in the broadcasters' schedule, written by the daily agent (scripts/offers-agent/ISTRUZIONI.md) after
 * reading the official schedules: it replaces what the rights deals say. Keyed by the dated match path
 * ("/calcio/serie-a/inter-como-2026-11-08", "/basket/nba/lakers-celtics-2026-11-08").
 */
export interface ScheduleEntry {
  channels: string;
  /** official page the channels were read from */
  source: string;
  /** YYYY-MM-DD */
  verifiedAt: string;
}
export interface TvSchedule {
  football: Record<string, ScheduleEntry>;
  nba: Record<string, ScheduleEntry>;
}
/** The schedule entry wins over the rights deal. */
export const withSchedule = (entry: ScheduleEntry | undefined, fallback: Broadcast | null): Broadcast | null =>
  entry ? { channels: entry.channels, verifiedAt: entry.verifiedAt } : fallback;

/** Channel names allowed in the schedule (scripts/tv-schedule.mjs check): one spelling each. */
export const CHANNELS = [
  "DAZN",
  "Sky",
  "NOW",
  "Prime Video",
  "LaB Channel",
  "Rai 1",
  "Rai 2",
  "Rai Sport",
  "RaiPlay",
  "Canale 5",
  "Italia 1",
  "Mediaset Infinity",
  "TV8",
  "Sportitalia",
  "Sky Sport Basket",
  "NBA League Pass",
  "Ligue 1+",
  "OneFootball",
  "Eurosport",
  "Discovery+",
  "Cronache di Spogliatoio",
];

/** Who holds the rights of each competition in Italy, in one line (TV guide page). */
export const COMPETITION_RIGHTS: { slug: string; name: string; text: string }[] = [
  { slug: "serie-a", name: "Serie A", text: "tutte le 380 partite su DAZN; 3 partite per giornata anche su Sky, in co-esclusiva" },
  { slug: "serie-b", name: "Serie B", text: "tutte le partite su DAZN e Prime Video (LaB Channel)" },
  { slug: "champions-league", name: "Champions League", text: "Sky e NOW, finale compresa; la miglior partita del mercoledì in esclusiva su Prime Video" },
  { slug: "europa-league", name: "Europa League", text: "tutte le partite su Sky e NOW" },
  { slug: "conference-league", name: "Conference League", text: "tutte le partite su Sky e NOW" },
  { slug: "premier-league", name: "Premier League", text: "Sky e NOW" },
  { slug: "bundesliga", name: "Bundesliga", text: "Sky e NOW" },
  { slug: "liga", name: "LaLiga", text: "DAZN" },
  { slug: "coppa-italia", name: "Coppa Italia", text: "Mediaset: in chiaro su Canale 5 o Italia 1 e in streaming su Mediaset Infinity" },
  { slug: "supercoppa-italiana", name: "Supercoppa Italiana", text: "Mediaset, in chiaro su Canale 5 e su Mediaset Infinity" },
  { slug: "fa-cup", name: "FA Cup", text: "DAZN ed Eurosport (Discovery+), in co-esclusiva" },
  { slug: "copa-del-rey", name: "Copa del Rey", text: "DAZN" },
  { slug: "supercopa-de-espana", name: "Supercopa de España", text: "in streaming gratis su Cronache di Spogliatoio" },
  {
    slug: "nations-league",
    name: "Nations League",
    text: "le partite dell'Italia su Rai 1 e RaiPlay; le altre su Sky e NOW (una selezione), alcune in chiaro su TV8 o Mediaset",
  },
];

const romeParts = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: get("weekday"), time: `${get("hour")}:${get("minute")}` };
};

/** Sky's three Serie A slots of a weekend round. */
const SKY_SERIE_A = new Set(["Sat 20:45", "Sun 18:00", "Mon 20:45"]);

/**
 * Channels of a football match in Italy, or null when the 2026/27 deal of its competition is not known.
 * `roundDates`: kick-offs of every match of the same round (Serie A: Sky's three matches are known for sure only when
 * the round fills its three slots; otherwise the other matches say that Sky may show one of them).
 * `teams`: names of the two teams (national teams: Italy's matches are on Rai whatever the competition).
 * `national`: the competition is one of national teams.
 */
export function footballBroadcast(
  competitionSlug: string,
  utcDate: string,
  roundDates: string[] = [],
  teams: string[] = [],
  national = false,
): Broadcast | null {
  const { day } = romeParts(utcDate);
  if (national && teams.includes("Italia")) return { channels: "Rai 1 e RaiPlay" };
  switch (competitionSlug) {
    case "nations-league":
      return {
        channels: "Sky e NOW",
        note: "Sky trasmette una selezione delle partite tra nazionali straniere, alcune in chiaro su TV8 o Mediaset: controlla il palinsesto.",
      };
    case "serie-a": {
      const slot = (d: string) => {
        const p = romeParts(d);
        return SKY_SERIE_A.has(`${p.day} ${p.time}`);
      };
      if (slot(utcDate)) return { channels: "DAZN e Sky" };
      const inSlots = roundDates.filter(slot).length;
      return inSlots >= 3
        ? { channels: "DAZN" }
        : { channels: "DAZN", note: "Sky trasmette anche 3 partite di ogni giornata: controlla il palinsesto Sky per sapere se c'è anche questa." };
    }
    case "serie-b":
      return { channels: "DAZN e Prime Video (LaB Channel)" };
    case "champions-league":
      return day === "Wed"
        ? { channels: "Sky e NOW", note: "La miglior partita del mercoledì è in esclusiva su Prime Video." }
        : { channels: "Sky e NOW" };
    case "europa-league":
    case "conference-league":
    case "premier-league":
    case "bundesliga":
      return { channels: "Sky e NOW" };
    case "liga":
    case "copa-del-rey":
      return { channels: "DAZN" };
    case "coppa-italia":
      return {
        channels: "Canale 5, Italia 1 e Mediaset Infinity",
        note: "Mediaset trasmette tutta la Coppa Italia in chiaro: controlla il palinsesto per sapere su quale dei due canali.",
      };
    case "supercoppa-italiana":
      return { channels: "Canale 5 e Mediaset Infinity" };
    case "fa-cup":
      return {
        channels: "DAZN ed Eurosport",
        note: "DAZN ed Eurosport (Discovery+) trasmettono una selezione delle partite di ogni turno: controlla il palinsesto.",
      };
    case "supercopa-de-espana":
      return { channels: "Cronache di Spogliatoio", note: "In streaming gratuito." };
    default:
      return null;
  }
}

/** NBA games in Italy: Sky shows a selection, NBA League Pass all of them. */
export const nbaBroadcast = (): Broadcast => ({
  channels: "NBA League Pass",
  note: "Una selezione delle partite è anche su Sky Sport Basket e NOW.",
});
