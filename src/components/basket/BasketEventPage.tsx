// /pronostici/nba/:evento – evergreen page of an NBA fixture (home team, away team), e.g.
// /pronostici/nba/lakers-celtics. Same rules as the football event pages (src/components/calcio/CalcioEventPage.tsx):
// it shows the next game that is not final; with every game final it rests on the last result.
import { useParams } from "react-router";
import { CalendarClock, History, Trophy } from "lucide-react";
import { Link } from "../../lib/links";
import {
  basketPaths,
  basketUpdatedAt,
  gamePairSlug,
  gamePath,
  nbaEventMeta,
  nbaEventPath,
  nbaPairGames,
  nextOfNbaPair,
  type BasketGame,
} from "../../lib/basket";
import { basketPredictionFor } from "../../lib/basketPredict";
import { formatShortDate, PRONOSTICI } from "../../lib/footballCore";
import { usePageMeta } from "../../lib/pageMeta";
import { ArchivedOrNotFound } from "../../lib/archive";
import { nbaResultsPath } from "../../lib/results";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { TeamBadge } from "../calcio/MatchRow";
import { GameView } from "./BasketGamePage";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const short = (t: BasketGame["home"]) => t.shortName ?? t.name;

export function BasketEventPage() {
  const { evento } = useParams();
  const list = nbaPairGames(evento);
  const next = nextOfNbaPair(list);
  usePageMeta(list.length ? nbaEventMeta(evento!, !!next && !!basketPredictionFor(next.id)) : null);
  if (!list.length) return <ArchivedOrNotFound />;
  if (next) return <GameView game={next} event />;
  return <RestingNbaEvent list={list} />;
}

function RestingNbaEvent({ list }: { list: BasketGame[] }) {
  const last = list[list.length - 1];
  const teams = `${short(last.home)} – ${short(last.away)}`;
  const reverse = nbaPairGames(gamePairSlug({ home: last.away, away: last.home }));
  const reverseNext = nextOfNbaPair(reverse);
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={`${teams}: ultimo risultato e precedenti`}
        subtitle={`NBA. Il pronostico della prossima ${teams} comparirà qui appena la partita sarà in calendario.`}
        icon={Trophy}
        breadcrumb={[{ label: "Pronostici", to: PRONOSTICI }, { label: "NBA", to: basketPaths.nba }, { label: teams }]}
        meta={<DataUpdatedNote generatedAt={basketUpdatedAt} />}
      />
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`} aria-labelledby="ultima">
          <h2 id="ultima" className="flex items-center gap-2 text-white text-xl mb-4">
            <CalendarClock className="w-5 h-5 text-slate-300" aria-hidden="true" />
            Ultima sfida
          </h2>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {[last.home, null, last.away].map((t) =>
              t ? (
                <div key={t.id} className="flex flex-col items-center text-center gap-2">
                  <TeamBadge team={{ tla: t.abbr, shortName: t.name, crest: null }} size="lg" />
                  <span className="text-white">{t.name}</span>
                </div>
              ) : (
                <div key="score" className="text-center">
                  <div className="text-white text-4xl tabular-nums">
                    {last.score.home} <span className="text-slate-400">–</span> {last.score.away}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">{formatShortDate(last.utcDate)}</div>
                </div>
              ),
            )}
          </div>
          <p className="mt-5 text-sm">
            <Link to={gamePath(last)} className="text-action-text hover:text-action-text-hover">
              Parziali, statistiche e pronostico pubblicato prima della partita →
            </Link>
          </p>
        </section>

        <aside className={card} aria-labelledby="altre">
          <h2 id="altre" className="text-white text-lg mb-3">
            Pagine collegate
          </h2>
          <ul className="space-y-2 text-sm">
            {reverse.length > 0 && (
              <li>
                <Link to={nbaEventPath(reverse[0])} className="text-action-text hover:text-action-text-hover">
                  {reverseNext ? "Pronostico" : "Sfida"} {short(reverse[0].home)} – {short(reverse[0].away)}
                </Link>
                {reverseNext && <span className="text-slate-400"> · {formatShortDate(reverseNext.utcDate)}</span>}
              </li>
            )}
            <li>
              <Link to={basketPaths.nba} className="text-action-text hover:text-action-text-hover">
                Tutti i pronostici NBA
              </Link>
            </li>
            <li>
              <Link to={nbaResultsPath()} className="text-action-text hover:text-action-text-hover">
                Risultati NBA
              </Link>
            </li>
          </ul>
        </aside>

        {list.length > 1 && (
          <section className={`${card} lg:col-span-3`} aria-labelledby="stagione">
            <h2 id="stagione" className="flex items-center gap-2 text-white text-xl mb-4">
              <History className="w-5 h-5 text-slate-300" aria-hidden="true" />
              {teams} in stagione
            </h2>
            <ul className="divide-y divide-slate-800 text-sm">
              {[...list].reverse().map((g) => (
                <li key={g.id} className="py-2.5">
                  <Link to={gamePath(g)} className="text-action-text hover:text-action-text-hover tabular-nums">
                    {formatShortDate(g.utcDate)}: {g.score.home}-{g.score.away}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
