import { useMemo } from "react";
import { FairOddsLegend } from "../predictions/SlipPicks";
import { Link } from "../../lib/links";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import { HeaderLinks, headerLinkClass, PageHeader } from "../layout/PageHeader";
import { DayLabel, useRomeToday } from "../predictions/DayLabel";
import { emptyActionClass, EmptyList } from "../predictions/ListTools";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { BasketGameRow } from "./BasketGameRow";
import { BASKET_MARKETS, NBA_COLUMN_WIDTH, type BasketMarket } from "./BasketPrediction";
import { MarketFilter } from "../predictions/MarketFilter";
import { SlipHint } from "../predictions/SlipPicks";
import { ChoiceControl } from "../predictions/ChoiceControl";
import { ListColumns } from "../calcio/MatchRow";
import { basketPredictionFor } from "../../lib/basketPredict";
import { useQueryChoice } from "../../lib/useQueryChoice";
import { TrackRecordBox } from "../predictions/TrackRecordBox";
import { nbaTrackRecord } from "../../lib/trackRecordNba";
import { formatDay, romeDay } from "../../lib/footballCore";
import {
  basketPaths,
  basketUpdatedAt,
  isGameFinished,
  isGameLive,
  isGamePending,
  isGameUpcoming,
  lbaStandings,
  nbaGames,
  nbaMeta,
  nbaSeason,
  type BasketGame,
} from "../../lib/basket";
import { usePageMeta } from "../../lib/pageMeta";
import { nbaResultsPath } from "../../lib/results";

const MARKET_IDS = BASKET_MARKETS.map((m) => m.id);

type Filter = "upcoming" | "today" | "tomorrow" | "week" | "results";
const FILTER_IDS: Filter[] = ["upcoming", "today", "tomorrow", "week", "results"];
const FILTERS: { id: Filter; label: string }[] = [
  { id: "upcoming", label: "Prossime" },
  { id: "today", label: "Oggi" },
  { id: "tomorrow", label: "Domani" },
  { id: "week", label: "7 giorni" },
  { id: "results", label: "Risultati" },
];

// Date filters use the visitor's clock and run only after a click (pre-rendered HTML = "Prossime").
function matches(g: BasketGame, f: Filter) {
  if (f === "upcoming") return isGameUpcoming(g) || isGameLive(g);
  // played games whose final score the source has not published yet are listed with the results
  if (f === "results") return isGameFinished(g) || isGamePending(g);
  const day = (o: number) => romeDay(new Date(Date.now() + o * 86400000).toISOString());
  const d = romeDay(g.utcDate);
  if (f === "today") return d === day(0);
  if (f === "tomorrow") return d === day(1);
  return d >= day(0) && d <= day(6);
}

