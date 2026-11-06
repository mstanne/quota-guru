import { Link } from "../lib/links";
import { ChevronRight, TrendingUp } from "lucide-react";
import home from "../data/football-home.json";
import { formatTime, isUpcoming, matchHref, type CompetitionRef, type Match } from "../lib/footballCore";
import { CONFIDENCE_LABEL, marketCells, pickLabel, type Prediction } from "../lib/predictionsCore";
import { TeamBadge } from "./calcio/MatchRow";
import { PickCells, SlipHint, footballSlip } from "./predictions/SlipPicks";
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
    <div className="bg-slate-900 py-6 sm:py-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-white text-2xl sm:text-4xl mb-2 sm:mb-3">
            <TrendingUp
              className="inline-block w-6 h-6 sm:w-7 sm:h-7 text-slate-300 mr-2 align-[-0.1em]"
              aria-hidden="true"
            />
            Pronostici di calcio, NBA e tennis basati sui dati
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Le probabilità di ogni esito calcolate da modelli statistici sui risultati delle ultime stagioni
          </p>
        </div>
        {matches.length > 0 && (
          <>
            {/* phones: one row of cards to swipe (one card high instead of three); from md a grid */}
            <div
              className="-mx-4 px-4 flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible"
              aria-label="Partite in evidenza"
              role="list"
            >
              {matches.map((f) => (
                <div key={f.match.id} role="listitem" className="w-[86%] shrink-0 snap-start md:w-auto">
                  <FeaturedCard {...f} />
                </div>
              ))}
            </div>
            <SlipHint />
          </>
        )}
        <p className="mt-3 text-center text-slate-400 text-xs">
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

/** "ven 6 nov" in Italian time. */
const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

/**
 * Compact featured match: teams on the left, the model's 1X2 probabilities on the right (buttons that add the outcome
 * to the bet slip), most likely outcome underneath. The whole card links to the match page ("stretched" link; the
 * probability buttons sit above it).
 */
function FeaturedCard({ competition, match, prediction }: FeaturedMatch) {
  const home = match.homeTeam.shortName;
  const away = match.awayTeam.shortName;
  const dots = prediction.confidence === "alta" ? 3 : prediction.confidence === "media" ? 2 : 1;
  const slip = isUpcoming(match) && !prediction.pre ? footballSlip(competition.name, match) : undefined;
  return (
    <article className="group relative h-full rounded-xl border border-slate-700 bg-slate-800 hover:border-slate-500 transition-colors px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-300 font-medium truncate">{competition.name}</span>
        <span className="flex items-center gap-2 shrink-0 text-slate-400">
          <span className="first-letter:uppercase">
            {shortDay(match.utcDate)} · {formatTime(match.utcDate)}
          </span>
          <span
            className="flex gap-0.5"
            title={`${CONFIDENCE_LABEL[prediction.confidence]}: quanti dati recenti ha il modello sulle due squadre`}
            role="img"
            aria-label={CONFIDENCE_LABEL[prediction.confidence]}
          >
            {[1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= dots ? "bg-predict" : "bg-slate-600"}`} />
            ))}
          </span>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <Link
          to={matchHref(competition, match)}
          aria-label={`Pronostico completo ${home} – ${away}`}
          className="flex-1 min-w-0 space-y-1.5 after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-action"
        >
          {[match.homeTeam, match.awayTeam].map((t) => (
            <span key={t.id} className="flex items-center gap-2">
              <TeamBadge team={t} />
              <span className="text-white truncate text-[15px] sm:text-base">{t.shortName}</span>
            </span>
          ))}
        </Link>
        <div className="relative z-10 shrink-0">
          <PickCells cells={marketCells(prediction, "1x2", home, away)} match={slip} name="1X2" width="w-12" raised />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 truncate">
          Più probabile: <strong className="text-predict font-medium">{pickLabel(prediction, home, away)}</strong>
        </span>
        <span className="shrink-0 inline-flex items-center text-action-text group-hover:text-action-text-hover">
          Pronostico
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
