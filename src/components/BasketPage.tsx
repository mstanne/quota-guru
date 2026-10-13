import { useState } from "react";
import { Check, Funnel, TrendingUp, Trophy } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useBetSlip } from "../context/BetSlipContext";
import { getOperator } from "../data/operators";
import { bestEntry, bestValue, formatOdd, isBestAt, placeholderOdds, type OddsByOperator } from "../lib/odds";
import { OperatorCta } from "./operator/OperatorUi";
import { PageHeader, MetaItems } from "./layout/PageHeader";
import { oddsOperators } from "../data/operators";

// Mock data – replace with a real odds feed/API.
const matches: any[] = [
  {
    id: "1",
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Boston Celtics",
    date: "Oggi",
    time: "02:00",
    competition: "NBA",
    odds: placeholderOdds({ home: "[QUOTA_1]", away: "[QUOTA_2]" }),
    handicap: { line: "[LINEA_HANDICAP]", home: "[QUOTA_HANDICAP_1]", away: "[QUOTA_HANDICAP_2]" },
    overUnder: { line: "[LINEA_OVER_UNDER]", over: "[QUOTA_OVER]", under: "[QUOTA_UNDER]" },
  },
  {
    id: "2",
    homeTeam: "Golden State Warriors",
    awayTeam: "Phoenix Suns",
    date: "Oggi",
    time: "03:30",
    competition: "NBA",
    odds: placeholderOdds({ home: "[QUOTA_1]", away: "[QUOTA_2]" }),
    handicap: { line: "[LINEA_HANDICAP]", home: "[QUOTA_HANDICAP_1]", away: "[QUOTA_HANDICAP_2]" },
    overUnder: { line: "[LINEA_OVER_UNDER]", over: "[QUOTA_OVER]", under: "[QUOTA_UNDER]" },
  },
  {
    id: "3",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    date: "Oggi",
    time: "20:45",
    competition: "Euroleague",
    odds: placeholderOdds({ home: "[QUOTA_1]", away: "[QUOTA_2]" }),
    handicap: { line: "[LINEA_HANDICAP]", home: "[QUOTA_HANDICAP_1]", away: "[QUOTA_HANDICAP_2]" },
    overUnder: { line: "[LINEA_OVER_UNDER]", over: "[QUOTA_OVER]", under: "[QUOTA_UNDER]" },
  },
  {
    id: "4",
    homeTeam: "Olimpia Milano",
    awayTeam: "Virtus Bologna",
    date: "Oggi",
    time: "20:30",
    competition: "Serie A",
    odds: placeholderOdds({ home: "[QUOTA_1]", away: "[QUOTA_2]" }),
    handicap: { line: "[LINEA_HANDICAP]", home: "[QUOTA_HANDICAP_1]", away: "[QUOTA_HANDICAP_2]" },
    overUnder: { line: "[LINEA_OVER_UNDER]", over: "[QUOTA_OVER]", under: "[QUOTA_UNDER]" },
  },
  {
    id: "5",
    homeTeam: "Milwaukee Bucks",
    awayTeam: "Denver Nuggets",
    date: "Domani",
    time: "02:30",
    competition: "NBA",
    odds: placeholderOdds({ home: "[QUOTA_1]", away: "[QUOTA_2]" }),
    handicap: { line: "[LINEA_HANDICAP]", home: "[QUOTA_HANDICAP_1]", away: "[QUOTA_HANDICAP_2]" },
    overUnder: { line: "[LINEA_OVER_UNDER]", over: "[QUOTA_OVER]", under: "[QUOTA_UNDER]" },
  },
  {
    id: "6",
    homeTeam: "Panathinaikos",
    awayTeam: "Olympiacos",
    date: "Domani",
    time: "19:00",
    competition: "Euroleague",
    odds: placeholderOdds({ home: "[QUOTA_1]", away: "[QUOTA_2]" }),
    handicap: { line: "[LINEA_HANDICAP]", home: "[QUOTA_HANDICAP_1]", away: "[QUOTA_HANDICAP_2]" },
    overUnder: { line: "[LINEA_OVER_UNDER]", over: "[QUOTA_OVER]", under: "[QUOTA_UNDER]" },
  },
];

