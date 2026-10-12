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
  return (
    <div className="bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h1 className="text-white text-3xl sm:text-4xl">Le Migliori Quote Sportive</h1>
          </div>
          <p className="text-slate-400 text-lg">Confronta in tempo reale e trova sempre la quota più alta</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="bg-slate-800 border-slate-700 hover:border-green-500 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {match.competition}
                  </Badge>
                  {match.isLive && <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>}
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
                  <div
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => handleOddsClick(match, "1")}
                  >
                    <div className="text-slate-400 text-xs mb-1">1</div>
                    <div className="text-green-500">{formatOdd(bestEntry(match.odds, "home").value)}</div>
                    <div className="text-slate-500 text-xs mt-1 truncate">
                      {resolveOperator(bestEntry(match.odds, "home").operatorId).name}
                    </div>
                  </div>
                  <div
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => handleOddsClick(match, "X")}
                  >
                    <div className="text-slate-400 text-xs mb-1">X</div>
                    <div className="text-green-500">{formatOdd(bestEntry(match.odds, "draw").value)}</div>
                    <div className="text-slate-500 text-xs mt-1 truncate">
                      {resolveOperator(bestEntry(match.odds, "draw").operatorId).name}
                    </div>
                  </div>
                  <div
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => handleOddsClick(match, "2")}
                  >
                    <div className="text-slate-400 text-xs mb-1">2</div>
                    <div className="text-green-500">{formatOdd(bestEntry(match.odds, "away").value)}</div>
                    <div className="text-slate-500 text-xs mt-1 truncate">
                      {resolveOperator(bestEntry(match.odds, "away").operatorId).name}
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-slate-950">Vedi tutte le quote</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
