// Strength ranking of the clubs (/calcio/ranking-squadre): the attack and defence ratings of the prediction model on a
// common scale (written by scripts/predict-football.mjs into src/data/football-season-sim.json), see seasonOutlook.ts.
import { competitionDef } from "./competitionKinds";
import { simGeneratedAt, strengthRanking } from "./seasonOutlook";

export const strengthRankingPath = "/calcio/ranking-squadre";
export const strengthUpdatedAt = simGeneratedAt;

export interface RankedClub {
  rank: number;
  id: number;
  name: string;
  league: { slug: string; name: string };
  gf: number;
  ga: number;
  gd: number;
}

/** The ranking with names and leagues (clubs without a page are kept with their id). */
export function rankedClubs(): RankedClub[] {
  return strengthRanking().map((t, i) => ({
    rank: i + 1,
    id: t.id,
    name: t.name,
    league: { slug: t.league, name: competitionDef(t.league)?.name ?? t.league },
    gf: t.gf,
    ga: t.ga,
    gd: t.gd,
  }));
}

export const hasStrengthRanking = () => strengthRanking().length >= 20;

export function strengthRankingMeta() {
  const top = rankedClubs().slice(0, 3);
  return {
    path: strengthRankingPath,
    title: "Ranking squadre di calcio: le più forti secondo il modello",
    description: `Le squadre più forti d'Europa e del Brasile secondo il nostro modello statistico${
      top.length ? `: ${top.map((t) => t.name).join(", ")} in testa` : ""
    }. Gol attesi fatti e subiti contro una squadra media, aggiornati dopo ogni giornata.`,
  };
}
