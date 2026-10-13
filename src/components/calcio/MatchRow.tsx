import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import {
  formatTime,
  isFinished,
  isLive,
  matchPath,
  roundLabel,
  statusLabel,
  type Competition,
  type Match,
  type Team,
} from "../../lib/football";

/**
 * Team crest (football-data.org CDN). Falls back to the three-letter code if the crest is missing
 * or fails to load. The box size is fixed so the layout does not move while the image loads.
 */
export function TeamBadge({
  team,
  size = "sm",
}: {
  team: Pick<Team, "tla" | "crest" | "shortName">;
  size?: "sm" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const box = size === "lg" ? "w-16 h-16 rounded-xl p-2" : "w-9 h-9 rounded-lg p-1";
  const px = size === "lg" ? 64 : 36;
  if (team.crest && !failed) {
    return (
      <span
        aria-hidden="true"
        className={`${box} shrink-0 inline-flex items-center justify-center bg-slate-800 border border-slate-700`}
      >
        <img
          src={team.crest}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain"
        />
      </span>
    );
  }
  const text = size === "lg" ? "text-lg" : "text-[11px]";
  return (
    <span
      aria-hidden="true"
      className={`${box} ${text} shrink-0 inline-flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-200 font-semibold tracking-wide`}
    >
      {team.tla || "–"}
    </span>
  );
}

/** One fixture/result row, linking to the match page. */
export function MatchRow({
  competition,
  match,
  showCompetition = false,
}: {
  competition: Competition;
  match: Match;
  showCompetition?: boolean;
}) {
  const finished = isFinished(match);
  const live = isLive(match);
  const ft = match.score.fullTime;
  const label = `${match.homeTeam.shortName} – ${match.awayTeam.shortName}, ${finished ? `risultato ${ft.home}-${ft.away}` : `ore ${formatTime(match.utcDate)}`}`;

  return (
    <Link
      to={matchPath(competition, match)}
      aria-label={label}
      className="group flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40 transition-colors focus-visible:outline-2 focus-visible:outline-action"
    >
      <div className="w-14 shrink-0 text-center">
        {finished ? (
          <span className="text-slate-400 text-xs uppercase tracking-wide">Finale</span>
        ) : live ? (
          <span className="text-red-400 text-xs font-semibold uppercase">{statusLabel(match)}</span>
        ) : (
          <span className="text-white tabular-nums">{formatTime(match.utcDate)}</span>
        )}
        {match.status === "POSTPONED" && <span className="block text-amber-400 text-xs">Rinviata</span>}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        {[
          { team: match.homeTeam, goals: ft.home, win: match.score.winner === "HOME_TEAM" },
          { team: match.awayTeam, goals: ft.away, win: match.score.winner === "AWAY_TEAM" },
        ].map(({ team, goals, win }) => (
          <div key={team.id} className="flex items-center gap-2.5">
            <TeamBadge team={team} />
            <span className={`truncate ${finished && !win ? "text-slate-400" : "text-white"}`}>{team.shortName}</span>
            {(finished || live) && (
              <span className={`ml-auto tabular-nums text-lg ${win ? "text-best" : "text-slate-300"}`}>
                {goals ?? "–"}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="hidden sm:block w-40 shrink-0 text-right text-xs text-slate-400">
        {showCompetition && <div className="text-slate-300 text-sm">{competition.name}</div>}
        <div>{roundLabel(match)}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" aria-hidden="true" />
    </Link>
  );
}
