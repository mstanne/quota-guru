// Day headings of the match lists: "Oggi", "Domani" or "Ieri" before the date. The pre-rendered HTML has only the
// date (the build day is not the reader's day): the relative word is added after hydration, on the reader's clock.
import { useEffect, useState } from "react";
import { formatDay, romeDay } from "../../lib/footballCore";

/** Today's date in Rome ("2026-11-05") on the reader's clock, or null before hydration. */
export function useRomeToday() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setToday(romeDay(new Date().toISOString()));
    tick();
    // keeps "Oggi" right for a page left open past midnight
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, []);
  return today;
}

const shift = (day: string, n: number) =>
  new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** "Oggi", "Domani", "Ieri" or null for a Rome day ("2026-11-05"). */
export function relativeDay(day: string, today: string | null) {
  if (!today) return null;
  if (day === today) return "Oggi";
  if (day === shift(today, 1)) return "Domani";
  if (day === shift(today, -1)) return "Ieri";
  return null;
}

export function DayLabel({ iso, today }: { iso: string; today: string | null }) {
  const rel = relativeDay(romeDay(iso), today);
  const date = formatDay(iso);
  if (!rel) return <span className="inline-block first-letter:uppercase">{date}</span>;
  return (
    <>
      <span className="text-white">{rel}</span>
      <span className="text-slate-400"> · {date}</span>
    </>
  );
}
