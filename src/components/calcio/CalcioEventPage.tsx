// /pronostici/:competizione/:evento – evergreen page of a fixture (home team, away team, competition), e.g.
// /pronostici/serie-a/juventus-inter. It always shows the next meeting that is not finished, with its prediction;
// when every meeting in the data is finished it "rests": last result, earlier meetings, reverse fixture.
// The dated pages (/calcio/<lega>/<casa>-<trasferta>-<data>) stay online as the archive of every prediction.
import { useParams } from "react-router";
import { CalendarClock, History, Trophy } from "lucide-react";
import { Link } from "../../lib/links";
import { useCompetitionData, type CompetitionData } from "../../lib/footballData";
import {
  competitionPath,
  eventMeta,
  eventPath,
  formatShortDate,
  isFinished,
  matchPath,
  nextOfPair,
  pairMatches,
  pairSlug,
  PRONOSTICI,
  standingsPath,
  type Match,
} from "../../lib/footballCore";
import { usePageMeta } from "../../lib/pageMeta";
import { ArchivedOrNotFound } from "../../lib/archive";
import { PageHeader } from "../layout/PageHeader";
import { TeamBadge } from "./MatchRow";
import { MatchView } from "./CalcioMatchPage";
import { DataUpdatedNote } from "./DataUpdatedNote";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

export function CalcioEventPage({ slug }: { slug: string }) {
  const { competizione } = useParams();
  const data = useCompetitionData(competizione);
  const list = data ? pairMatches(data.competition, slug) : [];
  usePageMeta(data && list.length ? eventMeta(data.competition, slug, (id) => !!data.prediction(id)) : null);
  if (!data || !list.length) return <ArchivedOrNotFound />;
  const next = nextOfPair(list);
  if (next) return <MatchView data={data} match={next} event={{ previous: list.filter(isFinished) }} />;
  return <RestingEvent data={data} list={list} />;
}

/** Every meeting of the fixture in the data is finished: last result and links to the archived pages. */
function RestingEvent({ data, list }: { data: CompetitionData; list: Match[] }) {
  const c = data.competition;
  const last = list[list.length - 1];
  const teams = `${last.homeTeam.shortName} – ${last.awayTeam.shortName}`;
  const ft = last.score.fullTime;
  const reverse = pairMatches(c, pairSlug({ homeTeam: last.awayTeam, awayTeam: last.homeTeam }));
  const reverseNext = nextOfPair(reverse);
  const h2h = data.headToHead(last);
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={`${teams}: ultimo risultato e precedenti`}
        subtitle={`${c.name}. Il pronostico della prossima ${teams} comparirà qui appena la partita sarà in calendario.`}
        icon={Trophy}
        breadcrumb={[
          { label: "Pronostici", to: PRONOSTICI },
          { label: c.name, to: competitionPath(c) },
          { label: teams },
        ]}
        meta={<DataUpdatedNote generatedAt={data.generatedAt} />}
      />
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`} aria-labelledby="ultima">
          <h2 id="ultima" className="flex items-center gap-2 text-white text-xl mb-4">
            <CalendarClock className="w-5 h-5 text-slate-300" aria-hidden="true" />
            Ultima sfida
          </h2>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <TeamBadge team={last.homeTeam} size="lg" />
              <span className="text-white">{last.homeTeam.shortName}</span>
            </div>
            <div className="text-center">
              <div className="text-white text-4xl tabular-nums">
                {ft.home} <span className="text-slate-400">–</span> {ft.away}
              </div>
              <div className="text-slate-400 text-sm mt-1">{formatShortDate(last.utcDate)}</div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <TeamBadge team={last.awayTeam} size="lg" />
              <span className="text-white">{last.awayTeam.shortName}</span>
            </div>
          </div>
          <p className="mt-5 text-sm">
            <Link to={matchPath(c, last)} className="text-action-text hover:text-action-text-hover">
              Tabellino, pronostico pubblicato prima della partita e resoconto →
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
                <Link to={eventPath(c, reverse[0])} className="text-action-text hover:text-action-text-hover">
                  {reverseNext ? "Pronostico" : "Sfida"} {reverse[0].homeTeam.shortName} –{" "}
                  {reverse[0].awayTeam.shortName}
                </Link>
                {reverseNext && <span className="text-slate-400"> · {formatShortDate(reverseNext.utcDate)}</span>}
              </li>
            )}
            <li>
              <Link to={competitionPath(c)} className="text-action-text hover:text-action-text-hover">
                Tutti i pronostici di {c.name}
              </Link>
            </li>
            <li>
              <Link to={standingsPath(c)} className="text-action-text hover:text-action-text-hover">
                Classifica {c.name}
              </Link>
            </li>
          </ul>
        </aside>

        {list.length > 1 && (
          <section className={`${card} lg:col-span-3`} aria-labelledby="stagione">
            <h2 id="stagione" className="flex items-center gap-2 text-white text-xl mb-4">
              <History className="w-5 h-5 text-slate-300" aria-hidden="true" />
              {teams} nei dati di {c.name}
            </h2>
            <ul className="divide-y divide-slate-800 text-sm">
              {[...list].reverse().map((m) => (
                <li key={m.id} className="py-2.5">
                  <Link to={matchPath(c, m)} className="text-action-text hover:text-action-text-hover tabular-nums">
                    {formatShortDate(m.utcDate)}: {m.score.fullTime.home}-{m.score.fullTime.away}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {h2h && h2h.matches.length > 0 && (
          <section className={`${card} lg:col-span-3`} aria-labelledby="precedenti">
            <h2 id="precedenti" className="flex items-center gap-2 text-white text-xl mb-4">
              <History className="w-5 h-5 text-slate-300" aria-hidden="true" />
              Precedenti
            </h2>
            <ul className="divide-y divide-slate-800">
              {h2h.matches.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-24 text-slate-400 tabular-nums">{formatShortDate(p.utcDate)}</span>
                  <span className="flex-1 text-white">
                    {p.homeTeam.shortName}{" "}
                    <span className="tabular-nums mx-1">
                      {p.score.fullTime.home}–{p.score.fullTime.away}
                    </span>{" "}
                    {p.awayTeam.shortName}
                  </span>
                  <span className="hidden sm:block text-slate-400">{p.competition}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
