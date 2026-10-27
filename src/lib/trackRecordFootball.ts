// Football track record from the snapshot (see ./trackRecord.ts).
import { allMatches, isFinished, matchPath } from "./football";
import { predictionFor } from "./predictions";
import { summarize, type TrackEntry, type TrackRecord } from "./trackRecord";

let football: TrackRecord | null = null;
export function footballTrackRecord(): TrackRecord {
  if (football) return football;
  const entries: TrackEntry[] = [];
  for (const { competition: c, match: m } of allMatches) {
    const p = predictionFor(m.id);
    const ft = m.score.fullTime;
    if (!p || !p.pre || p.confidence === "bassa" || !isFinished(m) || ft.home == null || ft.away == null) continue;
    const top = p.p.indexOf(Math.max(...p.p));
    const outcome = ft.home > ft.away ? 0 : ft.home === ft.away ? 1 : 2;
    const names = [m.homeTeam.shortName, "pareggio", m.awayTeam.shortName];
    entries.push({
      key: `f${m.id}`,
      path: matchPath(c, m),
      label: `${m.homeTeam.shortName} – ${m.awayTeam.shortName}`,
      where: c.name,
      utcDate: m.utcDate,
      pick: `${["1", "X", "2"][top]} · ${names[top]}`,
      prob: p.p[top],
      result: `${ft.home}-${ft.away}`,
      hit: top === outcome,
    });
  }
  return (football = summarize(entries));
}

