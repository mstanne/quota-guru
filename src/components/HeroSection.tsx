import { TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useBetSlip } from "../context/BetSlipContext";

const featuredMatches = [
  {
    id: "1",
    competition: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    time: "Today 17:30",
    odds: {
      home: {
        value: 2.45,
        bookmaker: "bet365",
      },
      draw: {
        value: 3.35,
        bookmaker: "williamhill",
      },
      away: {
        value: 3.02,
        bookmaker: "williamhill",
      },
    },
    isLive: false,
  },
  {
    id: "2",
    competition: "Champions League",
    homeTeam: "Real Madrid",
    awayTeam: "Bayern Munich",
    time: "Today 21:00",
    odds: {
      home: {
        value: 2.18,
        bookmaker: "williamhill",
      },
      draw: {
        value: 3.52,
        bookmaker: "sport888",
      },
      away: {
        value: 3.62,
        bookmaker: "sport888",
      },
    },
    isLive: false,
  },
  {
    id: "3",
    competition: "Serie A",
    homeTeam: "Inter Milan",
    awayTeam: "Juventus",
    time: "Tomorrow 20:45",
    odds: {
      home: {
        value: 2.32,
        bookmaker: "unibet",
      },
      draw: {
        value: 3.42,
        bookmaker: "sport888",
      },
      away: {
        value: 3.38,
        bookmaker: "williamhill",
      },
    },
    isLive: false,
  },
];

export function HeroSection() {
  const { addSelection } = useBetSlip();
  const handleOddsClick = (match, betType) => {
    const betTypeLabels = {
      1: `Vincente ${match.homeTeam}`,
      X: "Pareggio",
      2: `Vincente ${match.awayTeam}`,
    };
    const bestOdds = betType === "1" ? match.odds.home : betType === "X" ? match.odds.draw : match.odds.away;
    const allBookmakers = [
      {
        name: "bet365",
        odds: bestOdds.value * (0.95 + Math.random() * 0.1),
      },
      {
        name: "williamhill",
        odds: bestOdds.value * (0.93 + Math.random() * 0.1),
      },
      {
        name: "unibet",
        odds: bestOdds.value * (0.94 + Math.random() * 0.1),
      },
      {
        name: "sport888",
        odds: bestOdds.value * (0.92 + Math.random() * 0.1),
      },
      {
        name: "betway",
        odds: bestOdds.value * (0.91 + Math.random() * 0.1),
      },
    ].sort((a, b) => b.odds - a.odds);
    addSelection({
      id: `${match.id}-${betType}`,
      matchId: match.id,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      time: match.time,
      betType: betType,
      betTypeLabel: betTypeLabels[betType],
      selectedBookmaker: bestOdds.bookmaker,
      selectedOdds: bestOdds.value,
      allBookmakers: allBookmakers,
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
          {featuredMatches.map((match) => (
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
                    <div className="text-green-500">{match.odds.home.value.toFixed(2)}</div>
                    <div className="text-slate-500 text-xs mt-1">{match.odds.home.bookmaker}</div>
                  </div>
                  <div
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => handleOddsClick(match, "X")}
                  >
                    <div className="text-slate-400 text-xs mb-1">X</div>
                    <div className="text-green-500">{match.odds.draw.value.toFixed(2)}</div>
                    <div className="text-slate-500 text-xs mt-1">{match.odds.draw.bookmaker}</div>
                  </div>
                  <div
                    className="bg-slate-900 rounded p-2 text-center border border-slate-700 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => handleOddsClick(match, "2")}
                  >
                    <div className="text-slate-400 text-xs mb-1">2</div>
                    <div className="text-green-500">{match.odds.away.value.toFixed(2)}</div>
                    <div className="text-slate-500 text-xs mt-1">{match.odds.away.bookmaker}</div>
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
