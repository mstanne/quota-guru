import { Link } from "../../lib/links";
import { ChevronRight } from "lucide-react";
import { formatTime, romeDay } from "../../lib/footballCore";
import { gameHref, gameRoundLabel, isGameFinished, isGameLive, isGamePending, type BasketGame } from "../../lib/basket";
import { TeamBadge } from "../calcio/MatchRow";
import { basketPredictionFor } from "../../lib/basketPredict";
import { BasketMarketMini, type BasketMarket } from "./BasketPrediction";

/**
 * One NBA game row (same look as the football rows), linking to the game page; upcoming games show win %, as
 * buttons that add the outcome to the bet slip (stretched link, see MatchRow).
 */
export function BasketGameRow({
  game,
  market = "win",
  columns = false,
}: {
  game: BasketGame;
  market?: BasketMarket;
  /** The list shows column headers (ListColumns): the win cells drop their labels. */
  columns?: boolean;
}) {
  const finished = isGameFinished(game);
  const live = isGameLive(game);
  const pending = isGamePending(game);
  const label = `${game.home.name} – ${game.away.name}, ${finished ? `risultato ${game.score.home}-${game.score.away}` : pending ? "risultato in arrivo" : `ore ${formatTime(game.utcDate)}`}`;
  const homeWin = finished && (game.score.home ?? 0) > (game.score.away ?? 0);
  const awayWin = finished && (game.score.away ?? 0) > (game.score.home ?? 0);
  const prediction = !finished && !live && !pending ? basketPredictionFor(game.id) : undefined;
  const slip = prediction
    ? {
        slipId: `nba-${game.id}`,
        competition: "NBA",
        home: game.home.name,
        away: game.away.name,
        date: romeDay(game.utcDate),
        time: formatTime(game.utcDate),
      }
    : undefined;
  return (
    <div
      className={`group relative flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-2.5 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40 focus-within:bg-slate-800/40 transition-colors ${
        live ? "bg-red-500/5" : ""
      }`}
    >
      <Link
        to={gameHref(game)}
        aria-label={label}
        className="flex flex-1 min-w-0 items-center gap-2.5 sm:gap-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-action focus-visible:after:-outline-offset-2"
      >
        <div className="w-11 sm:w-14 shrink-0 text-center">
          {finished ? (
            <span className="text-slate-400 text-xs uppercase tracking-wide">Finale</span>
          ) : live ? (
            <span className="flex flex-col items-center gap-1 text-red-400 text-[10px] leading-none font-semibold uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
              In corso
            </span>
          ) : pending ? (
            <span className="block text-warn text-[11px] leading-tight">Risultato in arrivo</span>
          ) : (
            <span className="text-white tabular-nums">{formatTime(game.utcDate)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {[
            { team: game.home, pts: game.score.home, win: homeWin },
            { team: game.away, pts: game.score.away, win: awayWin },
          ].map(({ team, pts, win }) => (
            <div key={team.id} className="flex items-center gap-2">
              <TeamBadge team={{ tla: team.abbr, shortName: team.name, crest: null }} size="xs" />
              <span className={`truncate ${finished && !win ? "text-slate-400" : "text-white"}`}>{team.name}</span>
              {(finished || live) && (
                <span
                  className={`ml-auto tabular-nums text-lg ${win ? "text-best" : live ? "text-white font-semibold" : "text-slate-300"}`}
                >
                  {pts ?? "–"}
                </span>
              )}
            </div>
          ))}
        </div>
      </Link>
      {prediction && (
        <div className="relative z-10 shrink-0">
          <BasketMarketMini
            prediction={prediction}
            market={market}
            home={game.home.name}
            away={game.away.name}
            slip={slip}
            columns={columns}
          />
        </div>
      )}
      <div className="hidden md:block w-40 shrink-0 text-right text-xs text-slate-400">
        <div className="text-slate-300 text-sm">NBA</div>
        <div>{gameRoundLabel(game)}</div>
      </div>
      <ChevronRight
        className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-white shrink-0"
        aria-hidden="true"
      />
    </div>
  );
}
