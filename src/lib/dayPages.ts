// "Pronostici di oggi" / "Pronostici di domani": every match of one Italian calendar day with a prediction,
// football and NBA. The day is taken from the build time (src/lib/footballCore.ts referenceTime), so the
// pre-rendered page and the browser agree; the page is rebuilt with every data update (every 3 hours) and its
// title names the date, so a page built late in the evening is never ambiguous.
import { allMatches, formatDay, isFinished, referenceTime, romeDay } from "./football";
import { predictionFor } from "./predictions";
import { nbaGames } from "./basket";
import { basketPredictionFor } from "./basketPredict";
import type { RouteMeta } from "../routes";

export type DayKey = "oggi" | "domani";
export const dayPath = (d: DayKey) => `/pronostici/${d}`;

/** ISO date of the day ("2026-10-27") and a noon timestamp of it, for formatting. */
export function dayOf(d: DayKey) {
  const iso = romeDay(new Date(referenceTime + (d === "domani" ? 86400000 : 0)).toISOString());
  return { iso, label: formatDay(`${iso}T12:00:00Z`) };
}

export function dayMatches(d: DayKey) {
  const { iso } = dayOf(d);
  const football = allMatches.filter(({ match }) => romeDay(match.utcDate) === iso && predictionFor(match.id));
  const nba = nbaGames.filter((g) => romeDay(g.utcDate) === iso && basketPredictionFor(g.id));
  return { football, nba, played: football.filter(({ match }) => isFinished(match)).length };
}

export function dayMeta(d: DayKey): RouteMeta {
  const { label } = dayOf(d);
  const { football, nba } = dayMatches(d);
  const n = football.length + nba.length;
  const comps = [...new Set(football.map(({ competition }) => competition.name))].slice(0, 4);
  return {
    path: dayPath(d),
    title: `Pronostici ${d === "oggi" ? "di oggi" : "di domani"}, ${label}: calcio e NBA`,
    description: n
      ? `${n} pronostici per ${label}: probabilità 1X2, Under/Over e Goal${comps.length ? ` per ${comps.join(", ")}` : ""}${nba.length ? ` e ${nba.length} partite NBA` : ""}, calcolate da un modello statistico.`
      : `I pronostici del modello statistico per le partite di calcio e NBA di ${label}.`,
    // nothing to show: reachable but kept out of the index until there are matches again
    index: n > 0,
  };
}

export const dayRoutes = (): RouteMeta[] => [dayMeta("oggi"), dayMeta("domani")];
