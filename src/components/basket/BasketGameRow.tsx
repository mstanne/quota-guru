import { Link } from "../../lib/links";
import { ChevronRight } from "lucide-react";
import { formatTime } from "../../lib/footballCore";
import { gamePath, gameRoundLabel, isGameFinished, isGameLive, isGamePending, type BasketGame } from "../../lib/basket";
import { TeamBadge } from "../calcio/MatchRow";
import { basketPredictionFor } from "../../lib/basketPredict";
import { BasketPredictionMini } from "./BasketPrediction";

/** One NBA game row (same look as the football rows), linking to the game page; upcoming games show win %. */
export function BasketGameRow({ game }: { game: BasketGame }) {
  const finished = isGameFinished(game);
  const live = isGameLive(game);
  const pending = isGamePending(game);
  const label = `${game.home.name} – ${game.away.name}, ${finished ? `risultato ${game.score.home}-${game.score.away}` : pending ? "risultato in arrivo" : `ore ${formatTime(game.utcDate)}`}`;
  const homeWin = finished && (game.score.home ?? 0) > (game.score.away ?? 0);
  const awayWin = finished && (game.score.away ?? 0) > (game.score.home ?? 0);
  const prediction = !finished && !live && !pending ? basketPredictionFor(game.id) : undefined;
  return (
    <Link
      to={gamePath(game)}
      aria-label={label}
      className="group flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40 transition-colors focus-visible:outline-2 focus-visible:outline-action"
    >
      <div className="w-14 shrink-0 text-center">
        {finished ? (
          <span className="text-slate-400 text-xs uppercase tracking-wide">Finale</span>
        ) : live ? (
          <span className="text-red-400 text-xs font-semibold uppercase">In corso</span>
        ) : pending ? (
          <span className="block text-warn text-[11px] leading-tight">Risultato in arrivo</span>
        ) : (
          <span className="text-white tabular-nums">{formatTime(game.utcDate)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {[
          { team: game.home, pts: game.score.home, win: homeWin },
          { team: game.away, pts: game.score.away, win: awayWin },
        ].map(({ team, pts, win }) => (
          <div key={team.id} className="flex items-center gap-2.5">
            <TeamBadge team={{ tla: team.abbr, shortName: team.name, crest: null }} />
            <span className={`truncate ${finished && !win ? "text-slate-400" : "text-white"}`}>{team.name}</span>
            {(finished || live) && (
              <span className={`ml-auto tabular-nums text-lg ${win ? "text-best" : "text-slate-300"}`}>
                {pts ?? "–"}
              </span>
            )}
          </div>
        ))}
      </div>
      {prediction && (
        <div className="shrink-0">
          <BasketPredictionMini prediction={prediction} home={game.home.name} away={game.away.name} />
        </div>
      )}
      <div className="hidden md:block w-40 shrink-0 text-right text-xs text-slate-400">
        <div className="text-slate-300 text-sm">NBA</div>
        <div>{gameRoundLabel(game)}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" aria-hidden="true" />
    </Link>
  );
}
