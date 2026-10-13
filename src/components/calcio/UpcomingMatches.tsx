import { Link } from "react-router";
import { CalendarDays } from "lucide-react";
import home from "../../data/football-home.json";
import type { CompetitionRef, Match } from "../../lib/footballCore";
import { MatchRow } from "./MatchRow";
import { DataUpdatedNote } from "./DataUpdatedNote";

// Small pre-computed list (scripts/derive-football-home.mjs) so the home page does not load the full snapshot.
const data = home as unknown as { generatedAt: string; matches: { competition: CompetitionRef; match: Match }[] };

/** Home page block: next real fixtures from football-data.org. */
export function UpcomingMatches({ limit = 8 }: { limit?: number }) {
  const next = data.matches.slice(0, limit);
  if (next.length === 0) return null;

  return (
    <section className="py-12 bg-slate-950" aria-labelledby="prossime-partite">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h2 id="prossime-partite" className="flex items-center gap-2 text-white text-2xl mb-1">
              <CalendarDays className="w-6 h-6 text-slate-300" aria-hidden="true" />
              Prossime partite
            </h2>
            <DataUpdatedNote generatedAt={data.generatedAt} />
          </div>
          <Link
            to="/calcio"
            className="px-4 py-2 rounded-md border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white text-sm"
          >
            Tutto il calendario
          </Link>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {next.map(({ competition, match }) => (
            <MatchRow key={match.id} competition={competition} match={match} showCompetition />
          ))}
        </div>
      </div>
    </section>
  );
}
