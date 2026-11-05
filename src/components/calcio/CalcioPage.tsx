import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Link } from "../../lib/links";
import { BarChart3, CalendarDays, History, ListOrdered, Trophy } from "lucide-react";
import { hasSeasons, seasonsHubPath, seasonsIndex, seasonsPath } from "../../lib/seasons";
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
import { MatchListColumns, MatchListHeader, MatchRow } from "./MatchRow";
import { marketColumns } from "../predictions/PredictionUi";
import { ChoiceControl } from "../predictions/ChoiceControl";
import { SlipHint } from "../predictions/SlipPicks";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { ListChecks } from "lucide-react";
import { hasResults, resultsPath } from "../../lib/results";
import { featuredMatchday } from "../../lib/matchdaysCore";
import { goalStatsPath, leadersPath, matchdayPath, PRONOSTICI } from "../../lib/footballCore";

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

  // matches per competition in the chosen period, for the chips (only on /calcio, where every competition is loaded)
  const counts = useMemo(() => {
    if (competizione) return null;
    const m = new Map<string, number>();
    for (const d of all) m.set(d.competition.slug, d.competition.matches.filter((x) => matchesFilter(x, filter)).length);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competizione, all.length, filter]);

  // phones: bring the active competition chip into view in the sideways list
  const chipsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = chipsRef.current;
    const el = box?.querySelector<HTMLElement>("[data-active]");
    if (box && el && el.offsetLeft + el.offsetWidth > box.clientWidth) box.scrollLeft = el.offsetLeft - 16;
  }, [competizione]);

  if (competizione && !competition) return <NotFoundPage />;
  const round = competition ? featuredMatchday(competition) : undefined;

  // column headers of the probability cells, in the sticky bar (not for results, nor for combos: labels in the cells)
  const columns =
    filter !== "results" && !!marketColumns(market).labels && rows.some((r) => !!predictionOf(r.competition, r.match));
  // matches being played: their own group on top ("Prossime" only)
  const live = filter === "upcoming" ? rows.filter((r) => isLive(r.match)) : [];
  // Group by Italian calendar day
  const groups: { day: string; label: string; items: { competition: Competition; match: Match }[] }[] = [];
  for (const r of rows) {
    if (live.includes(r)) continue;
    const day = romeDay(r.match.utcDate);
    let g = groups.find((x) => x.day === day);
    if (!g) groups.push((g = { day, label: formatDay(r.match.utcDate), items: [] }));
    g.items.push(r);
  }
  const limitedGroups = competition ? groups : groups.slice(0, 7);

  // switching competition keeps the chosen market
  const q = market === "1x2" ? "" : `?mercato=${market}`;

  const chip = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-sm border transition-colors ${
      active
        ? "bg-selected border-selected text-selected-foreground"
        : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title={competition ? `Pronostici ${competition.name}: calendario e risultati` : "Calcio: calendario e risultati"}
        breadcrumb={
          competition ? [{ label: "Pronostici", to: PRONOSTICI }, { label: competition.name }] : [{ label: "Calcio" }]
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
        {competition && competition.standings.length > 0 && (
          <Link
            to={goalStatsPath(competition)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <BarChart3 className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Statistiche Under/Over
          </Link>
        )}
        {competition?.leaders?.scorers?.length ? (
          <Link
            to={leadersPath(competition)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <Trophy className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Marcatori
          </Link>
        ) : null}
        {competition && round && (
          <Link
            to={matchdayPath(competition, round)}
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
        {(competition ? hasSeasons(competition.slug) : seasonsIndex.length > 0) && (
          <Link
            to={competition ? seasonsPath(competition.slug) : seasonsHubPath}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <History className="w-4 h-4 text-slate-300" aria-hidden="true" />
            {competition ? "Stagioni passate" : "Albo d'oro e stagioni passate"}
          </Link>
        )}
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-6">
        <TrackRecordBox record={footballTrackRecord()} sport="calcio" className="mb-4" />

        {/* filters: one sticky bar under the site header (competitions scroll sideways, period and market on one row) */}
        <div
          className="sticky z-40 -mx-4 px-4 pt-2.5 pb-3 mb-5 bg-slate-950/95 backdrop-blur border-b border-slate-800"
          style={{ top: "var(--header-h, 0px)" }}
        >
          <nav aria-label="Competizioni" className="relative">
            <div
              ref={chipsRef}
              className="flex gap-2 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] pr-8"
            >
              <Link
                to={`/calcio${q}`}
                className={chip(!competition)}
                aria-current={!competition ? "page" : undefined}
                data-active={!competition || undefined}
              >
                Tutte
                {counts && <Count n={rows.length} />}
              </Link>
              {footballIndex
                .filter((c) => !counts || counts.get(c.slug) || c.slug === competition?.slug)
                .map((c) => (
                  <Link
                    key={c.code}
                    to={`${competitionPath(c)}${q}`}
                    className={chip(c.slug === competition?.slug)}
                    aria-current={c.slug === competition?.slug ? "page" : undefined}
                    data-active={c.slug === competition?.slug || undefined}
                  >
                    {c.name}
                    {counts && <Count n={counts.get(c.slug) ?? 0} />}
                  </Link>
                ))}
            </div>
          </nav>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
            <ChoiceControl<Filter>
              label="Periodo"
              icon={CalendarDays}
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              trackAttrs={(id) => ({
                "data-track": "filter_use",
                "data-track-filter": "calcio-data",
                "data-track-value": id,
              })}
            />
            {filter !== "results" && (
              <MarketFilter options={FOOTBALL_MARKETS} value={market} onChange={setMarket} className="" />
            )}
          </div>
          {columns && <MatchListColumns market={market} className="mt-2.5 -mb-1" />}
        </div>
        <SlipHint />

        {live.length === 0 && limitedGroups.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-white mb-1">Nessuna partita per questo filtro</p>
            <p className="text-slate-400 text-sm">Prova un altro periodo o un'altra competizione.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {live.length > 0 && (
              <section aria-labelledby="in-corso">
                <MatchListHeader
                  id="in-corso"
                  tone="live"
                  market={market}
                  columns={false}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
                      In corso
                      <span className="normal-case tracking-normal text-slate-400 text-xs">
                        · punteggi aggiornati circa ogni 15 minuti
                      </span>
                    </span>
                  }
                />
                <div className="rounded-xl border border-red-500/30 bg-slate-900 overflow-hidden">
                  {live.map(({ competition: c, match }) => (
                    <MatchRow key={match.id} competition={c} match={match} showCompetition={!competition} />
                  ))}
                </div>
              </section>
            )}
            {limitedGroups.map((g) => {
              return (
                <section key={g.day} aria-labelledby={`day-${g.day}`}>
                  <MatchListHeader id={`day-${g.day}`} title={g.label} market={market} columns={false} />
                  <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                    {g.items.map(({ competition: c, match }) => (
                      <MatchRow
                        key={match.id}
                        competition={c}
                        match={match}
                        showCompetition={!competition}
                        prediction={predictionOf(c, match)}
                        market={market}
                        columns={columns}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Number of matches next to a competition chip. */
function Count({ n }: { n: number }) {
  return <span className="text-xs tabular-nums opacity-70">{n}</span>;
}
