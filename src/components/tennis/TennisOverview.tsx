// Real data block on the Tennis page: top of the ATP/WTA rankings and tournaments in progress / next.
import { Link } from "react-router";
import { CalendarDays, ListOrdered } from "lucide-react";
import { Movement, StatusBadge, SurfaceChip } from "./TennisUi";
import { categoryLabel, currentAndNext, dateRange, tennisPaths, tourData, tourLabel, tours } from "../../lib/tennis";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const more = "text-sm text-slate-300 hover:text-white underline underline-offset-2";

export function TennisOverview() {
  if (!tours.some((t) => tourData(t).rankings.length || tourData(t).tournaments.length)) return null;
  return (
    <section aria-labelledby="classifiche-tornei" className="mb-10">
      <h2 id="classifiche-tornei" className="text-white text-xl mb-4">
        Classifiche e tornei
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {tours.map((t) => {
          const { rankings } = tourData(t);
          const next = currentAndNext(t, 3);
          return (
            <div key={t} className={card}>
              <h3 className="flex items-center gap-2 text-white text-lg mb-3">
                <ListOrdered className="w-5 h-5 text-slate-300" aria-hidden="true" />
                Classifica {tourLabel(t)}
              </h3>
              {rankings.length > 0 && (
                <ol className="space-y-1.5 mb-3">
                  {rankings.slice(0, 5).map((r) => (
                    <li key={r.player.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 text-slate-400 tabular-nums">{r.rank}</span>
                      <span className="flex-1 text-white">{r.player.name}</span>
                      <span className="text-slate-400 hidden sm:inline">{r.player.country}</span>
                      <span className="w-16 text-right text-slate-300 tabular-nums">
                        {r.points != null ? new Intl.NumberFormat("it-IT").format(r.points) : "–"}
                      </span>
                      <span className="w-8 text-right tabular-nums">
                        <Movement value={r.movement} />
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <Link to={tennisPaths.ranking(t)} className={more}>
                Classifica {tourLabel(t)} completa
              </Link>
              {next.length > 0 && (
                <>
                  <h3 className="flex items-center gap-2 text-white text-lg mt-6 mb-3">
                    <CalendarDays className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    Tornei {tourLabel(t)} in corso e in arrivo
                  </h3>
                  <ul className="space-y-3 mb-3">
                    {next.map((x) => (
                      <li key={`${x.id}-${x.season}`} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="text-white">
                            {x.name}
                            {x.category && <span className="text-slate-400"> · {categoryLabel(x.category)}</span>}
                          </p>
                          <p className="text-slate-400 flex flex-wrap gap-x-3">
                            <span>{dateRange(x)}</span>
                            {x.location && <span>{x.location}</span>}
                            <SurfaceChip surface={x.surface} />
                          </p>
                        </div>
                        <StatusBadge tournament={x} />
                      </li>
                    ))}
                  </ul>
                  <Link to={tennisPaths.calendar(t)} className={more}>
                    Calendario {tourLabel(t)} completo
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
