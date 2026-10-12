import { useState } from "react";
import { Funnel, TrendingUp, Trophy } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useBetSlip } from "../context/BetSlipContext";

// Mock data – replace with a real odds feed/API.
const matches: any[] = [
  {
    id: "1",
    player1: "Novak Djokovic",
    player2: "Carlos Alcaraz",
    date: "Oggi",
    time: "14:00",
    tournament: "ATP Masters 1000 - Roma",
    surface: "Terra",
    round: "Finale",
    odds: {
      bet365: {
        player1: 2.1,
        player2: 1.75,
      },
      betway: {
        player1: 2.22,
        player2: 1.72,
      },
      sport888: {
        player1: 2.08,
        player2: 1.8,
      },
      unibet: {
        player1: 2.12,
        player2: 1.74,
      },
      williamhill: {
        player1: 2.15,
        player2: 1.76,
      },
    },
  },
  {
    id: "2",
    player1: "Jannik Sinner",
    player2: "Daniil Medvedev",
    date: "Oggi",
    time: "16:30",
    tournament: "ATP Masters 1000 - Roma",
    surface: "Terra",
    round: "Semifinale",
    odds: {
      bet365: {
        player1: 1.65,
        player2: 2.25,
      },
      betway: {
        player1: 1.62,
        player2: 2.35,
      },
      sport888: {
        player1: 1.72,
        player2: 2.2,
      },
      unibet: {
        player1: 1.64,
        player2: 2.27,
      },
      williamhill: {
        player1: 1.66,
        player2: 2.22,
      },
    },
  },
  {
    id: "3",
    player1: "Iga Swiatek",
    player2: "Aryna Sabalenka",
    date: "Oggi",
    time: "19:00",
    tournament: "WTA 1000 - Roma",
    surface: "Terra",
    round: "Finale",
    isLive: false,
    odds: {
      bet365: {
        player1: 1.55,
        player2: 2.5,
      },
      betway: {
        player1: 1.62,
        player2: 2.45,
      },
      sport888: {
        player1: 1.53,
        player2: 2.62,
      },
      unibet: {
        player1: 1.56,
        player2: 2.48,
      },
      williamhill: {
        player1: 1.57,
        player2: 2.47,
      },
    },
  },
  {
    id: "4",
    player1: "Elena Rybakina",
    player2: "Coco Gauff",
    date: "Domani",
    time: "13:00",
    tournament: "WTA 1000 - Roma",
    surface: "Terra",
    round: "Semifinale",
    odds: {
      bet365: {
        player1: 1.9,
        player2: 1.95,
      },
      betway: {
        player1: 1.88,
        player2: 2.02,
      },
      sport888: {
        player1: 1.98,
        player2: 1.93,
      },
      unibet: {
        player1: 1.89,
        player2: 1.96,
      },
      williamhill: {
        player1: 1.91,
        player2: 1.94,
      },
    },
  },
  {
    id: "5",
    player1: "Stefanos Tsitsipas",
    player2: "Alexander Zverev",
    date: "Domani",
    time: "15:30",
    tournament: "ATP Masters 1000 - Roma",
    surface: "Terra",
    round: "Quarti",
    odds: {
      bet365: {
        player1: 2.05,
        player2: 1.8,
      },
      betway: {
        player1: 2.08,
        player2: 1.78,
      },
      sport888: {
        player1: 2.03,
        player2: 1.88,
      },
      unibet: {
        player1: 2.15,
        player2: 1.79,
      },
      williamhill: {
        player1: 2.1,
        player2: 1.81,
      },
    },
  },
  {
    id: "6",
    player1: "Casper Ruud",
    player2: "Holger Rune",
    date: "Domani",
    time: "18:00",
    tournament: "ATP Masters 1000 - Roma",
    surface: "Terra",
    round: "Quarti",
    odds: {
      bet365: {
        player1: 1.7,
        player2: 2.15,
      },
      betway: {
        player1: 1.73,
        player2: 2.12,
      },
      sport888: {
        player1: 1.68,
        player2: 2.25,
      },
      unibet: {
        player1: 1.78,
        player2: 2.14,
      },
      williamhill: {
        player1: 1.72,
        player2: 2.13,
      },
    },
  },
];

