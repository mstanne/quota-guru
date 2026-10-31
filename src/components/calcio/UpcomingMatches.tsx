import { Link } from "../../lib/links";
import { CalendarDays, ListFilter } from "lucide-react";
import { useQueryChoice } from "../../lib/useQueryChoice";
import home from "../../data/football-home.json";
import { formatDay, type CompetitionRef, type Match } from "../../lib/footballCore";
import { Fragment } from "react";
import type { Prediction } from "../../lib/predictionsCore";
import { MatchRow } from "./MatchRow";
import { DataUpdatedNote } from "./DataUpdatedNote";

// Small pre-computed list (scripts/derive-football-home.mjs) so the home page does not load the full snapshot.
// The list keeps only the 1X2 probabilities of each prediction (enough for the rows' default market).
const data = home as unknown as {
  generatedAt: string;
  matches: { competition: CompetitionRef; match: Match; prediction?: Prediction }[];
  competitions?: CompetitionRef[];
};
const competitions = data.competitions ?? [];
const TIMELINE = "tutte";
const choices = [TIMELINE, ...competitions.map((c) => c.slug)] as const;

const button =
  "px-4 py-2 rounded-md border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white text-sm";

/** Home page block: next real fixtures from football-data.org, with the model's 1X2 probabilities. */
export function UpcomingMatches({ limit = 8 }: { limit?: number }) {
  // default: every main competition in time order; otherwise the next matches of one competition (?campionato=…)
  const [choice, choose] = useQueryChoice<string>("campionato", choices, TIMELINE);
  const selected = competitions.find((c) => c.slug === choice);
  const next = (selected ? data.matches.filter((x) => x.competition.slug === selected.slug) : data.matches).slice(0, limit);
  if (data.matches.length === 0) return null;

  return (
    <section className="py-12 bg-slate-950" aria-labelledby="prossime-partite">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h2 id="prossime-partite" className="flex items-center gap-2 text-white text-2xl mb-1">
              <CalendarDays className="w-6 h-6 text-slate-300" aria-hidden="true" />
              Prossime partite
            </h2>
            <DataUpdatedNote generatedAt={data.generatedAt} />
          </div>
          <div className="flex flex-wrap gap-2">
            {/* same URLs as dayPath in src/lib/dayPages.ts (not imported: it would pull every match into the home
                page bundle). They list every match of the day, so each imminent match page is two clicks from home. */}
            <Link to="/pronostici/oggi" className={button}>
              Pronostici di oggi
            </Link>
            <Link to="/pronostici/domani" className={button}>
              Pronostici di domani
            </Link>
            {selected ? (
              <Link to={`/pronostici/${selected.slug}`} className={button}>
                Tutte le partite di {selected.name}
              </Link>
            ) : (
              <Link to="/calcio" className={button}>
                Tutto il calendario
              </Link>
            )}
          </div>
        </div>
        {competitions.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400 text-sm shrink-0">
              <ListFilter className="w-4 h-4" aria-hidden="true" />
              Mostra
            </span>
            {/* one scrollable row on phones, so the filter never pushes the list down */}
            <div
              role="group"
              aria-label="Campionato delle prossime partite"
              className="flex gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto max-w-full [scrollbar-width:none]"
            >
              {[{ slug: TIMELINE, name: "Tutte, in ordine di orario" }, ...competitions].map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => choose(c.slug)}
                  aria-pressed={choice === c.slug}
                  data-track="filter_use"
                  data-track-filter="home-campionato"
                  data-track-value={c.slug}
                  className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors cursor-pointer ${
                    choice === c.slug ? "bg-predict/15 text-predict" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {c.slug === TIMELINE ? (
                    <>
                      <span className="sm:hidden">Tutte</span>
                      <span className="hidden sm:inline">{c.name}</span>
                    </>
                  ) : (
                    c.name
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {next.length ? (
            next.map(({ competition, match, prediction }, i) => {
              // day heading whenever the date changes, so rows on different days are not read as the same day
              const day = formatDay(match.utcDate);
              const newDay = i === 0 || formatDay(next[i - 1].match.utcDate) !== day;
              return (
                <Fragment key={match.id}>
                  {newDay && (
                    <h3 className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-slate-300 text-sm first-letter:uppercase">
                      {day}
                    </h3>
                  )}
                  <MatchRow
                    competition={competition}
                    match={match}
                    prediction={prediction}
                    showCompetition={!selected}
                  />
                </Fragment>
              );
            })
          ) : (
            <p className="p-6 text-slate-400 text-sm">Nessuna partita in programma nei prossimi giorni.</p>
          )}
        </div>
      </div>
    </section>
  );
}
