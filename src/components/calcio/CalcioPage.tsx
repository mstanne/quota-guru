import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Link } from "../../lib/links";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import {
  allMatches,
  competitions,
  competitionPath,
  findCompetition,
  formatDay,
  generatedAt,
  isFinished,
  isLive,
  isResultPending,
  isUpcoming,
  romeDay,
  standingsPath,
  type Competition,
  type Match,
  competitionMeta,
} from "../../lib/football";
import { usePageMeta } from "../../lib/pageMeta";
import { predictionFor } from "../../lib/predictions";
import { MatchRow } from "./MatchRow";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { ListChecks } from "lucide-react";
import { hasResults, resultsPath } from "../../lib/results";

type Filter = "upcoming" | "today" | "tomorrow" | "week" | "results";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "upcoming", label: "Prossime" },
  { id: "today", label: "Oggi" },
  { id: "tomorrow", label: "Domani" },
  { id: "week", label: "7 giorni" },
  { id: "results", label: "Risultati" },
];

// Date-based filters use the visitor's clock, so they are only evaluated after a click
// (the pre-rendered HTML always shows the status-based "Prossime" view).
function matchesFilter(m: Match, filter: Filter) {
  if (filter === "upcoming") return isUpcoming(m) || isLive(m);
  // played matches whose final result the source has not published yet are listed with the results
  if (filter === "results") return isFinished(m) || isResultPending(m);
  const day = (offset: number) => romeDay(new Date(Date.now() + offset * 86400000).toISOString());
  const d = romeDay(m.utcDate);
  if (filter === "today") return d === day(0);
  if (filter === "tomorrow") return d === day(1);
  return d >= day(0) && d <= day(6);
}

/** /calcio (all competitions) and /calcio/:competizione */
export function CalcioPage() {
  const { competizione } = useParams();
  const competition = competizione ? findCompetition(competizione) : undefined;
  const [filter, setFilter] = useState<Filter>("upcoming");
  usePageMeta(competition ? competitionMeta(competition) : null);

  const rows = useMemo(() => {
    const source = competition ? competition.matches.map((m) => ({ competition, match: m })) : allMatches;
    const list = source.filter(({ match }) => matchesFilter(match, filter));
    return filter === "results" ? [...list].reverse() : list;
  }, [competition, filter]);

  if (competizione && !competition) return <NotFoundPage />;

  // Group by Italian calendar day
  const groups: { day: string; label: string; items: { competition: Competition; match: Match }[] }[] = [];
  for (const r of rows) {
    const day = romeDay(r.match.utcDate);
    let g = groups.find((x) => x.day === day);
    if (!g) groups.push((g = { day, label: formatDay(r.match.utcDate), items: [] }));
    g.items.push(r);
  }
  const limitedGroups = competition ? groups : groups.slice(0, 7);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm border transition-colors ${
      active
        ? "bg-selected border-selected text-selected-foreground"
        : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title={competition ? `${competition.name}: calendario e risultati` : "Calcio: calendario e risultati"}
        breadcrumb={
          competition ? [{ label: "Calcio", to: "/calcio" }, { label: competition.name }] : [{ label: "Calcio" }]
        }
        meta={<DataUpdatedNote generatedAt={generatedAt} />}
      >
        {competition && competition.standings.length > 0 && (
          <Link
            to={standingsPath(competition)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <ListOrdered className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Classifica {competition.name}
          </Link>
        )}
        {competition && hasResults(competition.slug) && (
          <Link
            to={resultsPath(competition.slug)}
            className="inline-flex items-center gap-2 px-4 py-2 ml-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <ListChecks className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Tutti i risultati
          </Link>
        )}
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        <nav aria-label="Competizioni" className="flex flex-wrap gap-2 mb-4">
          <Link to="/calcio" className={chip(!competition)} aria-current={!competition ? "page" : undefined}>
            Tutte
          </Link>
          {competitions.map((c) => (
            <Link
              key={c.code}
              to={competitionPath(c)}
              className={chip(c === competition)}
              aria-current={c === competition ? "page" : undefined}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div
          role="group"
          aria-label="Filtra per data"
          className="inline-flex flex-wrap gap-1 p-1 mb-6 rounded-lg bg-slate-900 border border-slate-800"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                filter === f.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {limitedGroups.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-white mb-1">Nessuna partita per questo filtro</p>
            <p className="text-slate-400 text-sm">Prova un altro periodo o un'altra competizione.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {limitedGroups.map((g) => (
              <section key={g.day} aria-labelledby={`day-${g.day}`}>
                <h2
                  id={`day-${g.day}`}
                  className="text-slate-300 text-sm uppercase tracking-wide mb-2 first-letter:uppercase"
                >
                  {g.label}
                </h2>
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  {g.items.map(({ competition: c, match }) => (
                    <MatchRow
                      key={match.id}
                      competition={c}
                      match={match}
                      showCompetition={!competition}
                      prediction={predictionFor(match.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
