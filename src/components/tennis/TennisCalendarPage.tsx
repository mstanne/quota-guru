// /tennis/calendario-atp and /tennis/calendario-wta – tournaments of the season, grouped by month.
import { useState } from "react";
import { Link } from "../../lib/links";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { StatusBadge, SurfaceChip } from "./TennisUi";
import {
  calendarMeta,
  categoryLabel,
  categoryRank,
  dateRange,
  formatPrize,
  monthLabel,
  tennisPaths,
  tennisUpdatedAt,
  tourData,
  tourLabel,
  tournamentStatus,
  type Tour,
  type Tournament,
} from "../../lib/tennis";
import { usePageMeta } from "../../lib/pageMeta";

const FILTERS = [
  { id: "all", label: "Tutti", test: () => true },
  { id: "main", label: "Slam, Finals e 1000", test: (t: Tournament) => categoryRank(t.category) <= 2 },
  { id: "500", label: "500", test: (t: Tournament) => categoryRank(t.category) === 3 },
  { id: "250", label: "250 e 125", test: (t: Tournament) => categoryRank(t.category) >= 4 },
] as const;

export function TennisCalendarPage({ tour }: { tour: Tour }) {
  const meta = calendarMeta(tour);
  usePageMeta(meta);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [hideFinished, setHideFinished] = useState(true);
  const { tournaments } = tourData(tour);
  if (!tournaments.length) return <NotFoundPage />;
  const other: Tour = tour === "atp" ? "wta" : "atp";
  const f = FILTERS.find((x) => x.id === filter)!;
  const list = tournaments.filter((t) => f.test(t) && !(hideFinished && tournamentStatus(t) === "finished"));
  const months: [string, Tournament[]][] = [];
  for (const t of list) {
    const m = t.start ? monthLabel(t.start) : "Date da definire";
    const g = months.find(([k]) => k === m);
    if (g) g[1].push(t);
    else months.push([m, [t]]);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={CalendarDays}
        title={meta.title}
        subtitle={`Date, sede, superficie e categoria dei tornei del circuito ${tourLabel(tour)}.`}
        breadcrumb={[{ label: "Tennis", to: "/tennis" }, { label: `Calendario ${tourLabel(tour)}` }]}
        meta={<DataUpdatedNote generatedAt={tennisUpdatedAt} />}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to={tennisPaths.calendar(other)} className="text-slate-300 hover:text-white underline underline-offset-2">
            Calendario {tourLabel(other)}
          </Link>
          <Link to={tennisPaths.ranking(tour)} className="text-slate-300 hover:text-white underline underline-offset-2">
            Classifica {tourLabel(tour)}
          </Link>
        </div>
      </PageHeader>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtra per categoria">
          {FILTERS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={filter === x.id}
              onClick={() => setFilter(x.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                filter === x.id
                  ? "bg-selected text-selected-foreground border-selected"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500"
              }`}
            >
              {x.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hideFinished}
              onChange={(e) => setHideFinished(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            Nascondi i tornei conclusi
          </label>
        </div>
        {months.length === 0 && <p className="text-slate-400">Nessun torneo per questo filtro.</p>}
        {months.map(([month, items]) => (
          <section key={month} aria-labelledby={`m-${month}`}>
            <h2 id={`m-${month}`} className="text-white text-xl mb-3 first-letter:uppercase">
              {month}
            </h2>
            <ul className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">
              {items.map((t) => {
                const prize = formatPrize(t);
                const main = categoryRank(t.category) <= 2;
                return (
                  <li key={`${t.id}-${t.season}`} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="sm:w-36 shrink-0 text-slate-300 text-sm tabular-nums">{dateRange(t)}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`${main ? "text-white" : "text-slate-200"} flex flex-wrap items-center gap-2`}>
                        {t.name}
                        {t.category && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs ${main ? "bg-warn text-slate-950" : "bg-slate-800 text-slate-300"}`}
                          >
                            {categoryLabel(t.category)}
                          </span>
                        )}
                      </p>
                      <p className="text-slate-400 text-sm flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {t.location && <span>{t.location}</span>}
                        <SurfaceChip surface={t.surface} />
                        {prize && <span>Montepremi {prize}</span>}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge tournament={t} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