const competitions = [
  {
    id: "all",
    name: "Tutte le competizioni",
    icon: "\u{1F3C0}",
    count: matches.length,
  },
  {
    id: "nba",
    name: "NBA",
    icon: "\u{1F1FA}\u{1F1F8}",
    count: 3,
  },
  {
    id: "euroleague",
    name: "Euroleague",
    icon: "\u{1F3C6}",
    count: 2,
  },
  {
    id: "serie-a",
    name: "Serie A",
    icon: "\u{1F1EE}\u{1F1F9}",
    count: 1,
  },
  {
    id: "eurocup",
    name: "EuroCup",
    icon: "\u{1F948}",
    count: 0,
  },
  {
    id: "ncaa",
    name: "NCAA",
    icon: "\u{1F393}",
    count: 0,
  },
];

export function BasketPage({ onMatchClick }: { onMatchClick?: (matchId: string) => void }) {
  const [selectedCompetition, setSelectedCompetition] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const { addSelection } = useBetSlip();
  const handleOddsClick = (match, betType, bookmaker, odds) => {
    const betTypeLabels = {
      1: `Vincente ${match.homeTeam}`,
      2: `Vincente ${match.awayTeam}`,
    };
    const outcome = betType === "1" ? "home" : "away";
    const allBookmakers = Object.entries(match.odds as OddsByOperator).map(([operatorId, o]) => ({
      operatorId,
      odds: o[outcome],
    }));
    addSelection({
      id: `${match.id}-${betType}`,
      matchId: match.id,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      time: `${match.date} ${match.time}`,
      betType: betType === "1" ? "1" : "2",
      betTypeLabel: betTypeLabels[betType],
      selectedBookmaker: bookmaker,
      selectedOdds: odds,
      allBookmakers: allBookmakers,
    });
  };
  // Odds may be numbers or placeholders ("[QUOTA_1]"): see src/lib/odds.ts.
  const oddsList = (match, outcome: string) => Object.values(match.odds as OddsByOperator).map((o) => o[outcome]);
  const getBestOdd = (match, outcome: string) => bestValue(oddsList(match, outcome));
  const getBestBookmaker = (match, outcome: string) => {
    const best = bestEntry(match.odds, outcome);
    return { operatorId: best.operatorId, name: getOperator(best.operatorId).name, value: best.value };
  };
  const getBestBookmakerName = (match, outcome: string) => getOperator(bestEntry(match.odds, outcome).operatorId).name;
  const betLabel = (match, betType: string) => `${betType === "1" ? match.homeTeam : match.awayTeam} vincente`;
  const oddsAria = (match, betType: string, operatorId: string, value, isBest = false) =>
    `Aggiungi alla schedina: ${betLabel(match, betType)} a ${formatOdd(value)} su ${getOperator(operatorId).name}${isBest ? " (quota migliore)" : ""}`;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title="Quote basket"
        subtitle="Le quote di NBA, Eurolega, Serie A e degli altri campionati a confronto tra gli operatori autorizzati"
        breadcrumb={[{ label: "Basket" }]}
        meta={
          <MetaItems
            items={[
              `${matches.length} partite`,
              `${oddsOperators.length} operatori`,
              `${competitions.length - 1} competizioni`,
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-8">
        <Card className="hidden md:block bg-slate-900 border-slate-800 mb-8">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Funnel className="w-5 h-5 text-slate-400" />
              <h2 className="text-white text-xl">Filtra partite</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Competizione</label>
                <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                  <SelectTrigger aria-label="Competizione" className="bg-slate-800 border-slate-500 text-white">
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
                  <SelectTrigger aria-label="Data" className="bg-slate-800 border-slate-500 text-white">
                    <SelectValue placeholder="Seleziona data" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">
                      Tutte le date
                    </SelectItem>
                    <SelectItem value="today" className="text-white">
                      Oggi
                    </SelectItem>
                    <SelectItem value="tomorrow" className="text-white">
                      Domani
                    </SelectItem>
                    <SelectItem value="week" className="text-white">
                      Questa settimana
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {competitions.slice(0, 4).map((competition) => (
                <Button
                  key={competition.id}
                  variant={selectedCompetition === competition.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompetition(competition.id)}
                  className={
                    selectedCompetition === competition.id
                      ? "bg-selected hover:bg-selected text-selected-foreground cursor-pointer"
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
                  <span className="text-white">Filtra partite</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Competizione</label>
                    <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                      <SelectTrigger aria-label="Competizione" className="bg-slate-800 border-slate-500 text-white">
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
                      <SelectTrigger aria-label="Data" className="bg-slate-800 border-slate-500 text-white">
                        <SelectValue placeholder="Seleziona data" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">
                          Tutte le date
                        </SelectItem>
                        <SelectItem value="today" className="text-white">
                          Oggi
                        </SelectItem>
                        <SelectItem value="tomorrow" className="text-white">
                          Domani
                        </SelectItem>
                        <SelectItem value="week" className="text-white">
                          Questa settimana
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {competitions.slice(0, 4).map((competition) => (
                      <Button
                        key={competition.id}
                        variant={selectedCompetition === competition.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCompetition(competition.id)}
                        className={
                          selectedCompetition === competition.id
                            ? "bg-selected hover:bg-selected text-selected-foreground cursor-pointer"
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
        <Tabs defaultValue="winner" className="mb-8">
          <TabsList className="bg-slate-900 mb-6">
            <TabsTrigger
              value="winner"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:font-bold"
            >
              Vincente 1-2
            </TabsTrigger>
            <TabsTrigger
              value="handicap"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:font-bold"
            >
              Handicap
            </TabsTrigger>
            <TabsTrigger
              value="ou"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:font-bold"
            >
              Over/Under
            </TabsTrigger>
          </TabsList>
          <TabsContent value="winner">
            <div className="hidden lg:block">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-slate-900 border-slate-800 mb-4 hover:border-slate-500 transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.competition}
                            </Badge>
                            {match.isLive && <Badge className="bg-live text-white animate-pulse">LIVE</Badge>}
                          </div>
                          <button
                            type="button"
                            className="text-white cursor-pointer hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            aria-label={`Dettagli partita: ${match.homeTeam} – ${match.awayTeam}`}
                            onClick={() => onMatchClick?.(match.id)}
                          >
                            <span>{match.homeTeam}</span>
                            <span className="text-slate-400 mx-2">vs</span>
                            <span>{match.awayTeam}</span>
                          </button>
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
                          <TableHead className="text-center text-slate-400">1</TableHead>
                          <TableHead className="text-center text-slate-400">2</TableHead>
                          <TableHead className="text-slate-400">
                            <span className="sr-only">Azioni</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries<any>(match.odds).map(([bookmaker, odds], rowIndex) => {
                          const isBestHome = isBestAt(oddsList(match, "home"), rowIndex);
                          const isBestAway = isBestAt(oddsList(match, "away"), rowIndex);
                          return (
                            <TableRow key={bookmaker} className="border-slate-800 hover:bg-slate-800/40">
                              <TableCell className="text-white capitalize">{getOperator(bookmaker).name}</TableCell>
                              <TableCell className="text-center">
                                <button
                                  type="button"
                                  className={`inline-block px-3 py-1.5 rounded tabular-nums cursor-pointer hover:opacity-80 transition-opacity ${isBestHome ? "bg-best text-best-foreground font-bold" : "text-slate-300"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action`}
                                  aria-label={oddsAria(match, "1", bookmaker, odds.home, isBestHome)}
                                  onClick={() => handleOddsClick(match, "1", bookmaker, odds.home)}
                                >
                                  {formatOdd(odds.home)}
                                  {isBestHome && (
                                    <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                                  )}
                                </button>
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  type="button"
                                  className={`inline-block px-3 py-1.5 rounded tabular-nums cursor-pointer hover:opacity-80 transition-opacity ${isBestAway ? "bg-best text-best-foreground font-bold" : "text-slate-300"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action`}
                                  aria-label={oddsAria(match, "2", bookmaker, odds.away, isBestAway)}
                                  onClick={() => handleOddsClick(match, "2", bookmaker, odds.away)}
                                >
                                  {formatOdd(odds.away)}
                                  {isBestAway && (
                                    <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                                  )}
                                </button>
                              </TableCell>
                              <TableCell>
                                <OperatorCta
                                  placement="comparison-table"
                                  operator={getOperator(bookmaker)}
                                  label="Vai al sito"
                                  size="sm"
                                  className="bg-action hover:bg-action-hover text-action-foreground cursor-pointer"
                                />
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
                            <div className="text-slate-400 mb-1">Migliore quota 1</div>
                            <div className="text-best tabular-nums">
                              {formatOdd(getBestOdd(match, "home"))}
                              <span className="text-slate-400 text-xs ml-1">
                                ({getBestBookmakerName(match, "home")})
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">Migliore quota 2</div>
                            <div className="text-best tabular-nums">
                              {formatOdd(getBestOdd(match, "away"))}
                              <span className="text-slate-400 text-xs ml-1">
                                ({getBestBookmakerName(match, "away")})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMatchClick?.(match.id)}
                          className="bg-action hover:bg-action-hover text-action-foreground border-0 cursor-pointer"
                        >
                          Dettagli partita
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="lg:hidden space-y-4">
              {matches.map((match) => (
                <Card key={match.id} className="bg-slate-900 border-slate-800 transition-all">
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
                        <span className="text-slate-400">Migliori quote:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="bg-slate-800 rounded p-2 text-center cursor-pointer hover:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                          aria-label={oddsAria(
                            match,
                            "1",
                            getBestBookmaker(match, "home").operatorId,
                            getBestBookmaker(match, "home").value,
                          )}
                          onClick={() => {
                            const best = getBestBookmaker(match, "home");
                            handleOddsClick(match, "1", best.operatorId, best.value);
                          }}
                        >
                          <span className="block text-slate-400 text-xs mb-1">1</span>
                          <span className="block text-best tabular-nums">
                            {formatOdd(getBestBookmaker(match, "home").value)}
                          </span>
                          <span className="block text-slate-400 text-sm mt-1 truncate">
                            {getBestBookmaker(match, "home").name}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="bg-slate-800 rounded p-2 text-center cursor-pointer hover:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                          aria-label={oddsAria(
                            match,
                            "2",
                            getBestBookmaker(match, "away").operatorId,
                            getBestBookmaker(match, "away").value,
                          )}
                          onClick={() => {
                            const best = getBestBookmaker(match, "away");
                            handleOddsClick(match, "2", best.operatorId, best.value);
                          }}
                        >
                          <span className="block text-slate-400 text-xs mb-1">2</span>
                          <span className="block text-best tabular-nums">
                            {formatOdd(getBestBookmaker(match, "away").value)}
                          </span>
                          <span className="block text-slate-400 text-sm mt-1 truncate">
                            {getBestBookmaker(match, "away").name}
                          </span>
                        </button>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-action hover:bg-action-hover text-action-foreground cursor-pointer"
                      onClick={() => onMatchClick?.(match.id)}
                    >
                      Confronta tutte le quote
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="handicap">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote handicap</div>
              <p className="text-slate-400">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
          <TabsContent value="ou">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Over/Under punti totali</div>
              <p className="text-slate-400">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="p-6">
            <h3 className="text-blue-400 mb-2">Quote basket a confronto</h3>
            <p className="text-slate-300 text-sm mb-3">
              Il basket offre numerose opportunità di scommessa con quote che variano durante il giorno. L'NBA è il
              campionato più seguito al mondo, mentre l'Euroleague rappresenta l'eccellenza europea.
            </p>
            <p className="text-slate-400 text-sm">
              Nel basket americano (NBA) le partite sono ad alto punteggio, mentre in Europa il gioco è più difensivo.
              Considera sempre handicap e over/under come valide alternative alla scommessa 1X2.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
