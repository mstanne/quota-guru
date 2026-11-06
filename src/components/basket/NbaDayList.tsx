// NBA games grouped by Italian calendar day ("Oggi · venerdì 6 novembre"), for the short lists outside the NBA
// calendar page (predictions hub). Same look as the football MatchList.
import { romeDay } from "../../lib/footballCore";
import type { BasketGame } from "../../lib/basket";
import { DayLabel, useRomeToday } from "../predictions/DayLabel";
import { ListColumns } from "../calcio/MatchRow";
import { NBA_COLUMN_WIDTH } from "./BasketPrediction";
import { BasketGameRow } from "./BasketGameRow";

export function NbaDayList({ games, idPrefix = "nba-giorno" }: { games: BasketGame[]; idPrefix?: string }) {
  const today = useRomeToday();
  const days: { day: string; iso: string; items: BasketGame[] }[] = [];
  for (const g of games) {
    const day = romeDay(g.utcDate);
    let d = days[days.length - 1];
    if (!d || d.day !== day) days.push((d = { day, iso: g.utcDate, items: [] }));
    d.items.push(g);
  }
  return (
    <div className="space-y-6">
      {days.map((d, i) => (
        <section key={d.day} aria-labelledby={`${idPrefix}-${d.day}`}>
          <div className="flex items-end mb-1.5">
            <h3
              id={`${idPrefix}-${d.day}`}
              className="flex-1 min-w-0 px-3 sm:px-4 text-slate-300 text-sm uppercase tracking-wide"
            >
              <DayLabel iso={d.iso} today={today} />
            </h3>
            {i === 0 && <ListColumns labels={["1", "2"]} width={NBA_COLUMN_WIDTH} meta={false} className="shrink-0" />}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            {d.items.map((g) => (
              <BasketGameRow key={g.id} game={g} columns meta={false} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
