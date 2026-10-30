// "Prossime partite" box of the team pages: links to the prediction of the club's next matches. Besides helping
// the reader, it gives every upcoming match page two more internal links (one per team page) as soon as the
// match is in the calendar, so search engines find it days before kick-off.
import { CalendarClock } from "lucide-react";
import { Link } from "../../lib/links";
import { formatDay, formatTime } from "../../lib/footballCore";
import { Card, SectionTitle } from "./TeamUi";

export interface NextMatch {
  id: number;
  href: string;
  home: string;
  away: string;
  utcDate: string;
  live?: boolean;
}

export function NextMatches({ team, matches, label }: { team: string; matches: NextMatch[]; label: string }) {
  if (!matches.length) return null;
  return (
    <Card id="prossime">
      <SectionTitle id="prossime-titolo" icon={CalendarClock}>
        Prossime partite di {team}
      </SectionTitle>
      <ul className="divide-y divide-slate-800 text-sm">
        {matches.map((m) => (
          <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
            <Link to={m.href} className="text-action-text hover:text-action-text-hover">
              Pronostico {m.home} – {m.away}
            </Link>
            <span className="text-slate-400 tabular-nums">
              {m.live ? "in corso" : `${formatDay(m.utcDate)}, ore ${formatTime(m.utcDate)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-slate-400 text-xs mt-3">{label}</p>
    </Card>
  );
}
