import { Link, useParams } from "react-router";
import { ListOrdered } from "lucide-react";
import { competitionPath, findCompetition } from "../../lib/football";
import { DataUpdatedNote } from "./CalcioPage";
import { TeamBadge } from "./MatchRow";
import { NotFoundPage } from "../NotFoundPage";

/** /calcio/:competizione/classifica */
export function StandingsPage() {
  const { competizione } = useParams();
  const competition = findCompetition(competizione);
  if (!competition || competition.standings.length === 0) return <NotFoundPage />;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 py-10">
        <div className="container mx-auto px-4">
          <nav aria-label="Percorso" className="text-sm text-slate-400 mb-3">
            <Link to="/calcio" className="hover:text-white">
              Calcio
            </Link>{" "}
            <span aria-hidden="true">›</span>{" "}
            <Link to={competitionPath(competition)} className="hover:text-white">
              {competition.name}
            </Link>{" "}
            <span aria-hidden="true">›</span> <span className="text-slate-300">Classifica</span>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <ListOrdered className="w-8 h-8 text-green-500" aria-hidden="true" />
            <h1 className="text-white text-3xl sm:text-4xl">Classifica {competition.name}</h1>
          </div>
          <DataUpdatedNote />
        </div>
      </div>

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
                          <TeamBadge tla={r.team.tla} />
                          <span className="text-white">{r.team.shortName}</span>
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
        <Link to={competitionPath(competition)} className="inline-block text-green-500 hover:text-green-400">
          Calendario e risultati {competition.name} →
        </Link>
      </div>
    </div>
  );
}
