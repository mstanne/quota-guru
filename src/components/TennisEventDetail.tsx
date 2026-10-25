import { ArrowLeft, ChartColumn, Clock, Info, MapPin, Target, TrendingUp, Tv } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { tourData } from "../lib/tennis";
import { modelSurface, tennisPrediction } from "../lib/tennisPredict";
import { pct } from "../lib/predictionsCore";
import { TennisModelNote, TennisPredictionResult } from "./tennis/TennisPrediction";

// Sample match page (mock data until a fixtures feed is connected). The prediction is real: it uses the
// current ATP ratings of the two players (src/lib/tennisPredict.ts).
const playerId = (name: string) => tourData("atp").rankings.find((r) => r.player.name === name)?.player.id;

export function TennisEventDetail({ onBack }: { onBack?: () => void }) {
  const match = {
    id: "1",
    player1: "Novak Djokovic",
    player2: "Carlos Alcaraz",
    tournament: "ATP Masters 1000 - Roma",
    date: "2025-06-15",
    time: "14:00",
    venue: "Foro Italico - Campo Centrale",
    surface: "Terra Battuta",
    round: "Finale",
  };
  const ids = [playerId(match.player1), playerId(match.player2)];
  const prediction =
    ids[0] && ids[1] ? tennisPrediction("atp", ids[0], ids[1], { surface: modelSurface("Clay"), bestOf: 3 }) : null;
  const favourite = prediction ? (prediction.p[0] >= prediction.p[1] ? 0 : 1) : null;

  const player1Form = ["W", "W", "L", "W", "W"];
  const player2Form = ["W", "W", "W", "L", "W"];
  const headToHead = [
    {
      date: "2024-10-12",
      player1: "Djokovic",
      score: "2-1",
      player2: "Alcaraz",
      tournament: "ATP Shanghai",
    },
    {
      date: "2024-07-14",
      player1: "Alcaraz",
      score: "2-1",
      player2: "Djokovic",
      tournament: "Wimbledon",
    },
    {
      date: "2024-06-09",
      player1: "Alcaraz",
      score: "2-0",
      player2: "Djokovic",
      tournament: "Roland Garros",
    },
    {
      date: "2023-11-19",
      player1: "Djokovic",
      score: "2-1",
      player2: "Alcaraz",
      tournament: "ATP Finals",
    },
    {
      date: "2023-07-16",
      player1: "Alcaraz",
      score: "2-1",
      player2: "Djokovic",
      tournament: "Wimbledon",
    },
  ];

  const playerStats = {
    player1: {
      ranking: 1,
      titlesYear: 4,
      winRate: 85.5,
      acesAvg: 8.2,
      firstServeWin: 78,
    },
    player2: {
      ranking: 2,
      titlesYear: 6,
      winRate: 88.3,
      acesAvg: 9.5,
      firstServeWin: 76,
    },
  };
  const broadcast = {
    tv: ["Sky Sport Tennis", "Sky Sport Uno", "SuperTennis"],
    streaming: ["NOW TV", "Sky Go", "SuperTenniX"],
    matchStart: "14:00",
    commentary: "Telecronaca di Stefano Pescosolido e commento tecnico di Paolo Bertolucci",
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
            Torna alle partite
          </Button>
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700">
                {match.tournament}
              </Badge>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                <Clock className="w-3 h-3 mr-1" />
                {match.date}
                {" - "}
                {match.time}
              </Badge>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {match.round}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
              <div className="text-center md:text-right">
                <div className="text-5xl mb-3" aria-hidden="true">
                  🎾
                </div>
                <h1 className="text-white text-3xl mb-2">{match.player1}</h1>
                <Badge className="bg-slate-700 text-white mb-2">Ranking #{playerStats.player1.ranking}</Badge>
                <div className="flex items-center justify-center md:justify-end gap-1">
                  {player1Form.map((result, index) => (
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
                <div className="text-5xl mb-3" aria-hidden="true">
                  🎾
                </div>
                <h1 className="text-white text-3xl mb-2">{match.player2}</h1>
                <Badge className="bg-slate-700 text-white mb-2">Ranking #{playerStats.player2.ranking}</Badge>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  {player2Form.map((result, index) => (
                    <Badge key={index} className={`${getFormColor(result)} text-xs`}>
                      {result}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{match.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎾</span>
                <span>{match.surface}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Titoli 2025</div>
              <div className="text-white text-2xl">
                {playerStats.player1.titlesYear}
                {" / "}
                {playerStats.player2.titlesYear}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">% Vittorie</div>
              <div className="text-white text-2xl">
                {playerStats.player1.winRate}
                {"% / "}
                {playerStats.player2.winRate}%
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Ace medi</div>
              <div className="text-white text-2xl">
                {playerStats.player1.acesAvg}
                {" / "}
                {playerStats.player2.acesAvg}
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">% prima di servizio</div>
              <div className="text-white text-2xl">
                {playerStats.player1.firstServeWin}
                {"% / "}
                {playerStats.player2.firstServeWin}%
              </div>
            </Card>
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="text-slate-400 text-sm mb-1">Favorito del modello</div>
              <div className="text-predict text-2xl tabular-nums flex items-center gap-1">
                <TrendingUp className="w-5 h-5" aria-hidden="true" />
                {prediction && favourite !== null ? pct(prediction.p[favourite]) : "–"}
              </div>
              {prediction && favourite !== null && (
                <div className="text-slate-400 text-xs mt-1 truncate">
                  {favourite === 0 ? match.player1 : match.player2}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="winner" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger
              value="winner"
              className="text-white data-[state=active]:bg-selected data-[state=active]:text-selected-foreground"
            >
              Pronostico
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
                  <ChartColumn className="w-6 h-6 text-slate-300" aria-hidden="true" />
                  <h2 className="text-white text-2xl">Pronostico del modello</h2>
                </div>
                {prediction ? (
                  <TennisPredictionResult prediction={prediction} a={match.player1} b={match.player2} />
                ) : (
                  <p className="text-slate-400">Pronostico non disponibile: uno dei giocatori non è nella top 100.</p>
                )}
                <TennisModelNote />
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
                        <div className="text-slate-400 text-sm mb-2">Orario di inizio</div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-slate-300" />
                          <span className="text-white text-xl">{broadcast.matchStart}</span>
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
                <h2 className="text-white text-2xl mb-6">Statistiche dei giocatori</h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Percentuale di vittorie 2025</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{playerStats.player1.winRate}%</span>
                        <span className="text-slate-500" aria-hidden="true">
                          |
                        </span>
                        <span className="text-white">{playerStats.player2.winRate}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-slate-200"
                        style={{
                          width: `${(playerStats.player1.winRate / (playerStats.player1.winRate + playerStats.player2.winRate)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-slate-500"
                        style={{
                          width: `${(playerStats.player2.winRate / (playerStats.player1.winRate + playerStats.player2.winRate)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Ace medi a partita</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{playerStats.player1.acesAvg}</span>
                        <span className="text-slate-500" aria-hidden="true">
                          |
                        </span>
                        <span className="text-white">{playerStats.player2.acesAvg}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-slate-200"
                        style={{
                          width: `${(playerStats.player1.acesAvg / (playerStats.player1.acesAvg + playerStats.player2.acesAvg)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-slate-500"
                        style={{
                          width: `${(playerStats.player2.acesAvg / (playerStats.player1.acesAvg + playerStats.player2.acesAvg)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">% punti vinti con la prima di servizio</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white">{playerStats.player1.firstServeWin}%</span>
                        <span className="text-slate-500" aria-hidden="true">
                          |
                        </span>
                        <span className="text-white">{playerStats.player2.firstServeWin}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-slate-400"
                        style={{
                          width: `${(playerStats.player1.firstServeWin / (playerStats.player1.firstServeWin + playerStats.player2.firstServeWin)) * 100}%`,
                        }}
                      />

                      <div
                        className="bg-slate-500"
                        style={{
                          width: `${(playerStats.player2.firstServeWin / (playerStats.player1.firstServeWin + playerStats.player2.firstServeWin)) * 100}%`,
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
                          {game.player1}
                          {" vs "}
                          {game.player2}
                        </div>
                        <div className="text-slate-400 text-sm">{game.tournament}</div>
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
                  Finale da sogno tra due dei migliori tennisti al mondo. Djokovic cerca il suo ennesimo titolo Masters
                  1000, mentre Alcaraz vuole confermarsi sul rosso dopo la vittoria al Roland Garros. Match equilibrato
                  e spettacolare.
                </p>
                <div className="bg-slate-800 rounded p-3 inline-block">
                  <div className="text-slate-400 text-xs mb-1">Il pronostico del modello</div>
                  <div className="text-white flex items-center gap-2">
                    <Target className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {prediction && favourite !== null
                        ? `Vittoria ${favourite === 0 ? match.player1 : match.player2} (${pct(prediction.p[favourite])})`
                        : "Non disponibile"}
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
