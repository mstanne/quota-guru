import { TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useBetSlip } from "../context/BetSlipContext";
import { getOperator, type OperatorData } from "../data/operators";
import { bestEntry, formatOdd, placeholderOdds, type OddsByOperator } from "../lib/odds";

// Featured events. Each outcome references the operator offering the best odd (`operatorId`);
// `odds` holds every comparison operator's value (number or placeholder such as "[QUOTA_1]").
export interface FeaturedMatch {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  isLive: boolean;
  odds: OddsByOperator;
}

const defaultFeaturedMatches: FeaturedMatch[] = [
  {
    id: "1",
    competition: "[COMPETIZIONE]",
    homeTeam: "[SQUADRA_CASA]",
    awayTeam: "[SQUADRA_OSPITE]",
    time: "[DATA_ORA]",
    isLive: false,
    odds: placeholderOdds({ home: "[QUOTA_1]", draw: "[QUOTA_X]", away: "[QUOTA_2]" }),
  },
  {
    id: "2",
    competition: "[COMPETIZIONE]",
    homeTeam: "[SQUADRA_CASA]",
    awayTeam: "[SQUADRA_OSPITE]",
    time: "[DATA_ORA]",
    isLive: false,
    odds: placeholderOdds({ home: "[QUOTA_1]", draw: "[QUOTA_X]", away: "[QUOTA_2]" }),
  },
  {
    id: "3",
    competition: "[COMPETIZIONE]",
    homeTeam: "[SQUADRA_CASA]",
    awayTeam: "[SQUADRA_OSPITE]",
    time: "[DATA_ORA]",
    isLive: false,
    odds: placeholderOdds({ home: "[QUOTA_1]", draw: "[QUOTA_X]", away: "[QUOTA_2]" }),
  },
];

const OUTCOME: Record<"1" | "X" | "2", "home" | "draw" | "away"> = { "1": "home", X: "draw", "2": "away" };

interface HeroSectionProps {
  matches?: FeaturedMatch[];
  resolveOperator?: (id: string) => OperatorData;
}

export function HeroSection({ matches = defaultFeaturedMatches, resolveOperator = getOperator }: HeroSectionProps) {
  const { addSelection } = useBetSlip();
  const handleOddsClick = (match: FeaturedMatch, betType: "1" | "X" | "2") => {
    const betTypeLabels = {
      1: `Vincente ${match.homeTeam}`,
      X: "Pareggio",
      2: `Vincente ${match.awayTeam}`,
    };
    const outcome = OUTCOME[betType];
    const best = bestEntry(match.odds, outcome);
    const allBookmakers = Object.entries(match.odds).map(([operatorId, o]) => ({ operatorId, odds: o[outcome] }));
    addSelection({
      id: `${match.id}-${betType}`,
      matchId: match.id,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      time: match.time,
      betType: betType,
      betTypeLabel: betTypeLabels[betType],
      selectedBookmaker: best.operatorId,
      selectedOdds: best.value,
      allBookmakers,
    });
  };
  const heroAria = (match: FeaturedMatch, betType: "1" | "X" | "2") => {
    const best = bestEntry(match.odds, OUTCOME[betType]);
    const what =
      betType === "1" ? `${match.homeTeam} vincente` : betType === "2" ? `${match.awayTeam} vincente` : "pareggio";
    return `Aggiungi alla schedina: ${what} a ${formatOdd(best.value)} su ${resolveOperator(best.operatorId).name} (quota migliore)`;
  };
  return (
    <div className="bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-white text-3xl sm:text-4xl mb-3">
            <TrendingUp className="inline-block w-7 h-7 text-slate-300 mr-2 align-[-0.1em]" aria-hidden="true" />
            Le migliori quote sportive a confronto
          </h1>
          <p className="text-slate-400 text-lg">
            Confronta le quote degli operatori autorizzati e trova la più alta per ogni esito
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="bg-slate-800 border-slate-700 hover:border-slate-500 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {match.competition}
                  </Badge>
                  {match.isLive && <Badge className="bg-live text-white animate-pulse">LIVE</Badge>}
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">{match.homeTeam}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">{match.awayTeam}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4">{match.time}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    type="button"
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    aria-label={heroAria(match, "1")}
                    onClick={() => handleOddsClick(match, "1")}
                  >
                    <span className="block text-slate-400 text-xs mb-1">1</span>
                    <span className="block text-best tabular-nums">
                      {formatOdd(bestEntry(match.odds, "home").value)}
                    </span>
                    <span className="block text-slate-400 text-sm mt-1 truncate">
                      {resolveOperator(bestEntry(match.odds, "home").operatorId).name}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    aria-label={heroAria(match, "X")}
                    onClick={() => handleOddsClick(match, "X")}
                  >
                    <span className="block text-slate-400 text-xs mb-1">X</span>
                    <span className="block text-best tabular-nums">
                      {formatOdd(bestEntry(match.odds, "draw").value)}
                    </span>
                    <span className="block text-slate-400 text-sm mt-1 truncate">
                      {resolveOperator(bestEntry(match.odds, "draw").operatorId).name}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    aria-label={heroAria(match, "2")}
                    onClick={() => handleOddsClick(match, "2")}
                  >
                    <span className="block text-slate-400 text-xs mb-1">2</span>
                    <span className="block text-best tabular-nums">
                      {formatOdd(bestEntry(match.odds, "away").value)}
                    </span>
                    <span className="block text-slate-400 text-sm mt-1 truncate">
                      {resolveOperator(bestEntry(match.odds, "away").operatorId).name}
                    </span>
                  </button>
                </div>
                <Button className="w-full bg-action hover:bg-action-hover text-action-foreground">
                  Dettagli partita
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
