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
    player1: "Novak Djokovic",
    player2: "Carlos Alcaraz",
    date: "Oggi",
    time: "14:00",
    tournament: "ATP Masters 1000 - Roma",
    surface: "Terra",
    round: "Finale",
    odds: placeholderOdds({ player1: "[QUOTA_1]", player2: "[QUOTA_2]" }),
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
    odds: placeholderOdds({ player1: "[QUOTA_1]", player2: "[QUOTA_2]" }),
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
    odds: placeholderOdds({ player1: "[QUOTA_1]", player2: "[QUOTA_2]" }),
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
    odds: placeholderOdds({ player1: "[QUOTA_1]", player2: "[QUOTA_2]" }),
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
    odds: placeholderOdds({ player1: "[QUOTA_1]", player2: "[QUOTA_2]" }),
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
    odds: placeholderOdds({ player1: "[QUOTA_1]", player2: "[QUOTA_2]" }),
  },
];

const tournaments = [
  {
    id: "all",
    name: "Tutti i tornei",
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
    name: "Tutte le superfici",
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
  const handleOddsClick = (match, betType, bookmaker, odds) => {
    const betTypeLabels = {
      1: `Vincente ${match.player1}`,
      2: `Vincente ${match.player2}`,
    };
    const outcome = betType === "1" ? "player1" : "player2";
    const allBookmakers = Object.entries(match.odds as OddsByOperator).map(([operatorId, o]) => ({
      operatorId,
      odds: o[outcome],
    }));
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
  // Odds may be numbers or placeholders ("[QUOTA_1]"): see src/lib/odds.ts.
  const oddsList = (match, outcome: string) => Object.values(match.odds as OddsByOperator).map((o) => o[outcome]);
  const getBestOdd = (match, outcome: string) => bestValue(oddsList(match, outcome));
  const getBestBookmaker = (match, outcome: string) => {
    const best = bestEntry(match.odds, outcome);
    return { operatorId: best.operatorId, name: getOperator(best.operatorId).name, value: best.value };
  };
  const getBestBookmakerName = (match, outcome: string) => getOperator(bestEntry(match.odds, outcome).operatorId).name;
  const betLabel = (match, betType: string) => `${betType === "1" ? match.player1 : match.player2} vincente`;
  const oddsAria = (match, betType: string, operatorId: string, value, isBest = false) =>
    `Aggiungi alla schedina: ${betLabel(match, betType)} a ${formatOdd(value)} su ${getOperator(operatorId).name}${isBest ? " (quota migliore)" : ""}`;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title="Quote tennis"
        subtitle="Le quote dei tornei ATP, WTA e Grand Slam a confronto tra gli operatori autorizzati"
        breadcrumb={[{ label: "Tennis" }]}
        meta={
          <MetaItems
            items={[
              `${matches.length} partite`,
              `${oddsOperators.length} operatori`,
              `${tournaments.length - 1} tornei`,
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
                <label className="text-slate-400 text-sm mb-2 block">Torneo</label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger aria-label="Torneo" className="bg-slate-800 border-slate-500 text-white">
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
                  <SelectTrigger aria-label="Superficie" className="bg-slate-800 border-slate-500 text-white">
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
                      ? "bg-selected hover:bg-selected text-selected-foreground cursor-pointer"
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
                  <span className="text-white">Filtra partite</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Torneo</label>
                    <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                      <SelectTrigger aria-label="Torneo" className="bg-slate-800 border-slate-500 text-white">
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
                      <SelectTrigger aria-label="Superficie" className="bg-slate-800 border-slate-500 text-white">
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
                            ? "bg-selected hover:bg-selected text-selected-foreground cursor-pointer"
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
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:font-bold"
            >
              Vincente
            </TabsTrigger>
            <TabsTrigger
              value="sets"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:font-bold"
            >
              Totale Set
            </TabsTrigger>
            <TabsTrigger
              value="handicap"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground data-[state=active]:font-bold"
            >
              Handicap
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
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.tournament}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.surface}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {match.round}
                            </Badge>
                            {match.isLive && <Badge className="bg-live text-white animate-pulse">LIVE</Badge>}
                          </div>
                          <button
                            type="button"
                            className="text-white cursor-pointer hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            aria-label={`Dettagli partita: ${match.player1} – ${match.player2}`}
                            onClick={() => onMatchClick?.(match.id)}
                          >
                            <span className="font-medium">{match.player1}</span>
                            <span className="text-slate-400 mx-2">vs</span>
                            <span className="font-medium">{match.player2}</span>
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
                          <TableHead className="text-center text-slate-400">{match.player1}</TableHead>
                          <TableHead className="text-center text-slate-400">{match.player2}</TableHead>
                          <TableHead className="text-slate-400">
                            <span className="sr-only">Azioni</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries<any>(match.odds).map(([bookmaker, odds], rowIndex) => {
                          const isBestPlayer1 = isBestAt(oddsList(match, "player1"), rowIndex);
                          const isBestPlayer2 = isBestAt(oddsList(match, "player2"), rowIndex);
                          return (
                            <TableRow key={bookmaker} className="border-slate-800 hover:bg-slate-800/40">
                              <TableCell className="text-white capitalize">{getOperator(bookmaker).name}</TableCell>
                              <TableCell className="text-center">
                                <button
                                  type="button"
                                  className={`inline-block px-3 py-1.5 rounded tabular-nums cursor-pointer hover:opacity-80 transition-opacity ${isBestPlayer1 ? "bg-best text-best-foreground font-bold" : "text-slate-300"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action`}
                                  aria-label={oddsAria(match, "1", bookmaker, odds.player1, isBestPlayer1)}
                                  onClick={() => handleOddsClick(match, "1", bookmaker, odds.player1)}
                                >
                                  {formatOdd(odds.player1)}
                                  {isBestPlayer1 && (
                                    <Check className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden="true" />
                                  )}
                                </button>
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  type="button"
                                  className={`inline-block px-3 py-1.5 rounded tabular-nums cursor-pointer hover:opacity-80 transition-opacity ${isBestPlayer2 ? "bg-best text-best-foreground font-bold" : "text-slate-300"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action`}
                                  aria-label={oddsAria(match, "2", bookmaker, odds.player2, isBestPlayer2)}
                                  onClick={() => handleOddsClick(match, "2", bookmaker, odds.player2)}
                                >
                                  {formatOdd(odds.player2)}
                                  {isBestPlayer2 && (
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
                            <div className="text-slate-400 mb-1">
                              {"Migliore quota "}
                              {match.player1}
                            </div>
                            <div className="text-best tabular-nums">
                              {formatOdd(getBestOdd(match, "player1"))}
                              <span className="text-slate-400 text-xs ml-1">
                                ({getBestBookmakerName(match, "player1")})
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-slate-400 mb-1">
                              {"Migliore quota "}
                              {match.player2}
                            </div>
                            <div className="text-best tabular-nums">
                              {formatOdd(getBestOdd(match, "player2"))}
                              <span className="text-slate-400 text-xs ml-1">
                                ({getBestBookmakerName(match, "player2")})
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
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {match.tournament}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {match.surface}
                      </Badge>
                      <div className="text-slate-400 text-sm ml-auto">
                        {match.date} {match.time}
                      </div>
                    </div>
                    <div className="text-white mb-4">
                      <div className="mb-2">{match.player1}</div>
                      <div className="text-slate-400 text-sm mb-2">vs</div>
                      <div>{match.player2}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Migliori quote:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className="bg-slate-800 rounded p-3 text-center cursor-pointer hover:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                          aria-label={oddsAria(
                            match,
                            "1",
                            getBestBookmaker(match, "player1").operatorId,
                            getBestBookmaker(match, "player1").value,
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "player1");
                            handleOddsClick(match, "1", best.operatorId, best.value);
                          }}
                        >
                          <span className="block text-slate-400 text-xs mb-1 truncate">{match.player1}</span>
                          <span className="block text-best tabular-nums">
                            {formatOdd(getBestBookmaker(match, "player1").value)}
                          </span>
                          <span className="block text-slate-400 text-sm mt-1 truncate">
                            {getBestBookmaker(match, "player1").name}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="bg-slate-800 rounded p-3 text-center cursor-pointer hover:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                          aria-label={oddsAria(
                            match,
                            "2",
                            getBestBookmaker(match, "player2").operatorId,
                            getBestBookmaker(match, "player2").value,
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            const best = getBestBookmaker(match, "player2");
                            handleOddsClick(match, "2", best.operatorId, best.value);
                          }}
                        >
                          <span className="block text-slate-400 text-xs mb-1 truncate">{match.player2}</span>
                          <span className="block text-best tabular-nums">
                            {formatOdd(getBestBookmaker(match, "player2").value)}
                          </span>
                          <span className="block text-slate-400 text-sm mt-1 truncate">
                            {getBestBookmaker(match, "player2").name}
                          </span>
                        </button>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-action hover:bg-action-hover text-action-foreground cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMatchClick?.(match.id);
                      }}
                    >
                      Confronta tutte le quote
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sets">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote Totale Set</div>
              <p className="text-slate-400">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
          <TabsContent value="handicap">
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <div className="text-slate-400 mb-2">Quote handicap set</div>
              <p className="text-slate-400">Funzionalità in arrivo...</p>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="p-6">
            <h3 className="text-blue-400 mb-2">Quote tennis a confronto</h3>
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