const tournaments = [
  {
    id: "all",
    name: "Tutti i Tornei",
    icon: "\u{1F3BE}",
    count: matches.length,
  },
  {
    id: "atp-masters",
    name: "ATP Masters 1000",
    icon: "\u{1F3C6}",
    count: 4,
  },
  {
    id: "wta-1000",
    name: "WTA 1000",
    icon: "\u{1F451}",
    count: 2,
  },
  {
    id: "grand-slam",
    name: "Grand Slam",
    icon: "\u2B50",
    count: 0,
  },
  {
    id: "atp-500",
    name: "ATP 500",
    icon: "\u{1F948}",
    count: 0,
  },
  {
    id: "wta-500",
    name: "WTA 500",
    icon: "\u{1F948}",
    count: 0,
  },
];

const surfaces = [
  {
    id: "all",
    name: "Tutte le Superfici",
    icon: "\u{1F3BE}",
  },
  {
    id: "clay",
    name: "Terra",
    icon: "\u{1F7E4}",
  },
  {
    id: "hard",
    name: "Cemento",
    icon: "\u{1F535}",
  },
  {
    id: "grass",
    name: "Erba",
    icon: "\u{1F7E2}",
  },
  {
    id: "indoor",
    name: "Indoor",
    icon: "\u{1F3E0}",
  },
];

