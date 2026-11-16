// "In classifica" box of an NBA game page: conference place, record, last 10 and streak of both teams, with the chance
// of reaching the playoffs from the season projection (src/lib/nbaSeason.ts).
import { ListOrdered } from "lucide-react";
import { Link } from "../../lib/links";
import { TeamBadge } from "../calcio/MatchRow";
import { TeamName } from "../teams/TeamLink";
import { confShort, nbaStandingsPath, nbaTeamStanding, seedZones } from "../../lib/nbaSeason";
import { pct } from "../../lib/seasonOutlook";
import type { BasketGame } from "../../lib/basket";

export function NbaGameStandings({ game }: { game: BasketGame }) {
  const rows = [game.home, game.away].map((t) => ({ t, s: nbaTeamStanding(t.id) }));
  if (rows.some((r) => !r.s || r.s.w + r.s.l === 0)) return null;
  const sim = rows.every((r) => r.s!.sim);
  const th = "text-right font-normal px-2 py-2 whitespace-nowrap";
  const td = "text-right px-2 py-2 tabular-nums";
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="in-classifica">
      <h2 id="in-classifica" className="flex items-center gap-2 text-white text-xl mb-4">
        <ListOrdered className="w-5 h-5 text-slate-300" aria-hidden="true" />
        In classifica
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <caption className="sr-only">
            Classifica di {game.home.shortName ?? game.home.name} e {game.away.shortName ?? game.away.name}
          </caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-2">Squadra</th>
              <th scope="col" className={th}>Posizione</th>
              <th scope="col" className={th}>Record</th>
              <th scope="col" className={th}>Ultime 10</th>
              <th scope="col" className={th}>Serie</th>
              {sim && <th scope="col" className={th} title="Vittorie attese a fine stagione regolare (proiezione del modello)">Vittorie attese</th>}
              {sim && <th scope="col" className={`${th} pr-0`} title="Probabilità di andare ai playoff, play-in compreso">Playoff</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, s }) => (
              <tr key={t.id} className="border-b border-slate-800 last:border-0">
                <th scope="row" className="text-left font-normal py-2">
                  <span className="flex items-center gap-2.5">
                    <TeamBadge team={{ tla: t.abbr, shortName: t.name, crest: null }} size="xs" />
                    <TeamName id={t.id} name={t.shortName ?? t.name} sport="nba" />
                  </span>
                </th>
                <td className={`${td} text-white`}>
                  {s!.pos}ª {s!.conf ? `a ${confShort(s!.conf)}` : ""}
                </td>
                <td className={`${td} text-slate-300`}>{s!.w}-{s!.l}</td>
                <td className={`${td} text-slate-300`}>{s!.last10[0]}-{s!.last10[1]}</td>
                <td className={`${td} text-slate-300`}>{s!.streak ?? "–"}</td>
                {sim && <td className={`${td} text-slate-300`}>{s!.sim!.xw.toFixed(1).replace(".", ",")}</td>}
                {sim && (
                  <td className={`${td} pr-0 text-white font-semibold`} title={`Primi 6: ${pct(seedZones(s!.sim!).top6)}`}>
                    {pct(s!.sim!.stage[1])}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to={nbaStandingsPath} className="inline-block mt-3 text-sm text-action-text hover:text-action-text-hover">
        Classifica NBA completa e proiezione di fine stagione
      </Link>
    </section>
  );
}
