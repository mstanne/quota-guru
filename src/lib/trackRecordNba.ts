// NBA track record from the snapshot (see ./trackRecord.ts).
import { gamePath, nbaGames } from "./basket";
import { basketPredictionFor } from "./basketPredict";
import { archivedTrackRecord, summarize, type TrackEntry, type TrackRecord } from "./trackRecord";

let nba: TrackRecord | null = null;
export function nbaTrackRecord(): TrackRecord {
  if (nba) return nba;
  const fromArchive = archivedTrackRecord("nba");
  if (fromArchive) return (nba = fromArchive);
  const entries: TrackEntry[] = [];
  for (const g of nbaGames) {
    const p = basketPredictionFor(g.id);
    if (!p || !p.pre || g.status !== "final" || g.score.home == null || g.score.away == null) continue;
    const winner = g.score.home > g.score.away ? 0 : 1;
    const name = (i: number) => (i === 0 ? g.home : g.away).shortName ?? (i === 0 ? g.home : g.away).name;
    entries.push({
      key: `b${g.id}`,
      path: gamePath(g),
      label: `${name(0)} – ${name(1)}`,
      where: "NBA",
      utcDate: g.utcDate,
      pick: `${p.fav === 0 ? "1" : "2"} · ${name(p.fav)}`,
      prob: p.p[p.fav],
      result: `${g.score.home}-${g.score.away}`,
      hit: winner === p.fav,
    });
  }
  return (nba = summarize(entries));
}
