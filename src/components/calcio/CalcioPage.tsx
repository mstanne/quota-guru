import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Link } from "../../lib/links";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import {
  competitionPath,
  formatDay,
  isFinished,
  isLive,
  isResultPending,
  isUpcoming,
  romeDay,
  standingsPath,
  type Competition,
  type Match,
  competitionMeta,
} from "../../lib/footballCore";
import { footballIndex, useAllCompetitionData, useCompetitionData, type CompetitionData } from "../../lib/footballData";
import { usePageMeta } from "../../lib/pageMeta";
import { FOOTBALL_MARKETS, type FootballMarket } from "../../lib/predictionsCore";
import { useQueryChoice } from "../../lib/useQueryChoice";
import { MarketFilter } from "../predictions/MarketFilter";
import { TrackRecordBox } from "../predictions/TrackRecordBox";
import { footballTrackRecord } from "../../lib/trackRecordFootball";
import { MatchRow } from "./MatchRow";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { ListChecks } from "lucide-react";
import { hasResults, resultsPath } from "../../lib/results";
import { featuredMatchday } from "../../lib/matchdaysCore";
import { matchdayPath } from "../../lib/footballCore";

const MARKET_IDS = FOOTBALL_MARKETS.map((m) => m.id);

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
  // one competition, or all of them for /calcio (downloaded on demand, see src/lib/footballData.ts)
  const single = competizione ? useCompetitionData(competizione) : null;
  const all: CompetitionData[] = competizione ? (single ? [single] : []) : useAllCompetitionData();
  const competition = single?.competition;
  const bySlug = new Map(all.map((d) => [d.competition.slug, d]));
  const predictionOf = (c: Competition, m: Match) => bySlug.get(c.slug)?.prediction(m.id);
  const generatedAt = all[0]?.generatedAt ?? "";
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [market, setMarket] = useQueryChoice<FootballMarket>("mercato", MARKET_IDS, "1x2");
  usePageMeta(competition ? competitionMeta(competition) : null);

  const rows = useMemo(() => {
    const source = all
      .flatMap((d) => d.competition.matches.map((m) => ({ competition: d.competition, match: m })))
      .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));
    const list = source.filter(({ match }) => matchesFilter(match, filter));
    return filter === "results" ? [...list].reverse() : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competizione, all.length, filter]);

  if (competizione && !competition) return <NotFoundPage />;
  const round = competition ? featuredMatchday(competition) : undefined;

  // Group by Italian calendar day
  const groups: { day: string; label: string; items: { competition: Competition; match: Match }[] }[] = [];
  for (const r of rows) {
    const day = romeDay(r.match.utcDate);
    let g = groups.find((x) => x.day === day);
    if (!g) groups.push((g = { day, label: formatDay(r.match.utcDate), items: [] }));
    g.items.push(r);
  }
  const limitedGroups = competition ? groups : groups.slice(0, 7);

  // switching competition keeps the chosen market
  const q = market === "1x2" ? "" : `?mercato=${market}`;

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
        <div className="flex flex-wrap gap-2">
        {competition && competition.standings.length > 0 && (
          <Link
            to={standingsPath(competition)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <ListOrdered className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Classifica {competition.name}
          </Link>
        )}
        {competition && round && (
          <Link
            to={matchdayPath(competition, round.n)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <CalendarDays className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Pronostici {round.n}ª giornata
          </Link>
        )}
        {competition && hasResults(competition.slug) && (
          <Link
            to={resultsPath(competition.slug)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <ListChecks className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Tutti i risultati
          </Link>
        )}
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        <TrackRecordBox record={footballTrackRecord()} sport="calcio" className="mb-8" />
        <nav aria-label="Competizioni" className="flex flex-wrap gap-2 mb-4">
          <Link to={`/calcio${q}`} className={chip(!competition)} aria-current={!competition ? "page" : undefined}>
            Tutte
          </Link>
          {footballIndex.map((c) => (
            <Link
              key={c.code}
              to={`${competitionPath(c)}${q}`}
              className={chip(c.slug === competition?.slug)}
              aria-current={c.slug === competition?.slug ? "page" : undefined}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div
          role="group"
          aria-label="Filtra per data"
          className="inline-flex flex-wrap gap-1 p-1 mb-3 rounded-lg bg-slate-900 border border-slate-800"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              data-track="filter_use"
              data-track-filter="calcio-data"
              data-track-value={f.id}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                filter === f.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filter !== "results" ? (
          <MarketFilter options={FOOTBALL_MARKETS} value={market} onChange={setMarket} />
        ) : (
          <div className="mb-6" />
        )}

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
                      prediction={predictionOf(c, match)}
                      market={market}
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
