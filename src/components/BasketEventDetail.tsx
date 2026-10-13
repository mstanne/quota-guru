import { Check, ArrowLeft, ChartColumn, Clock, Info, MapPin, Shirt, Target, TrendingUp, Tv, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useBetSlip } from "../context/BetSlipContext";
import { getOperator } from "../data/operators";
import { bestValue, formatOdd, isBestAt, type OddValue } from "../lib/odds";
import { OperatorLogo } from "./operator/OperatorUi";

/** One row of an odds comparison table: operator + value per outcome (number or placeholder). */
type OddsRow = { operatorId: string } & Record<string, OddValue>;

export function BasketEventDetail({ onBack }: { onBack?: () => void }) {
  const { addSelection } = useBetSlip();
  const match = {
    id: "1",
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Boston Celtics",
    competition: "NBA",
    date: "2025-01-25",
    time: "02:00",
    venue: "Crypto.com Arena",
    capacity: "18,997",
  };
  const winnerOdds: OddsRow[] = [
    { operatorId: "operatore-1", home: "[QUOTA_1]", away: "[QUOTA_2]" },
    { operatorId: "operatore-2", home: "[QUOTA_1]", away: "[QUOTA_2]" },
    { operatorId: "operatore-3", home: "[QUOTA_1]", away: "[QUOTA_2]" },
    { operatorId: "operatore-4", home: "[QUOTA_1]", away: "[QUOTA_2]" },
    { operatorId: "operatore-5", home: "[QUOTA_1]", away: "[QUOTA_2]" },
  ];

  const overUnderOdds: OddsRow[] = [
    { operatorId: "operatore-1", home: "[QUOTA_OVER]", away: "[QUOTA_UNDER]" },
    { operatorId: "operatore-2", home: "[QUOTA_OVER]", away: "[QUOTA_UNDER]" },
    { operatorId: "operatore-3", home: "[QUOTA_OVER]", away: "[QUOTA_UNDER]" },
    { operatorId: "operatore-4", home: "[QUOTA_OVER]", away: "[QUOTA_UNDER]" },
    { operatorId: "operatore-5", home: "[QUOTA_OVER]", away: "[QUOTA_UNDER]" },
  ];

  const homeForm = ["W", "W", "L", "W", "W"];
  const awayForm = ["W", "L", "W", "W", "L"];
  const headToHead = [
    {
      date: "2024-12-10",
      home: "Lakers",
      score: "115-110",
      away: "Celtics",
      competition: "NBA",
    },
    {
      date: "2024-11-05",
      home: "Celtics",
      score: "118-112",
      away: "Lakers",
      competition: "NBA",
    },
    {
      date: "2024-03-20",
      home: "Lakers",
      score: "105-120",
      away: "Celtics",
      competition: "NBA",
    },
    {
      date: "2024-02-15",
      home: "Celtics",
      score: "125-118",
      away: "Lakers",
      competition: "NBA",
    },
    {
      date: "2023-12-18",
      home: "Lakers",
      score: "108-102",
      away: "Celtics",
      competition: "NBA",
    },
  ];

  const teamStats = {
    home: {
      points: 118.5,
      pointsAgainst: 112.3,
      assists: 27.2,
      rebounds: 44.5,
      fieldGoalPct: 47.8,
    },
    away: {
      points: 121.2,
      pointsAgainst: 110.5,
      assists: 28.5,
      rebounds: 46.2,
      fieldGoalPct: 48.5,
    },
  };
  const lineups = {
    home: {
      starters: [
        {
          name: "D'Angelo Russell",
          position: "PG",
        },
        {
          name: "Austin Reaves",
          position: "SG",
        },
        {
          name: "LeBron James",
          position: "SF",
        },
        {
          name: "Rui Hachimura",
          position: "PF",
        },
        {
          name: "Anthony Davis",
          position: "C",
        },
      ],

      keyPlayers: ["LeBron James", "Anthony Davis"],
      doubts: [
        "Jarred Vanderbilt \xE8 in dubbio per infortunio al piede",
        "Gabe Vincent potrebbe rientrare dalla panchina",
      ],

      coach: "Darvin Ham",
    },
    away: {
      starters: [
        {
          name: "Jrue Holiday",
          position: "PG",
        },
        {
          name: "Derrick White",
          position: "SG",
        },
        {
          name: "Jaylen Brown",
          position: "SF",
        },
        {
          name: "Jayson Tatum",
          position: "PF",
        },
        {
          name: "Kristaps Porzi\u0146\u0123is",
          position: "C",
        },
      ],

      keyPlayers: ["Jayson Tatum", "Jaylen Brown"],
      doubts: [
        "Porzi\u0146\u0123is ha recuperato dall'infortunio alla caviglia",
        "Al Horford potrebbe avere pi\xF9 minuti",
      ],

      coach: "Joe Mazzulla",
    },
  };
  const broadcast = {
    tv: ["Sky Sport NBA", "Sky Sport Uno"],
    streaming: ["NOW TV", "Sky Go", "NBA League Pass"],
    tipoff: "02:00",
    commentary: "Telecronaca di Flavio Tranquillo e commento tecnico di Davide Pessina",
  };
  // Odds may be numbers or placeholders ("[QUOTA_1]"): see src/lib/odds.ts.
  const getBestOdds = (rows: OddsRow[], outcome: string) => bestValue(rows.map((row) => row[outcome] as OddValue));
  const isBest = (rows: OddsRow[], outcome: string, index: number) =>
    isBestAt(
      rows.map((row) => row[outcome] as OddValue),
      index,
    );
  const handleAddToBetSlip = (operatorId: string, betType: string, odds: OddValue, market: string) => {
    addSelection({
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      competition: match.competition,
      date: match.date,
      time: match.time,
      betType: betType,
      betTypeLabel: `${market} - ${betType}`,
      selectedBookmaker: operatorId,
      selectedOdds: odds,
      allBookmakers: [],
    });
  };
  const getFormColor = (result) => {
    switch (result) {
      case "W":
        return "bg-best text-best-foreground";
      case "L":
        return "bg-live text-white";
      default:
        return "bg-slate-600 text-white";
    }
  };
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle Partite
          </Button>
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                {match.competition}
              </Badge>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                <Clock className="w-3 h-3 mr-1" />
                {match.date}
                {" - "}
                {match.time}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
              <div className="text-center md:text-right">
                <div className="text-5xl mb-3" aria-hidden="true">🏀</div>
                <h1 className="text-white text-3xl mb-2">{match.homeTeam}</h1>
                <div className="flex items-center justify-center md:justify-end gap-1">
                  {homeForm.map((result, index) => (
                    <Badge key={index} className={`${getFormColor(result)} text-xs`}>
                      {result}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-2xl">VS</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-5xl mb-3" aria-hidden="true">🏀</div>
                <h1 className="text-white text-3xl mb-2">{match.awayTeam}</h1>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  {awayForm.map((result, index) => (
                    <Badge key={index} className={`${getFormColor(result)} text-xs`}>
                      {result}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{match.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {match.capacity}
                  {" posti"}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Punti Media</div>
              <div className="text-white text-2xl">
                {teamStats.home.points}
                {" / "}
                {teamStats.away.points}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Assist Media</div>
              <div className="text-white text-2xl">
                {teamStats.home.assists}
                {" / "}
                {teamStats.away.assists}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Rimbalzi Media</div>
              <div className="text-white text-2xl">
                {teamStats.home.rebounds}
                {" / "}
                {teamStats.away.rebounds}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">FG%</div>
              <div className="text-white text-2xl">
                {teamStats.home.fieldGoalPct}
                {"% / "}
                {teamStats.away.fieldGoalPct}%
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Quota migliore</div>
              <div className="text-best text-2xl tabular-nums flex items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                {formatOdd(getBestOdds(winnerOdds, "home"))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="winner" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-3 md:grid-cols-6 gap-2">
            <TabsTrigger
              value="winner"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Vincente
            </TabsTrigger>
            <TabsTrigger
              value="ou"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Over/Under
            </TabsTrigger>
            <TabsTrigger
              value="lineups"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Formazioni
            </TabsTrigger>
            <TabsTrigger
              value="broadcast"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Dove vederla
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Statistiche
            </TabsTrigger>
            <TabsTrigger
              value="h2h"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Precedenti
            </TabsTrigger>
          </TabsList>
          <TabsContent value="winner">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-slate-300" />
                  <h2 className="text-white text-2xl">Quote vincente</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Bookmaker</TableHead>
                      <TableHead className="text-center text-slate-400">{match.homeTeam}</TableHead>
                      <TableHead className="text-center text-slate-400">{match.awayTeam}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winnerOdds.map((row, rowIndex) => {
                      const isBestHome = isBest(winnerOdds, "home", rowIndex);
                      const isBestAway = isBest(winnerOdds, "away", rowIndex);
                      return (
                        <TableRow key={row.operatorId} className="border-slate-800 hover:bg-slate-800/40">
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <OperatorLogo operator={getOperator(row.operatorId)} width={24} height={24} />
                              <span>{getOperator(row.operatorId).name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => handleAddToBetSlip(row.operatorId, match.homeTeam, row.home, "Vincente")}
                              aria-label={`Aggiungi alla schedina: Vincente ${match.homeTeam} a ${formatOdd(row.home)} su ${getOperator(row.operatorId).name}${isBestHome ? " (quota migliore)" : ""}`}
                              className={`w-full px-4 py-3 rounded text-center tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${isBestHome ? "bg-best text-best-foreground hover:opacity-90" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {formatOdd(row.home)}
                              {isBestHome && (
                                <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => handleAddToBetSlip(row.operatorId, match.awayTeam, row.away, "Vincente")}
                              aria-label={`Aggiungi alla schedina: Vincente ${match.awayTeam} a ${formatOdd(row.away)} su ${getOperator(row.operatorId).name}${isBestAway ? " (quota migliore)" : ""}`}
                              className={`w-full px-4 py-3 rounded text-center tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${isBestAway ? "bg-best text-best-foreground hover:opacity-90" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {formatOdd(row.away)}
                              {isBestAway && (
                                <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                              )}
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="ou">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ChartColumn className="w-6 h-6 text-slate-300" />
                  <h2 className="text-white text-2xl">Over/Under 225.5 Punti</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Bookmaker</TableHead>
                      <TableHead className="text-center text-slate-400">Over 225.5</TableHead>
                      <TableHead className="text-center text-slate-400">Under 225.5</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overUnderOdds.map((row, rowIndex) => {
                      const isBestOver = isBest(overUnderOdds, "home", rowIndex);
                      const isBestUnder = isBest(overUnderOdds, "away", rowIndex);
                      return (
                        <TableRow key={row.operatorId} className="border-slate-800 hover:bg-slate-800/40">
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <OperatorLogo operator={getOperator(row.operatorId)} width={24} height={24} />
                              <span>{getOperator(row.operatorId).name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => handleAddToBetSlip(row.operatorId, "Over 225.5", row.home, "Over/Under")}
                              aria-label={`Aggiungi alla schedina: Over/Under ${"Over 225.5"} a ${formatOdd(row.home)} su ${getOperator(row.operatorId).name}${isBestOver ? " (quota migliore)" : ""}`}
                              className={`w-full px-4 py-3 rounded text-center tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${isBestOver ? "bg-best text-best-foreground hover:opacity-90" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {formatOdd(row.home)}
                              {isBestOver && (
                                <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => handleAddToBetSlip(row.operatorId, "Under 225.5", row.away, "Over/Under")}
                              aria-label={`Aggiungi alla schedina: Over/Under ${"Under 225.5"} a ${formatOdd(row.away)} su ${getOperator(row.operatorId).name}${isBestUnder ? " (quota migliore)" : ""}`}
                              className={`w-full px-4 py-3 rounded text-center tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${isBestUnder ? "bg-best text-best-foreground hover:opacity-90" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {formatOdd(row.away)}
                              {isBestUnder && (
                                <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                              )}
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="lineups">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shirt className="w-6 h-6 text-slate-300" />
                  <h2 className="text-white text-2xl">Probabili formazioni</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="text-center mb-6">
                      <div className="text-white text-xl mb-2">{match.homeTeam}</div>
                      <Badge className="bg-slate-700 text-white">Quintetto base</Badge>
                    </div>
                    <div className="space-y-3">
                      {lineups.home.starters.map((player, index) => (
                        <div
                          key={index}
                          className="bg-slate-700 rounded-lg px-4 py-3 flex items-center justify-between"
                        >
                          <div className="text-white">{player.name}</div>
                          <Badge className="bg-slate-600 text-slate-200 text-xs">{player.position}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Giocatori Chiave
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lineups.home.keyPlayers.map((player, index) => (
                          <Badge key={index} className="bg-slate-800 text-slate-200 border-slate-700">
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="text-slate-400 text-sm mb-1">Allenatore</div>
                      <div className="text-white">{lineups.home.coach}</div>
                    </div>
                    {lineups.home.doubts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-warn text-sm mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Dubbi e Novità
                        </div>
                        <ul className="space-y-1">
                          {lineups.home.doubts.map((player, index) => (
                            <li key={index} className="text-slate-300 text-sm">
                              {"\u2022 "}
                              {player}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="text-center mb-6">
                      <div className="text-white text-xl mb-2">{match.awayTeam}</div>
                      <Badge className="bg-slate-700 text-white">Quintetto base</Badge>
                    </div>
                    <div className="space-y-3">
                      {lineups.away.starters.map((player, index) => (
                        <div
                          key={index}
                          className="bg-slate-700 rounded-lg px-4 py-3 flex items-center justify-between"
                        >
                          <div className="text-white">{player.name}</div>
                          <Badge className="bg-slate-600 text-slate-200 text-xs">{player.position}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Giocatori Chiave
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lineups.away.keyPlayers.map((player, index) => (
                          <Badge key={index} className="bg-slate-800 text-slate-200 border-slate-700">
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="text-slate-400 text-sm mb-1">Allenatore</div>
                      <div className="text-white">{lineups.away.coach}</div>
                    </div>
                    {lineups.away.doubts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-warn text-sm mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Dubbi e Novità
                        </div>
                        <ul className="space-y-1">
                          {lineups.away.doubts.map((player, index) => (
                            <li key={index} className="text-slate-300 text-sm">
                              {"\u2022 "}
                              {player}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-slate-300 text-sm">
                      <p className="mb-2">
                        Le formazioni riportate sono probabili e potrebbero subire modifiche prima della palla a due.
                        Verificare sempre le formazioni ufficiali pubblicate prima dell'inizio della partita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="broadcast">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Tv className="w-6 h-6 text-slate-300" />
                  <h2 className="text-white text-2xl">Dove vedere la partita</h2>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-slate-700 rounded p-2">
                        <Tv className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white">Canali TV</h3>
                        <p className="text-slate-400 text-sm">Trasmissione in diretta</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {broadcast.tv.map((channel, index) => (
                        <div
                          key={index}
                          className="bg-slate-700 rounded-lg px-4 py-3 text-white flex items-center gap-3"
                        >
                          <div className="text-2xl">📺</div>
                          <span>{channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-slate-700 rounded p-2">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white">Streaming online</h3>
                        <p className="text-slate-400 text-sm">Guarda in streaming</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {broadcast.streaming.map((service, index) => (
                        <div
                          key={index}
                          className="bg-slate-700 rounded-lg px-4 py-3 text-white flex items-center gap-3"
                        >
                          <div className="text-2xl">💻</div>
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Orario Palla a Due</div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-slate-300" />
                          <span className="text-white text-xl">{broadcast.tipoff}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Telecronaca</div>
                        <div className="text-white">{broadcast.commentary}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-warn/10 border border-warn/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" />
                      <div className="text-slate-300 text-sm">
                        <p className="mb-2">
                          Le informazioni sulla trasmissione possono essere soggette a modifiche. Verifica sempre sui
                          canali ufficiali prima dell'inizio della partita.
                        </p>
                        <p className="text-warn">
                          Attenzione: utilizza solo piattaforme legali e autorizzate per guardare le partite. Lo
                          streaming illegale è un reato e danneggia il mondo dello sport.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="stats">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <h2 className="text-white text-2xl mb-6">Statistiche delle squadre</h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Punti Media a Partita</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{teamStats.home.points}</span>
                        <span className="text-slate-500" aria-hidden="true">|</span>
                        <span className="text-white">{teamStats.away.points}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-slate-200"
                        style={{
                          width: `${(teamStats.home.points / (teamStats.home.points + teamStats.away.points)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-slate-500"
                        style={{
                          width: `${(teamStats.away.points / (teamStats.home.points + teamStats.away.points)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Assist Media a Partita</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{teamStats.home.assists}</span>
                        <span className="text-slate-500" aria-hidden="true">|</span>
                        <span className="text-white">{teamStats.away.assists}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-slate-200"
                        style={{
                          width: `${(teamStats.home.assists / (teamStats.home.assists + teamStats.away.assists)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-slate-500"
                        style={{
                          width: `${(teamStats.away.assists / (teamStats.home.assists + teamStats.away.assists)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Rimbalzi Media a Partita</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{teamStats.home.rebounds}</span>
                        <span className="text-slate-500" aria-hidden="true">|</span>
                        <span className="text-white">{teamStats.away.rebounds}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-slate-400"
                        style={{
                          width: `${(teamStats.home.rebounds / (teamStats.home.rebounds + teamStats.away.rebounds)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-slate-500"
                        style={{
                          width: `${(teamStats.away.rebounds / (teamStats.home.rebounds + teamStats.away.rebounds)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="h2h">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <h2 className="text-white text-2xl mb-6">Ultimi scontri diretti</h2>
                <div className="space-y-3">
                  {headToHead.map((game, index) => (
                    <div key={index} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-slate-400 text-sm mb-1">{game.date}</div>
                        <div className="text-white">
                          {game.home}
                          {" vs "}
                          {game.away}
                        </div>
                        <div className="text-slate-400 text-sm">{game.competition}</div>
                      </div>
                      <div className="text-2xl text-white font-bold">{game.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="bg-blue-500/10 border-blue-500/20 mt-8">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-400 mb-2">Analisi della redazione</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Sfida stellare tra due delle squadre più competitive della NBA. I Lakers fanno affidamento sulla
                  coppia LeBron-Davis, mentre i Celtics vantano un roster più profondo con Tatum e Brown.
                </p>
                <div className="bg-slate-800 rounded p-3 inline-block">
                  <div className="text-slate-400 text-xs mb-1">Il pronostico della redazione</div>
                  <div className="text-white flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>[PRONOSTICO] @ [QUOTA_PRONOSTICO]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
