import { useMemo, useState } from "react";
import { Link } from "../../lib/links";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
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
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [market, setMarket] = useQueryChoice<BasketMarket>("mercato", MARKET_IDS, "win");
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
  const groups: { day: string; label: string; items: BasketGame[] }[] = [];
  for (const g of rows) {
    if (live.includes(g)) continue;
    const day = romeDay(g.utcDate);
    let grp = groups.find((x) => x.day === day);
    if (!grp) groups.push((grp = { day, label: formatDay(g.utcDate), items: [] }));
    grp.items.push(g);
  }

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
        meta={<DataUpdatedNote generatedAt={basketUpdatedAt} />}
      >
        {lbaStandings.length > 0 && (
          <Link
            to={basketPaths.lbaStandings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white hover:border-slate-500"
          >
            <ListOrdered className="w-4 h-4 text-slate-300" aria-hidden="true" />
            Classifica Serie A basket
          </Link>
        )}
      </PageHeader>

      <div className="container mx-auto px-4 py-6">
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
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
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
          {columns && <ListColumns labels={["1", "2"]} width={NBA_COLUMN_WIDTH} className="mt-2.5 -mb-1" />}
        </div>
        <SlipHint />

        {live.length === 0 && groups.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-white mb-1">Nessuna partita per questo filtro</p>
            <p className="text-slate-400 text-sm">Prova un altro periodo.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {live.length > 0 && (
              <section aria-labelledby="in-corso">
                <h2 id="in-corso" className="flex items-center gap-2 px-3 sm:px-4 mb-1.5 text-red-300 text-sm uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
                  In corso
                  <span className="normal-case tracking-normal text-slate-400 text-xs">
                    · punteggi aggiornati circa ogni 15 minuti
                  </span>
                </h2>
                <div className="rounded-xl border border-red-500/30 bg-slate-900 overflow-hidden">
                  {live.map((game) => (
                    <BasketGameRow key={game.id} game={game} market={market} />
                  ))}
                </div>
              </section>
            )}
            {groups.slice(0, 10).map((g) => (
              <section key={g.day} aria-labelledby={`day-${g.day}`}>
                <h2
                  id={`day-${g.day}`}
                  className="px-3 sm:px-4 mb-1.5 text-slate-300 text-sm uppercase tracking-wide first-letter:uppercase"
                >
                  {g.label}
                </h2>
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  {g.items.map((game) => (
                    <BasketGameRow key={game.id} game={game} market={market} columns={columns} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <p className="text-slate-400 text-xs mt-8">Orari in ora italiana. Dati NBA: API-NBA (API-Sports). Classifica Serie A: balldontlie.io.</p>
      </div>
    </div>
  );
}
