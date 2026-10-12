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
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    date: "Oggi",
    time: "17:30",
    competition: "Premier League",
    isLive: false,
    odds: {
      bet365: {
        home: 2.45,
        draw: 3.2,
        away: 2.85,
      },
      betway: {
        home: 2.4,
        draw: 3.25,
        away: 2.95,
      },
      sport888: {
        home: 2.38,
        draw: 3.15,
        away: 2.92,
      },
      unibet: {
        home: 2.42,
        draw: 3.3,
        away: 2.88,
      },
      williamhill: {
        home: 2.35,
        draw: 3.18,
        away: 3.02,
      },
    },
  },
  {
    id: "2",
    homeTeam: "Manchester City",
    awayTeam: "Chelsea",
    date: "Oggi",
    time: "19:30",
    competition: "Premier League",
    odds: {
      bet365: {
        home: 1.65,
        draw: 4.2,
        away: 5.5,
      },
      betway: {
        home: 1.62,
        draw: 4.35,
        away: 5.75,
      },
      sport888: {
        home: 1.72,
        draw: 4.1,
        away: 5.4,
      },
      unibet: {
        home: 1.64,
        draw: 4.25,
        away: 5.82,
      },
      williamhill: {
        home: 1.66,
        draw: 4.15,
        away: 5.45,
      },
    },
  },
  {
    id: "3",
    homeTeam: "Real Madrid",
    awayTeam: "Bayern Munich",
    date: "Oggi",
    time: "21:00",
    competition: "Champions League",
    odds: {
      bet365: {
        home: 2.1,
        draw: 3.4,
        away: 3.5,
      },
      betway: {
        home: 2.08,
        draw: 3.35,
        away: 3.45,
      },
      sport888: {
        home: 2.05,
        draw: 3.52,
        away: 3.62,
      },
      unibet: {
        home: 2.12,
        draw: 3.38,
        away: 3.48,
      },
      williamhill: {
        home: 2.18,
        draw: 3.42,
        away: 3.55,
      },
    },
  },
  {
    id: "4",
    homeTeam: "Barcelona",
    awayTeam: "Atletico Madrid",
    date: "Domani",
    time: "21:00",
    competition: "La Liga",
    odds: {
      bet365: {
        home: 1.85,
        draw: 3.6,
        away: 4.3,
      },
      betway: {
        home: 1.82,
        draw: 3.55,
        away: 4.2,
      },
      sport888: {
        home: 1.88,
        draw: 3.72,
        away: 4.18,
      },
      unibet: {
        home: 1.9,
        draw: 3.58,
        away: 4.28,
      },
      williamhill: {
        home: 1.78,
        draw: 3.62,
        away: 4.48,
      },
    },
  },
  {
    id: "5",
    homeTeam: "Inter Milan",
    awayTeam: "Juventus",
    date: "Domani",
    time: "20:45",
    competition: "Serie A",
    odds: {
      bet365: {
        home: 2.2,
        draw: 3.3,
        away: 3.18,
      },
      betway: {
        home: 2.25,
        draw: 3.25,
        away: 3.2,
      },
      sport888: {
        home: 2.18,
        draw: 3.42,
        away: 3.28,
      },
      unibet: {
        home: 2.32,
        draw: 3.28,
        away: 3.22,
      },
      williamhill: {
        home: 2.15,
        draw: 3.32,
        away: 3.38,
      },
    },
  },
  {
    id: "6",
    homeTeam: "AC Milan",
    awayTeam: "Napoli",
    date: "Domani",
    time: "18:00",
    competition: "Serie A",
    odds: {
      bet365: {
        home: 2.55,
        draw: 3.3,
        away: 2.68,
      },
      betway: {
        home: 2.65,
        draw: 3.25,
        away: 2.7,
      },
      sport888: {
        home: 2.52,
        draw: 3.35,
        away: 2.78,
      },
      unibet: {
        home: 2.58,
        draw: 3.48,
        away: 2.72,
      },
      williamhill: {
        home: 2.54,
        draw: 3.32,
        away: 2.85,
      },
    },
  },
];

const competitions = [
  {
    id: "all",
    name: "Tutte le Competizioni",
    icon: "\u26BD",
    count: matches.length,
  },
  {
    id: "premier-league",
    name: "Premier League",
    icon: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    count: 2,
  },
  {
    id: "champions-league",
    name: "Champions League",
    icon: "\u{1F3C6}",
    count: 1,
  },
  {
    id: "serie-a",
    name: "Serie A",
    icon: "\u{1F1EE}\u{1F1F9}",
    count: 2,
  },
  {
    id: "la-liga",
    name: "La Liga",
    icon: "\u{1F1EA}\u{1F1F8}",
    count: 1,
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    icon: "\u{1F1E9}\u{1F1EA}",
    count: 0,
  },
];

