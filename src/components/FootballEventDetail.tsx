import { ArrowLeft, ChartColumn, Clock, Info, MapPin, Shirt, Target, TrendingUp, Tv, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useBetSlip } from "../context/BetSlipContext";

export function FootballEventDetail({ onBack }: { onBack?: () => void }) {
  const { addSelection } = useBetSlip();
  const match = {
    id: "1",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    competition: "Premier League",
    date: "2025-01-25",
    time: "17:30",
    venue: "Emirates Stadium",
    attendance: "60,000",
  };
  const winnerOdds = [
    {
      bookmaker: "bet365",
      logo: "\u{1F3AF}",
      home: 2.45,
      draw: 3.35,
      away: 3.02,
    },
    {
      bookmaker: "Betway",
      logo: "\u26A1",
      home: 2.4,
      draw: 3.4,
      away: 3.1,
    },
    {
      bookmaker: "888sport",
      logo: "\u{1F3B0}",
      home: 2.5,
      draw: 3.3,
      away: 2.95,
    },
    {
      bookmaker: "Unibet",
      logo: "\u{1F537}",
      home: 2.42,
      draw: 3.38,
      away: 3.05,
    },
    {
      bookmaker: "William Hill",
      logo: "\u{1F3B2}",
      home: 2.48,
      draw: 3.32,
      away: 3,
    },
  ];

  const overUnderOdds = [
    {
      bookmaker: "bet365",
      logo: "\u{1F3AF}",
      home: 1.85,
      away: 1.95,
    },
    {
      bookmaker: "Betway",
      logo: "\u26A1",
      home: 1.88,
      away: 1.92,
    },
    {
      bookmaker: "888sport",
      logo: "\u{1F3B0}",
      home: 1.83,
      away: 1.97,
    },
    {
      bookmaker: "Unibet",
      logo: "\u{1F537}",
      home: 1.9,
      away: 1.9,
    },
    {
      bookmaker: "William Hill",
      logo: "\u{1F3B2}",
      home: 1.87,
      away: 1.93,
    },
  ];

  const bttsOdds = [
    {
      bookmaker: "bet365",
      logo: "\u{1F3AF}",
      home: 1.72,
      away: 2.1,
    },
    {
      bookmaker: "Betway",
      logo: "\u26A1",
      home: 1.75,
      away: 2.05,
    },
    {
      bookmaker: "888sport",
      logo: "\u{1F3B0}",
      home: 1.7,
      away: 2.15,
    },
    {
      bookmaker: "Unibet",
      logo: "\u{1F537}",
      home: 1.73,
      away: 2.08,
    },
    {
      bookmaker: "William Hill",
      logo: "\u{1F3B2}",
      home: 1.74,
      away: 2.06,
    },
  ];

  const homeForm = ["W", "W", "D", "W", "L"];
  const awayForm = ["W", "D", "W", "W", "W"];
  const headToHead = [
    {
      date: "2024-12-15",
      home: "Arsenal",
      score: "2-1",
      away: "Liverpool",
      competition: "Premier League",
    },
    {
      date: "2024-08-20",
      home: "Liverpool",
      score: "1-1",
      away: "Arsenal",
      competition: "Premier League",
    },
    {
      date: "2024-05-10",
      home: "Arsenal",
      score: "3-2",
      away: "Liverpool",
      competition: "Premier League",
    },
    {
      date: "2024-02-04",
      home: "Liverpool",
      score: "2-0",
      away: "Arsenal",
      competition: "Premier League",
    },
    {
      date: "2023-12-23",
      home: "Arsenal",
      score: "1-1",
      away: "Liverpool",
      competition: "Premier League",
    },
  ];

  const teamStats = {
    home: {
      goals: 42,
      goalsAgainst: 18,
      cleanSheets: 8,
      btts: 12,
      over25: 15,
    },
    away: {
      goals: 45,
      goalsAgainst: 20,
      cleanSheets: 9,
      btts: 14,
      over25: 17,
    },
  };
  const lineups = {
    home: {
      formation: "4-3-3",
      goalkeeper: ["Ramsdale"],
      defenders: ["White", "Saliba", "Gabriel", "Zinchenko"],
      midfielders: ["\xD8degaard", "Partey", "Rice"],
      forwards: ["Saka", "Jesus", "Martinelli"],
      doubts: ["Partey \xE8 in dubbio per un problema muscolare", "Jesus potrebbe partire dalla panchina"],
      coach: "Mikel Arteta",
    },
    away: {
      formation: "4-3-3",
      goalkeeper: ["Alisson"],
      defenders: ["Alexander-Arnold", "Konat\xE9", "Van Dijk", "Robertson"],
      midfielders: ["Mac Allister", "Endo", "Szoboszlai"],
      forwards: ["Salah", "N\xFA\xF1ez", "D\xEDaz"],
      doubts: ["N\xFA\xF1ez \xE8 diffidato", "D\xEDaz ha recuperato dall'infortunio"],
      coach: "J\xFCrgen Klopp",
    },
  };
  const broadcast = {
    tv: ["Sky Sport Calcio", "Sky Sport Uno"],
    streaming: ["NOW TV", "Sky Go"],
    kickoff: "17:30",
    commentary: "Telecronaca di Fabio Caressa e commento tecnico di Beppe Bergomi",
  };
  const getBestOdds = (rows, outcome) => {
    if (outcome === "draw") {
      const withDraw = rows.filter((row) => row.draw !== undefined);
      return Math.max(...withDraw.map((row) => row.draw || 0));
    }
    return Math.max(...rows.map((row) => row[outcome]));
  };
  const handleAddToBetSlip = (bookmaker, betType, odds, market) => {
    addSelection({
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      competition: match.competition,
      date: match.date,
      time: match.time,
      betType: betType,
      betTypeLabel: `${market} - ${betType}`,
      selectedBookmaker: bookmaker,
      selectedOdds: odds,
      allBookmakers: [],
    });
  };
  const getFormColor = (result) => {
    switch (result) {
      case "W":
        return "bg-green-500";
      case "D":
        return "bg-yellow-500";
      case "L":
        return "bg-red-500";
      default:
        return "bg-slate-500";
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
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
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
                <div className="text-5xl mb-3">⚽</div>
                <h1 className="text-white text-3xl mb-2">{match.homeTeam}</h1>
                <div className="flex items-center justify-center md:justify-end gap-1">
                  {homeForm.map((result, index) => (
                    <Badge key={index} className={`${getFormColor(result)} text-white text-xs`}>
                      {result}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-2xl">VS</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-5xl mb-3">⚽</div>
                <h1 className="text-white text-3xl mb-2">{match.awayTeam}</h1>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  {awayForm.map((result, index) => (
                    <Badge key={index} className={`${getFormColor(result)} text-white text-xs`}>
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
                  {match.attendance}
                  {" posti"}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Gol Totali</div>
              <div className="text-white text-2xl">
                {teamStats.home.goals}
                {" / "}
                {teamStats.away.goals}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Porta Inviolata</div>
              <div className="text-white text-2xl">
                {teamStats.home.cleanSheets}
                {" / "}
                {teamStats.away.cleanSheets}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">BTTS</div>
              <div className="text-white text-2xl">
                {teamStats.home.btts}
                {" / "}
                {teamStats.away.btts}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Over 2.5</div>
              <div className="text-white text-2xl">
                {teamStats.home.over25}
                {" / "}
                {teamStats.away.over25}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Quota Migliore</div>
              <div className="text-green-500 text-2xl flex items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                {getBestOdds(winnerOdds, "home").toFixed(2)}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="1x2" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-4 md:grid-cols-8 gap-2">
            <TabsTrigger
              value="1x2"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Vincente 1X2
            </TabsTrigger>
            <TabsTrigger
              value="ou"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Over/Under
            </TabsTrigger>
            <TabsTrigger
              value="btts"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              BTTS
            </TabsTrigger>
            <TabsTrigger
              value="handicap"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Handicap
            </TabsTrigger>
            <TabsTrigger
              value="lineups"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Formazioni
            </TabsTrigger>
            <TabsTrigger
              value="broadcast"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Dove Vederla
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Statistiche
            </TabsTrigger>
            <TabsTrigger
              value="h2h"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950"
            >
              Testa a Testa
            </TabsTrigger>
          </TabsList>
          <TabsContent value="1x2">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-green-500" />
                  <h2 className="text-white text-2xl">Quote Vincente</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Bookmaker</TableHead>
                      <TableHead className="text-center text-slate-400">1 ({match.homeTeam})</TableHead>
                      <TableHead className="text-center text-slate-400">X (Pareggio)</TableHead>
                      <TableHead className="text-center text-slate-400">2 ({match.awayTeam})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winnerOdds.map((row) => {
                      const isBestHome = row.home === getBestOdds(winnerOdds, "home");
                      const isBestDraw = row.draw === getBestOdds(winnerOdds, "draw");
                      const isBestAway = row.away === getBestOdds(winnerOdds, "away");
                      return (
                        <TableRow key={row.bookmaker} className="border-slate-800 hover:bg-slate-800">
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{row.logo}</span>
                              <span>{row.bookmaker}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "1", row.home, "1X2")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestHome ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.home.toFixed(2)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "X", row.draw || 0, "1X2")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestDraw ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.draw?.toFixed(2)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "2", row.away, "1X2")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestAway ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.away.toFixed(2)}
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
                  <ChartColumn className="w-6 h-6 text-green-500" />
                  <h2 className="text-white text-2xl">Over/Under 2.5</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Bookmaker</TableHead>
                      <TableHead className="text-center text-slate-400">Over 2.5</TableHead>
                      <TableHead className="text-center text-slate-400">Under 2.5</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overUnderOdds.map((row) => {
                      const isBestOver = row.home === getBestOdds(overUnderOdds, "home");
                      const isBestUnder = row.away === getBestOdds(overUnderOdds, "away");
                      return (
                        <TableRow key={row.bookmaker} className="border-slate-800 hover:bg-slate-800">
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{row.logo}</span>
                              <span>{row.bookmaker}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "Over 2.5", row.home, "Over/Under")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestOver ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.home.toFixed(2)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "Under 2.5", row.away, "Over/Under")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestUnder ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.away.toFixed(2)}
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
          <TabsContent value="btts">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-green-500" />
                  <h2 className="text-white text-2xl">Entrambe le Squadre Segnano</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Bookmaker</TableHead>
                      <TableHead className="text-center text-slate-400">Sì</TableHead>
                      <TableHead className="text-center text-slate-400">No</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bttsOdds.map((row) => {
                      const isBestYes = row.home === getBestOdds(bttsOdds, "home");
                      const isBestNo = row.away === getBestOdds(bttsOdds, "away");
                      return (
                        <TableRow key={row.bookmaker} className="border-slate-800 hover:bg-slate-800">
                          <TableCell className="text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{row.logo}</span>
                              <span>{row.bookmaker}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "S\xEC", row.home, "BTTS")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestYes ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.home.toFixed(2)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleAddToBetSlip(row.bookmaker, "No", row.away, "BTTS")}
                              className={`w-full px-4 py-3 rounded text-center transition-all ${isBestNo ? "bg-green-500 text-slate-950 hover:bg-green-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                            >
                              {row.away.toFixed(2)}
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
          <TabsContent value="handicap">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Handicap</div>
              <p className="text-slate-500">Disponibili a breve</p>
            </Card>
          </TabsContent>
          <TabsContent value="lineups">
            <Card className="bg-slate-900 border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shirt className="w-6 h-6 text-green-500" />
                  <h2 className="text-white text-2xl">Probabili Formazioni</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="text-center mb-6">
                      <div className="text-white text-xl mb-2">{match.homeTeam}</div>
                      <Badge className="bg-blue-500 text-white">{lineups.home.formation}</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Portiere</div>
                        {lineups.home.goalkeeper.map((player, index) => (
                          <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center">
                            {player}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Difensori</div>
                        <div className="grid grid-cols-2 gap-2">
                          {lineups.home.defenders.map((player, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center text-sm">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Centrocampisti</div>
                        <div className="grid grid-cols-2 gap-2">
                          {lineups.home.midfielders.map((player, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center text-sm">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Attaccanti</div>
                        <div className="grid grid-cols-2 gap-2">
                          {lineups.home.forwards.map((player, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center text-sm">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-700">
                        <div className="text-slate-400 text-sm mb-1">Allenatore</div>
                        <div className="text-white">{lineups.home.coach}</div>
                      </div>
                    </div>
                    {lineups.home.doubts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-orange-400 text-sm mb-2 flex items-center gap-2">
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
                      <Badge className="bg-orange-500 text-white">{lineups.away.formation}</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Portiere</div>
                        {lineups.away.goalkeeper.map((player, index) => (
                          <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center">
                            {player}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Difensori</div>
                        <div className="grid grid-cols-2 gap-2">
                          {lineups.away.defenders.map((player, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center text-sm">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Centrocampisti</div>
                        <div className="grid grid-cols-2 gap-2">
                          {lineups.away.midfielders.map((player, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center text-sm">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Attaccanti</div>
                        <div className="grid grid-cols-2 gap-2">
                          {lineups.away.forwards.map((player, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-2 text-white text-center text-sm">
                              {player}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-700">
                        <div className="text-slate-400 text-sm mb-1">Allenatore</div>
                        <div className="text-white">{lineups.away.coach}</div>
                      </div>
                    </div>
                    {lineups.away.doubts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-orange-400 text-sm mb-2 flex items-center gap-2">
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
                        Le formazioni riportate sono probabili e potrebbero subire modifiche prima del calcio d'inizio.
                        Verificare sempre le formazioni ufficiali pubblicate un'ora prima della partita.
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
                  <Tv className="w-6 h-6 text-green-500" />
                  <h2 className="text-white text-2xl">Dove Vedere la Partita</h2>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500 rounded p-2">
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
                      <div className="bg-green-500 rounded p-2">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white">Streaming Online</h3>
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
                        <div className="text-slate-400 text-sm mb-2">Orario Calcio d'Inizio</div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-500" />
                          <span className="text-white text-xl">{broadcast.kickoff}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Telecronaca</div>
                        <div className="text-white">{broadcast.commentary}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="text-slate-300 text-sm">
                        <p className="mb-2">
                          Le informazioni sulla trasmissione possono essere soggette a modifiche. Verifica sempre sui
                          canali ufficiali prima dell'inizio della partita.
                        </p>
                        <p className="text-orange-400">
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
                <h2 className="text-white text-2xl mb-6">Statistiche Squadre</h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Gol Segnati</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{teamStats.home.goals}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-white">{teamStats.away.goals}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-500"
                        style={{
                          width: `${(teamStats.home.goals / (teamStats.home.goals + teamStats.away.goals)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-orange-500"
                        style={{
                          width: `${(teamStats.away.goals / (teamStats.home.goals + teamStats.away.goals)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Gol Subiti</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{teamStats.home.goalsAgainst}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-white">{teamStats.away.goalsAgainst}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${(teamStats.home.goalsAgainst / (teamStats.home.goalsAgainst + teamStats.away.goalsAgainst)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-orange-500"
                        style={{
                          width: `${(teamStats.away.goalsAgainst / (teamStats.home.goalsAgainst + teamStats.away.goalsAgainst)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Porta Inviolata</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{teamStats.home.cleanSheets}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-white">{teamStats.away.cleanSheets}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(teamStats.home.cleanSheets / (teamStats.home.cleanSheets + teamStats.away.cleanSheets)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-orange-500"
                        style={{
                          width: `${(teamStats.away.cleanSheets / (teamStats.home.cleanSheets + teamStats.away.cleanSheets)) * 100}%`,
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
                <h2 className="text-white text-2xl mb-6">Ultimi Scontri Diretti</h2>
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
                        <div className="text-slate-500 text-sm">{game.competition}</div>
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
                <h3 className="text-blue-400 mb-2">Analisi degli Esperti</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Questo match si preannuncia equilibrato con entrambe le squadre in ottima forma. La storia recente
                  favorisce leggermente la squadra di casa, ma il fattore campo potrebbe essere determinante.
                </p>
                <div className="bg-slate-800 rounded p-3 inline-block">
                  <div className="text-slate-400 text-xs mb-1">La nostra scelta</div>
                  <div className="text-green-500 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>
                      {match.homeTeam}
                      {" o Pareggio @ 1.75"}
                    </span>
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