export function TennisPage({ onMatchClick }: { onMatchClick?: (matchId: string) => void }) {
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [selectedSurface, setSelectedSurface] = useState("all");
  const { addSelection } = useBetSlip();
  const bookmakerNames = ["bet365", "betway", "sport888", "unibet", "williamhill"];
  const getBookmakerName = (index) => bookmakerNames[index % bookmakerNames.length];
  const handleOddsClick = (match, betType, bookmaker, odds) => {
    const betTypeLabels = {
      1: `Vincente ${match.player1}`,
      2: `Vincente ${match.player2}`,
    };
    const allBookmakers = Object.entries<any>(match.odds)
      .map(([name, bookmakerOdds]) => ({
        name: name,
        odds: betType === "1" ? bookmakerOdds.player1 : bookmakerOdds.player2,
      }))
      .sort((a, b) => b.odds - a.odds);
    addSelection({
      id: `${match.id}-${betType}`,
      matchId: match.id,
      competition: `${match.tournament} - ${match.round}`,
      homeTeam: match.player1,
      awayTeam: match.player2,
      time: `${match.date} ${match.time}`,
      betType: betType === "1" ? "1" : "2",
      betTypeLabel: betTypeLabels[betType],
      selectedBookmaker: bookmaker,
      selectedOdds: odds,
      allBookmakers: allBookmakers,
    });
  };
  const getBestOdd = (match, outcome) => {
    const allOdds = Object.values(match.odds);
    return Math.max(...allOdds.map((odds) => odds[outcome]));
  };
  const getBestBookmaker = (match, outcome) =>
    Object.entries<any>(match.odds).reduce(
      (best, [name, odds]) =>
        odds[outcome] > best.value
          ? {
              name: name,
              value: odds[outcome],
            }
          : best,
      {
        name: "",
        value: 0,
      },
    );
  const getBestBookmakerName = (match, outcome) => {
    const bestOdd = getBestOdd(match, outcome);
    const entry = Object.entries<any>(match.odds).find(([_name, odds]) => odds[outcome] === bestOdd);
    return entry ? entry[0] : "";
  };
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-green-500" />
            <h1 className="text-white text-4xl">Quote Tennis</h1>
          </div>
          <p className="text-slate-400 text-lg mb-6">
            Confronta le quote tennis dai migliori bookmaker per ATP, WTA e tutti i tornei internazionali
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">{matches.length}</div>
                <div className="text-slate-400 text-sm">Partite Oggi</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">5</div>
                <div className="text-slate-400 text-sm">Bookmaker</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1">6</div>
                <div className="text-slate-400 text-sm">Tornei</div>
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-4 text-center">
                <div className="text-green-500 text-2xl mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-6 h-6" />
                  Live
                </div>
                <div className="text-slate-400 text-sm">Quote in Tempo Reale</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Card className="hidden md:block bg-slate-900 border-slate-800 mb-8">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Funnel className="w-5 h-5 text-slate-400" />
              <h2 className="text-white text-xl">Filtra Partite</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Torneo</label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Seleziona torneo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id} className="text-white">
                        {tournament.icon} {tournament.name} {tournament.count > 0 && `(${tournament.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Superficie</label>
                <Select value={selectedSurface} onValueChange={setSelectedSurface}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Seleziona superficie" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {surfaces.map((surface) => (
                      <SelectItem key={surface.id} value={surface.id} className="text-white">
                        {surface.icon} {surface.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tournaments.slice(0, 4).map((tournament) => (
                <Button
                  key={tournament.id}
                  variant={selectedTournament === tournament.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTournament(tournament.id)}
                  className={
                    selectedTournament === tournament.id
                      ? "bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  }
                >
                  {tournament.icon} {tournament.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
        <div className="md:hidden mb-6">
          <Accordion type="single" collapsible className="bg-slate-900 border border-slate-800 rounded-lg">
            <AccordionItem value="filters" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Funnel className="w-5 h-5 text-slate-400" />
                  <span className="text-white">Filtra Partite</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Torneo</label>
                    <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Seleziona torneo" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {tournaments.map((tournament) => (
                          <SelectItem key={tournament.id} value={tournament.id} className="text-white">
                            {tournament.icon} {tournament.name} {tournament.count > 0 && `(${tournament.count})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Superficie</label>
                    <Select value={selectedSurface} onValueChange={setSelectedSurface}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Seleziona superficie" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {surfaces.map((surface) => (
                          <SelectItem key={surface.id} value={surface.id} className="text-white">
                            {surface.icon} {surface.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tournaments.slice(0, 4).map((tournament) => (
                      <Button
                        key={tournament.id}
                        variant={selectedTournament === tournament.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTournament(tournament.id)}
                        className={
                          selectedTournament === tournament.id
                            ? "bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                        }
                      >
                        {tournament.icon} {tournament.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <Tabs defaultValue="winner" className="mb-8">
          <TabsList className="bg-slate-900 mb-6">
            <TabsTrigger
              value="winner"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              Vincente
            </TabsTrigger>
            <TabsTrigger
              value="sets"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              Totale Set
            </TabsTrigger>
            <TabsTrigger
              value="handicap"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              Handicap
            </TabsTrigger>
          </TabsList>
          <TabsContent value="winner">
            <div className="hidden lg:block">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-slate-900 border-slate-800 mb-4 hover:border-green-500 transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.tournament}
                            </Badge>
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                              {match.surface}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.round}
                            </Badge>
                            {match.isLive && <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>}
                          </div>
                          <div
                            className="text-white cursor-pointer hover:text-green-500 transition-colors"
                            onClick={() => onMatchClick?.(match.id)}
                          >
                            <span className="font-medium">{match.player1}</span>
                            <span className="text-slate-500 mx-2">vs</span>
                            <span className="font-medium">{match.player2}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">{match.date}</div>
                        <div className="text-white">{match.time}</div>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400">Bookmaker</TableHead>
                          <TableHead className="text-center text-slate-400">{match.player1}</TableHead>
                          <TableHead className="text-center text-slate-400">{match.player2}</TableHead>
                          <TableHead className="text-slate-400" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries<any>(match.odds).map(([bookmaker, odds]) => {
                          const isBestPlayer1 = odds.player1 === getBestOdd(match, "player1");
                          const isBestPlayer2 = odds.player2 === getBestOdd(match, "player2");
                          return (
                            <TableRow key={bookmaker} className="border-slate-800 hover:bg-slate-800/40">
                              <TableCell className="text-white capitalize">
                                {bookmaker.replace("sport888", "888sport")}
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className={`inline-block px-3 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${isBestPlayer1 ? "bg-green-500 text-slate-950 font-bold" : "text-slate-300"}`}
                                  onClick={() => handleOddsClick(match, "1", bookmaker, odds.player1)}
                                >
                                  {odds.player1.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className={`inline-block px-3 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${isBestPlayer2 ? "bg-green-500 text-slate-950 font-bold" : "text-slate-300"}`}
                                  onClick={() => handleOddsClick(match, "2", bookmaker, odds.player2)}
                                >
                                  {odds.player2.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                                >
                                  Scommetti
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">
                              {"Migliore Quota "}
                              {match.player1}
                            </div>
                            <div className="text-green-500">
                              {getBestOdd(match, "player1").toFixed(2)}
                              <span className="text-slate-500 text-xs ml-1">
                                ({getBestBookmakerName(match, "player1").replace("sport888", "888sport")})
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">
                              {"Migliore Quota "}
                              {match.player2}
                            </div>
                            <div className="text-green-500">
                              {getBestOdd(match, "player2").toFixed(2)}
                              <span className="text-slate-500 text-xs ml-1">
                                ({getBestBookmakerName(match, "player2").replace("sport888", "888sport")})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMatchClick?.(match.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white border-0 cursor-pointer"
                        >
                          Vedi Dettagli
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="lg:hidden space-y-4">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-slate-900 border-slate-800 cursor-pointer hover:border-green-500 transition-all"
                  onClick={() => onMatchClick?.(match.id)}
                >
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {match.tournament}
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-xs">
                        {match.surface}
                      </Badge>
                      <div className="text-slate-400 text-sm ml-auto">
                        {match.date} {match.time}
                      </div>
                    </div>
                    <div className="text-white mb-4">
                      <div className="mb-2">{match.player1}</div>
                      <div className="text-slate-500 text-sm mb-2">vs</div>
                      <div>{match.player2}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Migliori Quote:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className="bg-slate-800 rounded p-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "player1");
                            handleOddsClick(match, "1", best.name, best.value);
                          }}
                        >
                          <div className="text-slate-400 text-xs mb-1 truncate">{match.player1}</div>
                          <div className="text-green-500">{getBestBookmaker(match, "player1").value.toFixed(2)}</div>
                          <div className="text-slate-500 text-xs mt-1">{getBestBookmaker(match, "player1").name}</div>
                        </div>
                        <div
                          className="bg-slate-800 rounded p-3 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "player2");
                            handleOddsClick(match, "2", best.name, best.value);
                          }}
                        >
                          <div className="text-slate-400 text-xs mb-1 truncate">{match.player2}</div>
                          <div className="text-green-500">{getBestBookmaker(match, "player2").value.toFixed(2)}</div>
                          <div className="text-slate-500 text-xs mt-1">{getBestBookmaker(match, "player2").name}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMatchClick?.(match.id);
                      }}
                    >
                      Confronta Tutte le Quote
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sets">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Totale Set</div>
              <p className="text-slate-500">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
          <TabsContent value="handicap">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Handicap Set</div>
              <p className="text-slate-500">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="p-6">
            <h3 className="text-blue-400 mb-2">Quote Tennis in Tempo Reale</h3>
            <p className="text-slate-300 text-sm mb-3">
              Il tennis offre ottime opportunità di scommessa con quote che variano significativamente tra i bookmaker.
              La superficie di gioco è un fattore cruciale: alcuni giocatori eccellono sulla terra battuta, altri sul
              cemento o l'erba.
            </p>
            <p className="text-slate-400 text-sm">
              Confronta sempre le quote prima di scommettere e considera le statistiche head-to-head, la forma recente e
              la superficie del torneo per fare scelte informate.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