export function FootballPage({ onMatchClick }: { onMatchClick?: (matchId: string) => void }) {
  const [selectedCompetition, setSelectedCompetition] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const { addSelection } = useBetSlip();
  const bookmakerNames = ["bet365", "betway", "sport888", "unibet", "williamhill"];
  const getBookmakerName = (index) => bookmakerNames[index % bookmakerNames.length];
  const handleOddsClick = (match, betType, bookmaker, odds) => {
    const betTypeLabels = {
      1: `Vincente ${match.homeTeam}`,
      X: "Pareggio",
      2: `Vincente ${match.awayTeam}`,
    };
    const allBookmakers = Object.entries<any>(match.odds)
      .map(([name, bookmakerOdds]) => ({
        name: name,
        odds: betType === "1" ? bookmakerOdds.home : betType === "X" ? bookmakerOdds.draw : bookmakerOdds.away,
      }))
      .sort((a, b) => b.odds - a.odds);
    addSelection({
      id: `${match.id}-${betType}`,
      matchId: match.id,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      time: `${match.date} ${match.time}`,
      betType: betType,
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
  const getWorstOdd = (match, outcome) => {
    const allOdds = Object.values(match.odds);
    return Math.min(...allOdds.map((odds) => odds[outcome]));
  };
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
            <h1 className="text-white text-4xl">Quote Calcio</h1>
          </div>
          <p className="text-slate-400 text-lg mb-6">
            Confronta le migliori quote calcio dai principali bookmaker in tempo reale
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
                <div className="text-slate-400 text-sm">Competizioni</div>
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
                <label className="text-slate-400 text-sm mb-2 block">Competizione</label>
                <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Seleziona competizione" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {competitions.map((competition) => (
                      <SelectItem key={competition.id} value={competition.id} className="text-white">
                        {competition.icon} {competition.name} {competition.count > 0 && `(${competition.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Data</label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Seleziona data" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">
                      Tutte le Date
                    </SelectItem>
                    <SelectItem value="today" className="text-white">
                      Oggi
                    </SelectItem>
                    <SelectItem value="tomorrow" className="text-white">
                      Domani
                    </SelectItem>
                    <SelectItem value="week" className="text-white">
                      Questa Settimana
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {competitions.slice(0, 5).map((competition) => (
                <Button
                  key={competition.id}
                  variant={selectedCompetition === competition.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompetition(competition.id)}
                  className={
                    selectedCompetition === competition.id
                      ? "bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  }
                >
                  {competition.icon} {competition.name}
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
                    <label className="text-slate-400 text-sm mb-2 block">Competizione</label>
                    <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Seleziona competizione" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {competitions.map((competition) => (
                          <SelectItem key={competition.id} value={competition.id} className="text-white">
                            {competition.icon} {competition.name} {competition.count > 0 && `(${competition.count})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Data</label>
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Seleziona data" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">
                          Tutte le Date
                        </SelectItem>
                        <SelectItem value="today" className="text-white">
                          Oggi
                        </SelectItem>
                        <SelectItem value="tomorrow" className="text-white">
                          Domani
                        </SelectItem>
                        <SelectItem value="week" className="text-white">
                          Questa Settimana
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {competitions.slice(0, 5).map((competition) => (
                      <Button
                        key={competition.id}
                        variant={selectedCompetition === competition.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCompetition(competition.id)}
                        className={
                          selectedCompetition === competition.id
                            ? "bg-green-500 hover:bg-green-600 text-slate-950 cursor-pointer"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                        }
                      >
                        {competition.icon} {competition.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <Tabs defaultValue="1x2" className="mb-8">
          <TabsList className="bg-slate-900 mb-6">
            <TabsTrigger
              value="1x2"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              1X2
            </TabsTrigger>
            <TabsTrigger
              value="ou"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              Over/Under
            </TabsTrigger>
            <TabsTrigger
              value="btts"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              BTTS
            </TabsTrigger>
            <TabsTrigger
              value="handicap"
              className="text-white data-[state=active]:bg-green-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
            >
              Handicap
            </TabsTrigger>
          </TabsList>
          <TabsContent value="1x2">
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
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.competition}
                            </Badge>
                            {match.isLive && <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>}
                          </div>
                          <div
                            className="text-white cursor-pointer hover:text-green-500 transition-colors"
                            onClick={() => onMatchClick?.(match.id)}
                          >
                            <span>{match.homeTeam}</span>
                            <span className="text-slate-500 mx-2">vs</span>
                            <span>{match.awayTeam}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">{match.date}</div>
                        <div className="text-white">{match.time}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 bg-slate-800 border-slate-700 text-slate-300 hover:bg-green-500 hover:text-slate-950 hover:border-green-500"
                          onClick={() => onMatchClick?.(match.id)}
                        >
                          Vedi Dettagli
                        </Button>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400">Bookmaker</TableHead>
                          <TableHead className="text-center text-slate-400">1</TableHead>
                          <TableHead className="text-center text-slate-400">X</TableHead>
                          <TableHead className="text-center text-slate-400">2</TableHead>
                          <TableHead className="text-slate-400" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries<any>(match.odds).map(([bookmaker, odds]) => {
                          const isBestHome = odds.home === getBestOdd(match, "home");
                          const isBestDraw = odds.draw === getBestOdd(match, "draw");
                          const isBestAway = odds.away === getBestOdd(match, "away");
                          return (
                            <TableRow key={bookmaker} className="border-slate-800 hover:bg-slate-800/40">
                              <TableCell className="text-white capitalize">
                                {bookmaker.replace("sport888", "888sport")}
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className={`inline-block px-3 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${isBestHome ? "bg-green-500 text-slate-950 font-bold" : "text-slate-300"}`}
                                  onClick={() => handleOddsClick(match, "1", bookmaker, odds.home)}
                                >
                                  {odds.home.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className={`inline-block px-3 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${isBestDraw ? "bg-green-500 text-slate-950 font-bold" : "text-slate-300"}`}
                                  onClick={() => handleOddsClick(match, "X", bookmaker, odds.draw)}
                                >
                                  {odds.draw.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className={`inline-block px-3 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${isBestAway ? "bg-green-500 text-slate-950 font-bold" : "text-slate-300"}`}
                                  onClick={() => handleOddsClick(match, "2", bookmaker, odds.away)}
                                >
                                  {odds.away.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
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
                        <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">Migliore Quota 1</div>
                            <div className="text-green-500">
                              {getBestOdd(match, "home").toFixed(2)}
                              <span className="text-slate-500 text-xs ml-1">
                                ({getBestBookmakerName(match, "home").replace("sport888", "888sport")})
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">Migliore Quota X</div>
                            <div className="text-green-500">
                              {getBestOdd(match, "draw").toFixed(2)}
                              <span className="text-slate-500 text-xs ml-1">
                                ({getBestBookmakerName(match, "draw").replace("sport888", "888sport")})
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">Migliore Quota 2</div>
                            <div className="text-green-500">
                              {getBestOdd(match, "away").toFixed(2)}
                              <span className="text-slate-500 text-xs ml-1">
                                ({getBestBookmakerName(match, "away").replace("sport888", "888sport")})
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
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {match.competition}
                      </Badge>
                      <div className="text-slate-400 text-sm">
                        {match.date} {match.time}
                      </div>
                    </div>
                    <div className="text-white mb-4">
                      <div className="mb-1">{match.homeTeam}</div>
                      <div>{match.awayTeam}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Migliori Quote:</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div
                          className="bg-slate-800 rounded p-2 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "home");
                            handleOddsClick(match, "1", best.name, best.value);
                          }}
                        >
                          <div className="text-slate-400 text-xs mb-1">1</div>
                          <div className="text-green-500">{getBestBookmaker(match, "home").value.toFixed(2)}</div>
                          <div className="text-slate-500 text-xs mt-1">{getBestBookmaker(match, "home").name}</div>
                        </div>
                        <div
                          className="bg-slate-800 rounded p-2 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "draw");
                            handleOddsClick(match, "X", best.name, best.value);
                          }}
                        >
                          <div className="text-slate-400 text-xs mb-1">X</div>
                          <div className="text-green-500">{getBestBookmaker(match, "draw").value.toFixed(2)}</div>
                          <div className="text-slate-500 text-xs mt-1">{getBestBookmaker(match, "draw").name}</div>
                        </div>
                        <div
                          className="bg-slate-800 rounded p-2 text-center cursor-pointer hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "away");
                            handleOddsClick(match, "2", best.name, best.value);
                          }}
                        >
                          <div className="text-slate-400 text-xs mb-1">2</div>
                          <div className="text-green-500">{getBestBookmaker(match, "away").value.toFixed(2)}</div>
                          <div className="text-slate-500 text-xs mt-1">{getBestBookmaker(match, "away").name}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
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
          <TabsContent value="ou">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Over/Under</div>
              <p className="text-slate-500">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
          <TabsContent value="btts">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote BTTS (Goal/No Goal)</div>
              <p className="text-slate-500">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
          <TabsContent value="handicap">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Handicap</div>
              <p className="text-slate-500">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="p-6">
            <h3 className="text-blue-400 mb-2">Perché Confrontare le Quote?</h3>
            <p className="text-slate-300 text-sm mb-3">
              Confrontare le quote di calcio ti permette di massimizzare le tue vincite potenziali. Anche piccole
              differenze nelle quote possono fare una grande differenza nel lungo periodo.
            </p>
            <p className="text-slate-400 text-sm">
              Le nostre tabelle mostrano in tempo reale le migliori quote disponibili da tutti i principali bookmaker,
              evidenziando automaticamente le opzioni più vantaggiose per te.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
