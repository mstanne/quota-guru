import { useMemo, useState } from "react";
import { Link } from "../../lib/links";
import { CalendarDays, ListOrdered, Trophy } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { BasketGameRow } from "./BasketGameRow";
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

/** /basket and /basket/nba – NBA calendar and results (real data, BALLDONTLIE). */
export function BasketPage({ league }: { league?: "nba" }) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  usePageMeta(league ? nbaMeta : null);
  const rows = useMemo(() => {
    const list = nbaGames.filter((g) => matches(g, filter));
    return filter === "results" ? [...list].reverse() : list;
  }, [filter]);

  const groups: { day: string; label: string; items: BasketGame[] }[] = [];
  for (const g of rows) {
    const day = romeDay(g.utcDate);
    let grp = groups.find((x) => x.day === day);
    if (!grp) groups.push((grp = { day, label: formatDay(g.utcDate), items: [] }));
    grp.items.push(g);
  }

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
        title={league ? `NBA ${nbaSeason}: calendario e risultati` : "Basket: calendario e risultati"}
        breadcrumb={league ? [{ label: "Basket", to: "/basket" }, { label: "NBA" }] : [{ label: "Basket" }]}
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

      <div className="container mx-auto px-4 py-8">
        <nav aria-label="Campionati" className="flex flex-wrap gap-2 mb-4">
          <Link to={basketPaths.nba} className={chip(true)} aria-current={league ? "page" : undefined}>
            NBA
          </Link>
          {lbaStandings.length > 0 && (
            <Link to={basketPaths.lbaStandings} className={chip(false)}>
              Serie A · classifica
            </Link>
          )}
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

        {groups.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-white mb-1">Nessuna partita per questo filtro</p>
            <p className="text-slate-400 text-sm">Prova un altro periodo.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.slice(0, 10).map((g) => (
              <section key={g.day} aria-labelledby={`day-${g.day}`}>
                <h2 id={`day-${g.day}`} className="text-slate-300 text-sm uppercase tracking-wide mb-2">
                  {g.label}
                </h2>
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  {g.items.map((game) => (
                    <BasketGameRow key={game.id} game={game} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <p className="text-slate-400 text-xs mt-8">Orari in ora italiana. Dati NBA e Serie A: balldontlie.io.</p>
      </div>
    </div>
  );
}
