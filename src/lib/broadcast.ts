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
// Ligue 1, Eredivisie, Primeira Liga, Championship and Brasileirão: no verified 2026/27 deal, so nothing is shown.

export const BROADCAST_SEASON = "2026/27";

export interface Broadcast {
  /** e.g. "DAZN e Sky" */
  channels: string;
  /** when the channel of this match is not settled by the deal */
  note?: string;
}

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
 */
export function footballBroadcast(competitionSlug: string, utcDate: string, roundDates: string[] = []): Broadcast | null {
  const { day } = romeParts(utcDate);
  switch (competitionSlug) {
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
      return { channels: "DAZN" };
    default:
      return null;
  }
}

/** NBA games in Italy: Sky shows a selection, NBA League Pass all of them. */
export const nbaBroadcast = (): Broadcast => ({
  channels: "NBA League Pass",
  note: "Una selezione delle partite è anche su Sky Sport Basket e NOW.",
});
