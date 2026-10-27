// NBA "Perché questo pronostico" points: joins the prediction with the recent results in the snapshot.
import { nbaRecentRecord, type BasketGame } from "./basket";
import type { BasketPrediction } from "./basketPredict";
import { nbaReasons } from "./predictionReasons";

export function nbaReasonsFor(g: BasketGame, p: BasketPrediction): string[] {
  return nbaReasons({
    home: g.home.shortName ?? g.home.name,
    away: g.away.shortName ?? g.away.name,
    pts: p.pts,
    fav: p.fav,
    b2b: p.b2b,
    record: [nbaRecentRecord(g.home.id, g.utcDate), nbaRecentRecord(g.away.id, g.utcDate)],
  });
}
