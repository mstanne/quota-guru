// Odds block for match pages: renders the operators' odds (src/lib/oddsFeed.ts) next to the model's estimate.
// Renders nothing while no feed is connected.
import { OddsComparison, type Outcome } from "./OddsComparison";
import { marketOdds, type OddsSport } from "../../lib/oddsFeed";

export function MatchOddsSlot({
  sport,
  id,
  home,
  away,
  competition,
  time,
}: {
  sport: OddsSport;
  id: number;
  home: string;
  away: string;
  competition: string;
  time: string;
}) {
  const market = sport === "football" ? "1x2" : "win";
  const data = marketOdds(sport, id, market);
  if (!data) return null;
  const outcomes: Outcome[] =
    sport === "football"
      ? [
          { key: "home", label: `1 (${home})`, selection: `${home} vincente` },
          { key: "draw", label: "X", selection: "Pareggio" },
          { key: "away", label: `2 (${away})`, selection: `${away} vincente` },
        ]
      : [
          { key: "home", label: `1 (${home})`, selection: `${home} vincente` },
          { key: "away", label: `2 (${away})`, selection: `${away} vincente` },
        ];
  return (
    <OddsComparison
      outcomes={outcomes}
      odds={data.odds}
      event={{ id: `${sport}-${id}`, home, away, competition, time }}
      market={sport === "football" ? "Esito finale 1X2" : "Testa a testa"}
    />
  );
}