/** /basket and /pronostici/nba – NBA calendar and results (real data, API-NBA). */
export function BasketPage({ league }: { league?: "nba" }) {
  const [filter, setFilter] = useQueryChoice<Filter>("periodo", FILTER_IDS, "upcoming");
  const [market, setMarket] = useQueryChoice<BasketMarket>("mercato", MARKET_IDS, "win");
  const today = useRomeToday();
  usePageMeta(league ? nbaMeta : null);
  const rows = useMemo(() => {
    const list = nbaGames.filter((g) => matches(g, filter));
    return filter === "results" ? [...list].reverse() : list;
  }, [filter]);

  // games being played: their own group on top ("Prossime" only)
  const live = filter === "upcoming" ? rows.filter(isGameLive) : [];
  // "1 · 2" column headers in the sticky bar: win market only (handicap and total lines change from game to game)
  const columns =
    filter !== "results" &&
    market === "win" &&
    rows.some((g) => isGameUpcoming(g) && !isGameLive(g) && !!basketPredictionFor(g.id));
  const groups: { day: string; iso: string; items: BasketGame[] }[] = [];
  for (const g of rows) {
    if (live.includes(g)) continue;
    const day = romeDay(g.utcDate);
    let grp = groups.find((x) => x.day === day);
    if (!grp) groups.push((grp = { day, iso: g.utcDate, items: [] }));
    grp.items.push(g);
  }
  // empty period (today, tomorrow…): the next day with games, to jump to
  const next =
    filter !== "upcoming" && filter !== "results" && !rows.length ? nbaGames.find(isGameUpcoming) : undefined;

  const chip = (active: boolean) =>
    `shrink-0 inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-md text-sm border transition-colors ${
      active
        ? "bg-selected border-selected text-selected-foreground"
        : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title={league ? `Pronostici NBA ${nbaSeason}: calendario e risultati` : "Basket: calendario e risultati"}
        breadcrumb={league ? [{ label: "Pronostici", to: "/pronostici" }, { label: "NBA" }] : [{ label: "Basket" }]}
        meta={<DataUpdatedNote generatedAt={basketUpdatedAt} short />}
      >
        {lbaStandings.length > 0 && (
          <HeaderLinks>
            <Link to={basketPaths.lbaStandings} className={headerLinkClass}>
              <ListOrdered className="w-4 h-4 text-slate-300" aria-hidden="true" />
              Classifica Serie A basket
            </Link>
          </HeaderLinks>
        )}
      </PageHeader>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl">
          <TrackRecordBox record={nbaTrackRecord()} sport="nba" className="mb-4" />

          {/* filters: one sticky bar under the site header, as on the football page */}
          <div
            className="sticky z-40 -mx-4 px-4 pt-2.5 pb-3 mb-5 bg-slate-950/95 backdrop-blur border-b border-slate-800"
            style={{ top: "var(--header-h, 0px)" }}
          >
            <nav aria-label="Campionati">
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                <Link to={basketPaths.nba} className={chip(true)} aria-current={league ? "page" : undefined}>
                  NBA
                </Link>
                <Link to={nbaResultsPath()} className={chip(false)}>
                  NBA · risultati
                </Link>
                {lbaStandings.length > 0 && (
                  <Link to={basketPaths.lbaStandings} className={chip(false)}>
                    Serie A · classifica
                  </Link>
                )}
              </div>
            </nav>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
              <ChoiceControl<Filter>
                label="Periodo"
                icon={CalendarDays}
                options={FILTERS}
                value={filter}
                onChange={setFilter}
                trackAttrs={(id) => ({
                  "data-track": "filter_use",
                  "data-track-filter": "nba-data",
                  "data-track-value": id,
                })}
              />
              {filter !== "results" && (
                <MarketFilter options={BASKET_MARKETS} value={market} onChange={setMarket} sport="nba" className="" />
              )}
            </div>
            {columns && (
              <ListColumns labels={["1", "2"]} width={NBA_COLUMN_WIDTH} meta={false} className="mt-2.5 -mb-1" />
            )}
          </div>
          <SlipHint />

          {live.length === 0 && groups.length === 0 ? (
            <EmptyList
              title="Nessuna partita per questo filtro"
              text={next ? undefined : "Prova un altro periodo."}
              action={
                next && (
                  <button type="button" onClick={() => setFilter("upcoming")} className={emptyActionClass}>
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    Vedi le prossime: {formatDay(next.utcDate)}
                  </button>
                )
              }
            />
          ) : (
            <div className="space-y-6">
              {live.length > 0 && (
                <section aria-labelledby="in-corso">
                  <h2
                    id="in-corso"
                    className="flex items-center gap-2 px-3 sm:px-4 mb-1.5 text-red-300 text-sm uppercase tracking-wide"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
                    In corso
                    <span className="normal-case tracking-normal text-slate-400 text-xs">
                      · punteggi aggiornati circa ogni 15 minuti
                    </span>
                  </h2>
                  <div className="rounded-xl border border-red-500/30 bg-slate-900 overflow-hidden">
                    {live.map((game) => (
                      <BasketGameRow key={game.id} game={game} market={market} meta={false} />
                    ))}
                  </div>
                </section>
              )}
              {groups.slice(0, 10).map((g) => (
                <section key={g.day} aria-labelledby={`day-${g.day}`}>
                  <h2 id={`day-${g.day}`} className="px-3 sm:px-4 mb-1.5 text-slate-300 text-sm uppercase tracking-wide">
                    <DayLabel iso={g.iso} today={today} />
                  </h2>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                    {g.items.map((game) => (
                      <BasketGameRow
                        key={game.id}
                        game={game}
                        market={market}
                        columns={columns}
                        meta={false}
                        outcome={filter === "results"}
                      />
                    ))}
                  </div>
                </section>
              ))}
              <FairOddsLegend className="px-3 sm:px-4" />
            </div>
          )}
          <p className="text-slate-400 text-xs mt-8">
            Orari in ora italiana. Dati NBA: API-NBA (API-Sports). Classifica Serie A: balldontlie.io.
          </p>
        </div>
      </div>
    </div>
  );
}
