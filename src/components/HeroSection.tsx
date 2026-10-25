import { Link } from "../lib/links";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import home from "../data/football-home.json";
import { formatDay, formatTime, matchPath, type CompetitionRef, type Match } from "../lib/footballCore";
import { pickLabel, type Prediction } from "../lib/predictionsCore";
import { TeamBadge } from "./calcio/MatchRow";
import { ConfidenceBadge, ProbabilityBar } from "./predictions/PredictionUi";
import { paths } from "../routes";

// Featured matches with the model's prediction, pre-computed by scripts/derive-football-home.mjs
// (Serie A first, then Champions League, Premier League, LaLiga).
export interface FeaturedMatch {
  competition: CompetitionRef;
  match: Match;
  prediction: Prediction;
}

const data = home as unknown as { featured?: FeaturedMatch[] };

export function HeroSection({ matches = data.featured ?? [] }: { matches?: FeaturedMatch[] }) {
  return (
    <div className="bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-white text-3xl sm:text-4xl mb-3">
            <TrendingUp className="inline-block w-7 h-7 text-slate-300 mr-2 align-[-0.1em]" aria-hidden="true" />
            Pronostici calcio basati sui dati
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Le probabilità di ogni esito calcolate dal nostro modello statistico sui risultati delle ultime stagioni
          </p>
        </div>
        {matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(({ competition, match, prediction }) => {
              const home = match.homeTeam.shortName;
              const away = match.awayTeam.shortName;
              return (
                <Card
                  key={match.id}
                  className="bg-slate-800 border-slate-700 hover:border-slate-500 transition-colors overflow-hidden"
                >
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {competition.name}
                      </Badge>
                      <span className="text-slate-400 text-sm first-letter:uppercase">
                        {formatDay(match.utcDate)} · {formatTime(match.utcDate)}
                      </span>
                    </div>
                    <div className="space-y-2 mb-5">
                      {[match.homeTeam, match.awayTeam].map((t) => (
                        <div key={t.id} className="flex items-center gap-2.5">
                          <TeamBadge team={t} />
                          <span className="text-white truncate">{t.shortName}</span>
                        </div>
                      ))}
                    </div>
                    <ProbabilityBar prediction={prediction} home={home} away={away} showTeams={false} />
                    <div className="mt-4 mb-5 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-slate-400">
                        Più probabile: <strong className="text-predict">{pickLabel(prediction, home, away)}</strong>
                      </p>
                      <ConfidenceBadge confidence={prediction.confidence} />
                    </div>
                    <Link
                      to={matchPath(competition, match)}
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-md bg-action hover:bg-action-hover text-action-foreground px-4 py-2 text-sm font-medium"
                      aria-label={`Pronostico completo ${home} – ${away}`}
                    >
                      Pronostico completo
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-center text-slate-400 text-xs">
          Stime statistiche, non consigli di gioco: nessun modello può prevedere con certezza il risultato di una
          partita.{" "}
          <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
            Come funziona il modello
          </Link>
        </p>
      </div>
    </div>
  );
}
