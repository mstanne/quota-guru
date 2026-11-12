import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Link } from "../../lib/links";
import { BarChart3, CalendarDays, History, ListOrdered, Trophy } from "lucide-react";
import { hasSeasons, seasonsHubPath, seasonsIndex, seasonsPath } from "../../lib/seasons";
import {
  competitionPath,
  formatDay,
  formatShortDate,
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
import { footballTrackRecord, nationalTrackRecord } from "../../lib/trackRecordFootball";
import { footballOutcome, MatchListColumns, MatchListHeader, MatchRow } from "./MatchRow";
import { MatchList } from "./MatchList";
import { emptyActionClass, EmptyList, TeamSearch } from "../predictions/ListTools";
import { searchKey } from "../../lib/teamNames";
import { marketColumns } from "../predictions/PredictionUi";
import { ChoiceControl } from "../predictions/ChoiceControl";
import { SlipHint } from "../predictions/SlipPicks";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { HeaderLinks, headerLinkClass, PageHeader } from "../layout/PageHeader";
import { ListChecks } from "lucide-react";
import { hasResults, resultsPath } from "../../lib/results";
import { featuredMatchday } from "../../lib/matchdaysCore";
import { calcioHubText, competitionText } from "../../lib/editorial/extraTexts";
import { FEATURED_COMPETITIONS, isFeaturedMatch } from "../../lib/calcioFeatured";
import { TextSections } from "../editorial/TextSections";
import { goalStatsPath, leadersPath, matchdayPath, PRONOSTICI } from "../../lib/footballCore";

const MARKET_IDS = FOOTBALL_MARKETS.map((m) => m.id);

type Filter = "upcoming" | "today" | "tomorrow" | "week" | "results";
const FILTER_IDS: Filter[] = ["upcoming", "today", "tomorrow", "week", "results"];
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
  const [filter, setFilter] = useQueryChoice<Filter>("periodo", FILTER_IDS, "upcoming");
  const [market, setMarket] = useQueryChoice<FootballMarket>("mercato", MARKET_IDS, "1x2");
  const [query, setQuery] = useState("");
  // /calcio: matches of the minor competitions summarised at the bottom until the visitor asks for all of them
  const [showAll, setShowAll] = useState(false);
  usePageMeta(competition ? competitionMeta(competition) : null);

  const periodRows = useMemo(() => {
    const source = all
      .flatMap((d) => d.competition.matches.map((m) => ({ competition: d.competition, match: m })))
      .sort((a, b) => a.match.utcDate.localeCompare(b.match.utcDate));
    const list = source.filter(({ match }) => matchesFilter(match, filter));
    return filter === "results" ? [...list].reverse() : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competizione, all.length, filter]);
  // team search: every word must be in the home or the away team's names
  const words = searchKey(query).split(" ").filter(Boolean);
  const rows = words.length
    ? periodRows.filter(({ match: m }) => {
        const names = searchKey(
          [m.homeTeam.name, m.homeTeam.shortName, m.awayTeam.name, m.awayTeam.shortName].join(" "),
        );
        return words.every((w) => names.includes(w));
      })
    : periodRows;

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

  // /calcio shows the days of the period up to MAX_DAYS (the competition pages show every match)
  const dayWindow = competizione
    ? null
    : new Set([...new Set(rows.filter((r) => !isLive(r.match)).map((r) => romeDay(r.match.utcDate)))].slice(0, MAX_DAYS));
  const inWindow = (r: (typeof rows)[number]) => !dayWindow || isLive(r.match) || dayWindow.has(romeDay(r.match.utcDate));
  // /calcio: the main competitions in full, the others as one summary line each (src/lib/calcioFeatured.ts);
  // a team search or "show all" lists everything
  const collapse = !competizione && !words.length && !showAll;
  const shown = rows.filter((r) => inWindow(r) && (!collapse || isFeaturedMatch(r.competition, r.match)));
  const others = collapse ? rows.filter((r) => inWindow(r) && !isFeaturedMatch(r.competition, r.match)) : [];

  // column headers of the probability cells, in the sticky bar (not for results, nor for combos: labels in the cells)
  const columns =
    filter !== "results" && !!marketColumns(market).labels && shown.some((r) => !!predictionOf(r.competition, r.match));
  // matches being played: their own group on top ("Prossime" only)
  const live = filter === "upcoming" ? shown.filter((r) => isLive(r.match)) : [];
  // by Italian calendar day; inside a day, in time order with a heading whenever the competition changes
  const listRows = shown
    .filter((r) => !live.includes(r))
    .map((r) => ({ ...r, prediction: predictionOf(r.competition, r.match) }));
  const dayCount = new Set(listRows.map((r) => romeDay(r.match.utcDate))).size;

  // finished matches: the prediction as published (archive), else the model's recalculation
  const outcomeOf = (c: Competition, m: Match) => {
    const data = bySlug.get(c.slug);
    const archived = data?.archived(m.id);
    return footballOutcome(m, archived ? { ...archived.prediction, pre: true } : data?.prediction(m.id), !!archived);
  };

  // empty period (today, tomorrow…): the next day with matches, to jump to
  const next =
    filter !== "upcoming" && filter !== "results" && !rows.length && !words.length
      ? all
          .flatMap((d) => d.competition.matches)
          .filter((m) => isUpcoming(m))
          .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0]
      : undefined;

  // switching competition keeps the chosen market and period
  const params = new URLSearchParams();
  if (market !== "1x2") params.set("mercato", market);
  if (filter !== "upcoming") params.set("periodo", filter);
  const q = params.toString() ? `?${params}` : "";

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
        subtitle={
          competition
            ? undefined
            : "Le partite dei prossimi giorni con le probabilità di ogni esito stimate dal nostro modello statistico, i risultati e i collegamenti a classifiche, squadre e statistiche delle competizioni seguite."
        }
        breadcrumb={
          competition ? [{ label: "Pronostici", to: PRONOSTICI }, { label: competition.name }] : [{ label: "Calcio" }]
        }
        meta={<DataUpdatedNote generatedAt={generatedAt} short />}
      >
        <HeaderLinks>
          {competition && competition.standings.length > 0 && (
            <Link to={standingsPath(competition)} className={headerLinkClass}>
              <ListOrdered className="w-4 h-4 text-slate-300" aria-hidden="true" />
              Classifica <span className="hidden sm:inline">{competition.name}</span>
            </Link>
          )}
          {competition && round && (
            <Link to={matchdayPath(competition, round)} className={headerLinkClass}>
              <CalendarDays className="w-4 h-4 text-slate-300" aria-hidden="true" />
              Pronostici {round.n}ª giornata
            </Link>
          )}
          {competition && competition.standings.length > 0 && (
            <Link to={goalStatsPath(competition)} className={headerLinkClass}>
              <BarChart3 className="w-4 h-4 text-slate-300" aria-hidden="true" />
              Statistiche Under/Over
            </Link>
          )}
          {competition?.leaders?.scorers?.length ? (
            <Link to={leadersPath(competition)} className={headerLinkClass}>
              <Trophy className="w-4 h-4 text-slate-300" aria-hidden="true" />
              Marcatori
            </Link>
          ) : null}
          {competition && hasResults(competition.slug) && (
            <Link to={resultsPath(competition.slug)} className={headerLinkClass}>
              <ListChecks className="w-4 h-4 text-slate-300" aria-hidden="true" />
              Tutti i risultati
            </Link>
          )}
          {(competition ? hasSeasons(competition.slug) : seasonsIndex.length > 0) && (
            <Link to={competition ? seasonsPath(competition.slug) : seasonsHubPath} className={headerLinkClass}>
              <History className="w-4 h-4 text-slate-300" aria-hidden="true" />
              {competition ? "Stagioni passate" : "Albo d'oro e stagioni passate"}
            </Link>
          )}
        </HeaderLinks>
      </PageHeader>

      <div className="container mx-auto px-4 py-6">
        {/* the list keeps a readable width on wide screens (and leaves room for the slip beside it) */}
        <div className="max-w-6xl">
          <TrackRecordBox
            record={competition?.national ? nationalTrackRecord() : footballTrackRecord()}
            sport="calcio"
            className="mb-4"
          />

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
                  {counts && <Count n={periodRows.length} />}
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
            <div className="mt-2.5 grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
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
              {filter !== "results" ? (
                <MarketFilter options={FOOTBALL_MARKETS} value={market} onChange={setMarket} className="" />
              ) : (
                <span className="sm:hidden" />
              )}
              <TeamSearch value={query} onChange={setQuery} />
            </div>
            {columns && <MatchListColumns market={market} meta={false} className="mt-2.5 -mb-1" />}
          </div>
          <SlipHint />

          {live.length === 0 && dayCount === 0 && others.length === 0 ? (
            words.length ? (
              <EmptyList
                title={`Nessuna partita trovata per «${query.trim()}»`}
                text="Controlla il nome o prova un altro periodo o competizione."
                action={
                  <button type="button" onClick={() => setQuery("")} className={emptyActionClass}>
                    Cancella la ricerca
                  </button>
                }
              />
            ) : (
              <EmptyList
                title="Nessuna partita per questo filtro"
                text={next ? undefined : "Prova un altro periodo o un'altra competizione."}
                action={
                  next && (
                    <button type="button" onClick={() => setFilter("upcoming")} className={emptyActionClass}>
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      Vedi le prossime: {formatDay(next.utcDate)}
                    </button>
                  )
                }
              />
            )
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
              <MatchList
                rows={listRows}
                market={market}
                columns={columns}
                columnHeader={false}
                heads={competition ? "round" : "competition"}
                linkQuery={q}
                maxDays={competition ? undefined : MAX_DAYS}
                outcome={filter === "results" ? (r) => outcomeOf(r.competition, r.match) : undefined}
              />
              {others.length > 0 && (
                <OtherCompetitions rows={others} linkQuery={q} onShowAll={() => setShowAll(true)} />
              )}
            </div>
          )}

          {!competizione && (
            <TextSections
              id="guida-pagina-calcio"
              className="mt-10"
              title="Pronostici calcio: come leggere questa pagina"
              sections={calcioHubText(footballIndex, FEATURED_COMPETITIONS)}
              note="Stime statistiche, non consigli di gioco. Il gioco è vietato ai minori di 18 anni e può causare dipendenza patologica."
            />
          )}

          {single && competition && (
            <TextSections
              id="analisi-competizione"
              className="mt-10"
              title={`Pronostici ${competition.name}: la giornata e i numeri della stagione`}
              sections={competitionText(
                single,
                (competition.national ? nationalTrackRecord() : footballTrackRecord()).byWhere?.find(
                  (w) => w.where === competition.name,
                ),
              )}
              note={`Testi aggiornati al ${formatShortDate(generatedAt)}. Stime statistiche, non consigli di gioco.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Days listed on /calcio. */
const MAX_DAYS = 7;

const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "short" }).format(new Date(iso));

/**
 * /calcio: the competitions not listed in full, one line each (matches in the period, first and last day), linking
 * to the competition page where all their matches are; a button lists them here too.
 */
function OtherCompetitions({
  rows,
  linkQuery,
  onShowAll,
}: {
  rows: { competition: Competition; match: Match }[];
  linkQuery: string;
  onShowAll: () => void;
}) {
  const groups = new Map<string, { competition: Competition; n: number; first: string; last: string }>();
  for (const { competition: c, match: m } of rows) {
    const g = groups.get(c.slug);
    if (!g) groups.set(c.slug, { competition: c, n: 1, first: m.utcDate, last: m.utcDate });
    else {
      g.n++;
      if (m.utcDate < g.first) g.first = m.utcDate;
      if (m.utcDate > g.last) g.last = m.utcDate;
    }
  }
  const order = new Map(footballIndex.map((c, i) => [c.slug, i]));
  const list = [...groups.values()].sort((a, b) => (order.get(a.competition.slug) ?? 0) - (order.get(b.competition.slug) ?? 0));
  const days = (g: { first: string; last: string }) => {
    const a = shortDay(g.first);
    const b = shortDay(g.last);
    return a === b ? a : `${a} – ${b}`;
  };
  return (
    <section aria-labelledby="altre-competizioni">
      <div className="flex items-end gap-2.5 sm:gap-4 px-3 sm:px-4 mb-1.5">
        <h2 id="altre-competizioni" className="flex-1 min-w-0 text-sm uppercase tracking-wide text-slate-300">
          Altre competizioni
        </h2>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {list.map((g) => (
          <Link key={g.competition.slug} to={`${competitionPath(g.competition)}${linkQuery}`} className="mrow">
            <span className="flex-1 min-w-0">
              <span className="block truncate text-white">{g.competition.name}</span>
              <span className="block text-xs text-slate-400">
                {g.n === 1 ? "1 partita" : `${g.n} partite`} · {days(g)}
              </span>
            </span>
            <span className="row-chev" aria-hidden="true" />
          </Link>
        ))}
      </div>
      <p className="mt-2 px-3 sm:px-4 text-sm text-slate-400">
        Tutte le partite di ogni competizione sono nella sua pagina.{" "}
        <button type="button" onClick={onShowAll} className="text-action-text hover:text-action-text-hover underline">
          Mostrale anche qui
        </button>
      </p>
    </section>
  );
}

/** Number of matches next to a competition chip. */
function Count({ n }: { n: number }) {
  return <span className="text-xs tabular-nums opacity-70">{n}</span>;
}
