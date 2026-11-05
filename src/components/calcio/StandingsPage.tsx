import { useParams } from "react-router";
import { Link } from "../../lib/links";
import { ListOrdered } from "lucide-react";
import { hasSeasons, seasonsPath } from "../../lib/seasons";
import {
  competitionPath,
  cornersCardsPath,
  goalStatsPath,
  isFinished,
  leadersPath,
  mainTable,
  matchdayPath,
  seasonName,
  standingsMeta,
  standingsSummary,
  type Competition,
} from "../../lib/footballCore";
import { matchdayDates, matchdaysOf, type Matchday } from "../../lib/matchdaysCore";
import { FormBadges } from "./FormBadges";
import { MatchRow } from "./MatchRow";
import { useCompetitionData } from "../../lib/footballData";
import { usePageMeta } from "../../lib/pageMeta";
import { DataUpdatedNote } from "./DataUpdatedNote";
import { TeamBadge } from "./MatchRow";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { TeamName } from "../teams/TeamLink";

/** /calcio/:competizione/classifica */
export function StandingsPage() {
  const { competizione } = useParams();
  const data = useCompetitionData(competizione);
  const competition = data?.competition;
  usePageMeta(competition ? standingsMeta(competition) : null);
  if (!competition || competition.standings.length === 0) return <NotFoundPage />;

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={ListOrdered}
        title={`Classifica ${competition.name}${seasonName(competition) ? ` ${seasonName(competition)}` : ""}`}
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: competition.name, to: competitionPath(competition) },
          { label: "Classifica" },
        ]}
        meta={<DataUpdatedNote generatedAt={data!.generatedAt} />}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <Summary competition={competition} />
        {competition.standings.map((group) => (
          <section key={`${group.stage}-${group.group}`} aria-label={group.group ?? "Classifica"}>
            {competition.standings.length > 1 && <h2 className="text-white text-xl mb-3">{group.group}</h2>}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <caption className="sr-only">Classifica {competition.name}</caption>
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th scope="col" className="text-left font-normal px-4 py-3 w-10">
                      #
                    </th>
                    <th scope="col" className="text-left font-normal py-3">
                      Squadra
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      Pt
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      <abbr title="Partite giocate">G</abbr>
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      <abbr title="Vittorie">V</abbr>
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      <abbr title="Pareggi">N</abbr>
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      <abbr title="Sconfitte">P</abbr>
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      <abbr title="Gol fatti">GF</abbr>
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-2">
                      <abbr title="Gol subiti">GS</abbr>
                    </th>
                    <th scope="col" className="text-right font-normal py-3 px-4">
                      <abbr title="Differenza reti">DR</abbr>
                    </th>
                    <th scope="col" className="text-left font-normal py-3 pr-4">
                      Forma <span className="sr-only">(ultime 5, dalla più recente)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.table.map((r) => (
                    <tr key={r.team.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.position}</td>
                      <th scope="row" className="py-2.5 text-left font-normal">
                        <span className="flex items-center gap-2.5">
                          <TeamBadge team={r.team} />
                          <TeamName id={r.team.id} name={r.team.shortName} />
                        </span>
                      </th>
                      <td className="text-right px-2 text-white font-semibold tabular-nums">{r.points}</td>
                      <td className="text-right px-2 text-slate-300 tabular-nums">{r.playedGames}</td>
                      <td className="text-right px-2 text-slate-300 tabular-nums">{r.won}</td>
                      <td className="text-right px-2 text-slate-300 tabular-nums">{r.draw}</td>
                      <td className="text-right px-2 text-slate-300 tabular-nums">{r.lost}</td>
                      <td className="text-right px-2 text-slate-300 tabular-nums">{r.goalsFor}</td>
                      <td className="text-right px-2 text-slate-300 tabular-nums">{r.goalsAgainst}</td>
                      <td className="text-right px-4 text-slate-300 tabular-nums">
                        {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                      </td>
                      <td className="pr-4">
                        <FormBadges competition={competition} teamId={r.team.id} size="sm" empty={<span className="text-slate-500">–</span>} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <Rounds competition={competition} />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to={competitionPath(competition)} className="text-action-text hover:text-action-text-hover">
            Calendario e risultati {competition.name} →
          </Link>
          <Link to={goalStatsPath(competition)} className="text-action-text hover:text-action-text-hover">
            Statistiche Under/Over e Goal {competition.name} →
          </Link>
          {hasSeasons(competition.slug) && (
            <Link to={seasonsPath(competition.slug)} className="text-action-text hover:text-action-text-hover">
              Albo d'oro e stagioni passate {competition.name} →
            </Link>
          )}
          {competition.leaders?.scorers?.length ? (
            <Link to={leadersPath(competition)} className="text-action-text hover:text-action-text-hover">
              Classifica marcatori {competition.name} →
            </Link>
          ) : null}
          {data.matchStats ? (
            <Link to={cornersCardsPath(competition)} className="text-action-text hover:text-action-text-hover">
              Statistiche corner e cartellini {competition.name} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Factual summary above the table: leader, best attack and defence, bottom of the table. */
function Summary({ competition }: { competition: Competition }) {
  const sum = standingsSummary(competition);
  if (!sum) return null;
  const t = mainTable(competition);
  const attack = [...t].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const defence = [...t].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
  const last = t[t.length - 1];
  return (
    <p className="text-slate-300 max-w-3xl">
      {sum.text}. Miglior attacco: {attack.team.shortName} ({attack.goalsFor} gol fatti); miglior difesa:{" "}
      {defence.team.shortName} ({defence.goalsAgainst} gol subiti). Ultimo posto: {last.team.shortName} con {last.points}{" "}
      {last.points === 1 ? "punto" : "punti"}.
    </p>
  );
}

/** Results of the last completed round and fixtures of the next one, with links to their pages. */
function Rounds({ competition }: { competition: Competition }) {
  const list = matchdaysOf(competition);
  const open = (d: Matchday) => d.matches.some((m) => !isFinished(m) && m.status !== "POSTPONED");
  const next = list.find(open);
  const done = [...list].reverse().find((d) => d.matches.some(isFinished) && d !== next);
  if (!next && !done) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      {[
        done && { d: done, title: `Ultima giornata: ${done.n}ª` },
        next && { d: next, title: `Prossima giornata: ${next.n}ª` },
      ]
        .filter((x): x is { d: Matchday; title: string } => Boolean(x))
        .map(({ d, title }) => (
          <section key={d.n} aria-labelledby={`giornata-${d.n}`}>
            <h2 id={`giornata-${d.n}`} className="text-white text-xl">
              {title}
            </h2>
            <p className="text-slate-400 text-sm mb-3">{matchdayDates(d)}</p>
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {d.matches.map((m) => (
                <MatchRow key={m.id} competition={competition} match={m} />
              ))}
            </div>
            <Link to={matchdayPath(competition, d)} className="inline-block mt-3 text-action-text hover:text-action-text-hover">
              Pronostici e analisi della {d.n}ª giornata →
            </Link>
          </section>
        ))}
    </div>
  );
}
