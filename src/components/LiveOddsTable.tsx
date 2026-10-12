import { Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";

const liveMatches = [
  {
    id: "1",
    homeTeam: "Manchester City",
    awayTeam: "Chelsea",
    time: "19:30",
    competition: "Premier League",
    bestOdds: {
      home: {
        value: 1.72,
        bookmaker: "sport888",
      },
      draw: {
        value: 4.35,
        bookmaker: "betway",
      },
      away: {
        value: 5.82,
        bookmaker: "unibet",
      },
    },
  },
  {
    id: "2",
    homeTeam: "Barcelona",
    awayTeam: "Atletico Madrid",
    time: "21:00",
    competition: "La Liga",
    bestOdds: {
      home: {
        value: 1.9,
        bookmaker: "unibet",
      },
      draw: {
        value: 3.72,
        bookmaker: "sport888",
      },
      away: {
        value: 4.48,
        bookmaker: "williamhill",
      },
    },
  },
  {
    id: "3",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    time: "20:45",
    competition: "Ligue 1",
    bestOdds: {
      home: {
        value: 1.5,
        bookmaker: "unibet",
      },
      draw: {
        value: 4.95,
        bookmaker: "unibet",
      },
      away: {
        value: 6.72,
        bookmaker: "sport888",
      },
    },
  },
  {
    id: "4",
    homeTeam: "AC Milan",
    awayTeam: "Napoli",
    time: "18:00",
    competition: "Serie A",
    bestOdds: {
      home: {
        value: 2.65,
        bookmaker: "betway",
      },
      draw: {
        value: 3.48,
        bookmaker: "unibet",
      },
      away: {
        value: 2.85,
        bookmaker: "williamhill",
      },
    },
  },
  {
    id: "5",
    homeTeam: "Borussia Dortmund",
    awayTeam: "RB Leipzig",
    time: "19:30",
    competition: "Bundesliga",
    bestOdds: {
      home: {
        value: 2.18,
        bookmaker: "williamhill",
      },
      draw: {
        value: 3.58,
        bookmaker: "bet365",
      },
      away: {
        value: 3.52,
        bookmaker: "bet365",
      },
    },
  },
];
export function LiveOddsTable({ onMatchClick }: { onMatchClick?: (matchId: string) => void }) {
  return (
    <div className="py-12 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl">Quote in Tempo Reale</h2>
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
            <Clock className="w-3 h-3 mr-1" />
            Aggiornamento Live
          </Badge>
        </div>
        <Card className="hidden md:block bg-white border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900 border-slate-800">
                <TableHead className="text-slate-300">Orario</TableHead>
                <TableHead className="text-slate-300">Partita</TableHead>
                <TableHead className="text-center text-slate-300">1</TableHead>
                <TableHead className="text-center text-slate-300">X</TableHead>
                <TableHead className="text-center text-slate-300">2</TableHead>
                <TableHead className="text-slate-300" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {liveMatches.map((match) => (
                <TableRow
                  key={match.id}
                  className="border-slate-800 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onMatchClick?.(match.id)}
                >
                  <TableCell>
                    <div>
                      <div>{match.time}</div>
                      <div className="text-slate-500 text-sm">{match.competition}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{match.homeTeam}</div>
                      <div>{match.awayTeam}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <div className="bg-green-500 text-slate-950 font-bold px-3 py-1.5 rounded">
                        {match.bestOdds.home.value.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">{match.bestOdds.home.bookmaker}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <div className="bg-green-500 text-slate-950 font-bold px-3 py-1.5 rounded">
                        {match.bestOdds.draw.value.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">{match.bestOdds.draw.bookmaker}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <div className="bg-green-500 text-slate-950 font-bold px-3 py-1.5 rounded">
                        {match.bestOdds.away.value.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">{match.bestOdds.away.bookmaker}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMatchClick?.(match.id);
                      }}
                    >
                      Vedi tutto
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="md:hidden space-y-4">
          {liveMatches.map((match) => (
            <Card
              key={match.id}
              className="bg-white border-slate-800 cursor-pointer hover:border-green-500 transition-all"
              onClick={() => onMatchClick?.(match.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="bg-slate-100">
                    {match.competition}
                  </Badge>
                  <span className="text-slate-500">{match.time}</span>
                </div>
                <div className="mb-4">
                  <div className="mb-1">{match.homeTeam}</div>
                  <div>{match.awayTeam}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="bg-green-500 text-slate-950 font-bold py-2 rounded mb-1">
                      {match.bestOdds.home.value.toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-xs">{match.bestOdds.home.bookmaker}</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-500 text-slate-950 font-bold py-2 rounded mb-1">
                      {match.bestOdds.draw.value.toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-xs">{match.bestOdds.draw.bookmaker}</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-500 text-slate-950 font-bold py-2 rounded mb-1">
                      {match.bestOdds.away.value.toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-xs">{match.bestOdds.away.bookmaker}</div>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Vedi tutte le quote</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
