import { useParams } from "react-router";
import { Link } from "../../lib/links";
import { ListOrdered } from "lucide-react";
import { competitionPath, goalStatsPath, standingsMeta } from "../../lib/footballCore";
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
        title={`Classifica ${competition.name}`}
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: competition.name, to: competitionPath(competition) },
          { label: "Classifica" },
        ]}
        meta={<DataUpdatedNote generatedAt={data!.generatedAt} />}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {competition.standings.map((group) => (
          <section key={`${group.stage}-${group.group}`} aria-label={group.group ?? "Classifica"}>
            {competition.standings.length > 1 && <h2 className="text-white text-xl mb-3">{group.group}</h2>}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to={competitionPath(competition)} className="text-action-text hover:text-action-text-hover">
            Calendario e risultati {competition.name} →
          </Link>
          <Link to={goalStatsPath(competition)} className="text-action-text hover:text-action-text-hover">
            Statistiche Under/Over e Goal {competition.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}
