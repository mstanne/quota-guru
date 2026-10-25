import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Info } from "lucide-react";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { TeamBadge } from "../calcio/MatchRow";
import { NotFoundPage } from "../NotFoundPage";
import { BasketPredictionPanel } from "./BasketPrediction";
import { basketPredictionFor } from "../../lib/basketPredict";
import { BasketGameRow } from "./BasketGameRow";
import { formatDay, formatTime, romeDay } from "../../lib/footballCore";
import {
  basketPaths,
  basketUpdatedAt,
  findGame,
  gameMeta,
  gameRoundLabel,
  gameStatusLabel,
  isGameFinished,
  isGameLive,
  isGamePending,
  nbaGames,
  nbaSeasonYear,
} from "../../lib/basket";
import { usePageMeta } from "../../lib/pageMeta";
import { nbaEditorial } from "../../lib/editorial";
import { MatchEditorial } from "../editorial/MatchEditorial";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

/** /basket/nba/:partita */
export function BasketGamePage() {
  const { partita } = useParams();
  const game = findGame(partita);
  usePageMeta(game ? gameMeta(game) : null);
  if (!game) return <NotFoundPage />;

  const finished = isGameFinished(game);
  const live = isGameLive(game);
  const sameDay = nbaGames.filter((g) => g.id !== game.id && romeDay(g.utcDate) === romeDay(game.utcDate));
  const periods = game.periods;
  const periodLabel = (i: number) => (i < 4 ? `${i + 1}º` : `OT${i - 3}`);
  const prediction = basketPredictionFor(game.id);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <nav aria-label="Percorso" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <Link to="/basket" className="hover:text-white">
              Basket
            </Link>
            <span aria-hidden="true">›</span>
            <Link to={basketPaths.nba} className="hover:text-white">
              NBA
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-slate-300">
              {game.home.shortName ?? game.home.name} – {game.away.shortName ?? game.away.name}
            </span>
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-sm">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">NBA</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{gameRoundLabel(game)}</span>
            <span
              className={`px-2 py-0.5 rounded-md ${live ? "bg-live text-white" : isGamePending(game) ? "bg-slate-800 text-warn" : "bg-slate-800 text-slate-300"}`}
            >
              {gameStatusLabel(game)}
            </span>
          </div>
          <h1 className="sr-only">
            {game.home.name} – {game.away.name}, NBA
          </h1>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-w-3xl mx-auto">
            {[game.home, null, game.away].map((t, i) =>
              t ? (
                <div key={t.id} className="flex flex-col items-center text-center gap-3">
                  <TeamBadge team={{ tla: t.abbr, shortName: t.name, crest: null }} size="lg" />
                  <span className="text-white text-lg sm:text-2xl">{t.name}</span>
                  <span className="text-slate-400 text-xs">{i === 0 ? "In casa" : "In trasferta"}</span>
                </div>
              ) : (
                <div key="score" className="text-center">
                  {finished || live ? (
                    <div className="text-white text-4xl sm:text-5xl tabular-nums">
                      {game.score.home ?? 0} <span className="text-slate-400">–</span> {game.score.away ?? 0}
                    </div>
                  ) : (
                    <>
                      <div className="text-white text-3xl sm:text-4xl tabular-nums">{formatTime(game.utcDate)}</div>
                      <div className="text-slate-400 text-sm mt-1 first-letter:uppercase">
                        {formatDay(game.utcDate)}
                      </div>
                    </>
                  )}
                </div>
              ),
            )}
          </div>
          <DataUpdatedNote generatedAt={basketUpdatedAt} className="justify-center mt-6" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {prediction && (!finished || prediction.pre) && (
          <BasketPredictionPanel
            prediction={prediction}
            home={game.home.shortName ?? game.home.name}
            away={game.away.shortName ?? game.away.name}
            result={finished && game.score.home != null && game.score.away != null ? { home: game.score.home, away: game.score.away } : null}
          />
        )}

        <MatchEditorial
          article={nbaEditorial({ game, games: nbaGames, season: nbaSeasonYear, generatedAt: basketUpdatedAt })}
        />

        {periods && periods.home.length > 0 && (
          <section className={card} aria-labelledby="parziali">
            <h2 id="parziali" className="text-white text-xl mb-4">
              Parziali
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th scope="col" className="text-left font-normal py-2">
                      Squadra
                    </th>
                    {periods.home.map((_, i) => (
                      <th key={i} scope="col" className="text-right font-normal py-2 px-2">
                        {periodLabel(i)}
                      </th>
                    ))}
                    <th scope="col" className="text-right font-normal py-2 px-2">
                      Totale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { t: game.home, p: periods.home, s: game.score.home },
                    { t: game.away, p: periods.away, s: game.score.away },
                  ].map(({ t, p, s }) => (
                    <tr key={t.id} className="border-b border-slate-800 last:border-0">
                      <th scope="row" className="text-left font-normal py-2 text-white">
                        {t.name}
                      </th>
                      {p.map((v, i) => (
                        <td key={i} className="text-right px-2 text-slate-300 tabular-nums">
                          {v}
                        </td>
                      ))}
                      <td className="text-right px-2 text-white font-semibold tabular-nums">{s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className={card} aria-labelledby="info">
          <h2 id="info" className="flex items-center gap-2 text-white text-xl mb-4">
            <Info className="w-5 h-5 text-slate-300" aria-hidden="true" />
            Informazioni
          </h2>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Data</dt>
              <dd className="text-white text-right first-letter:uppercase">{formatDay(game.utcDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Palla a due</dt>
              <dd className="text-white tabular-nums">{formatTime(game.utcDate)} (ora italiana)</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Competizione</dt>
              <dd className="text-white">NBA · {gameRoundLabel(game)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Stato</dt>
              <dd className="text-white">{gameStatusLabel(game)}</dd>
            </div>
          </dl>
        </section>

        {sameDay.length > 0 && (
          <section aria-labelledby="stesso-giorno">
            <h2 id="stesso-giorno" className="flex items-center gap-2 text-white text-xl mb-4">
              <CalendarDays className="w-5 h-5 text-slate-300" aria-hidden="true" />
              Altre partite dello stesso giorno
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {sameDay.map((g) => (
                <BasketGameRow key={g.id} game={g} />
              ))}
            </div>
          </section>
        )}

        <Link to={basketPaths.nba} className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Tutte le partite NBA
        </Link>
      </div>
    </div>
  );
}
