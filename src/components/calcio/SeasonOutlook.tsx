import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { leagueOutlook, pct, type TeamOutlook, type Zone } from "../../lib/seasonOutlook";
import type { Competition } from "../../lib/footballCore";
import { TeamBadge } from "./MatchRow";
import { TeamName } from "../teams/TeamLink";

const fmt = (n: number) => n.toFixed(1).replace(".", ",");
const TONE: Record<Zone["tone"], string> = { top: "text-predict", europe: "text-sky-300", bottom: "text-rose-300" };

/** Share of simulated seasons, with a faint bar behind the figure (stronger when likelier). */
function Cell({ p, tone }: { p: number; tone: Zone["tone"] }) {
  return (
    <td className="text-right px-2 tabular-nums">
      <span className={p >= 0.5 ? `${TONE[tone]} font-semibold` : p > 0 ? "text-slate-200" : "text-slate-500"}>{pct(p)}</span>
    </td>
  );
}

/**
 * End-of-season projection of a league (/calcio/:competizione/classifica): every match still to play simulated with
 * the model of the predictions (scripts/lib/season-sim.mjs). Teams by expected final points.
 */
export function SeasonOutlook({ competition }: { competition: Competition }) {
  const o = leagueOutlook(competition.slug);
  if (!o || competition.standings.length !== 1) return null;
  const rows = competition.standings[0].table
    .map((r) => ({ r, t: o.team(r.team.id) }))
    .filter((x): x is { r: (typeof x)["r"]; t: TeamOutlook } => !!x.t)
    .sort((a, b) => b.t.xpts - a.t.xpts);
  if (!rows.length) return null;
  const runs = o.runs.toLocaleString("it-IT");
  return (
    <section aria-labelledby="proiezione">
      <h2 id="proiezione" className="text-white text-xl">
        Proiezione di fine stagione {competition.name}
      </h2>
      <p className="text-slate-300 mt-2 max-w-3xl">
        Abbiamo simulato {runs} volte le {o.remaining} partite che restano, con le stesse probabilità dei nostri
        pronostici. Per ogni squadra: i punti attesi a fine stagione e in quante stagioni simulate chiude in ogni zona
        della classifica. {o.note}
      </p>
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <caption className="sr-only">Proiezione di fine stagione {competition.name}</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3">
                Squadra
              </th>
              <th scope="col" className="text-right font-normal px-2" title="Posizione attuale in classifica">
                Ora
              </th>
              <th scope="col" className="text-right font-normal px-2" title="Punti attesi a fine stagione">
                Punti attesi
              </th>
              {o.zones.map((z) => (
                <th key={z.key} scope="col" className="text-right font-normal px-2 whitespace-nowrap">
                  {z.short}
                </th>
              ))}
              <th scope="col" className="text-right font-normal px-4 whitespace-nowrap" title="Posizione finale più frequente nelle stagioni simulate">
                Più probabile
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, t }) => (
              <tr key={r.team.id} className="border-b border-slate-800 last:border-0">
                <th scope="row" className="text-left font-normal px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <TeamBadge team={r.team} />
                    <TeamName id={r.team.id} name={r.team.shortName} />
                  </span>
                </th>
                <td className="text-right px-2 text-slate-400 tabular-nums">
                  {r.position}° · {r.points}
                </td>
                <td className="text-right px-2 text-white font-semibold tabular-nums">{fmt(t.xpts)}</td>
                {t.zones.map(({ zone, p }) => (
                  <Cell key={zone.key} p={p} tone={zone.tone} />
                ))}
                <td className="text-right px-4 text-slate-300 tabular-nums">{t.likely}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-2 max-w-3xl">
        Stime statistiche aggiornate a ogni turno, non certezze: a parità di punti contano differenza reti e gol fatti
        (non gli scontri diretti); playoff, playout e spareggi non sono simulati.{" "}
        <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
          Come funziona il modello
        </Link>
      </p>
    </section>
  );
}

/** The projection of one club, for its page: expected points, likeliest position, chance of each zone. */
export function TeamSeasonOutlook({ slug, name, teamId, competitionName }: { slug: string; name: string; teamId: number; competitionName: string }) {
  const o = leagueOutlook(slug);
  const t = o?.team(teamId);
  if (!o || !t) return null;
  // the positions seen in at least 1% of the simulated seasons, for the distribution bar
  const shown = t.pos.map((p, i) => ({ pos: i + 1, p })).filter((x) => x.p >= 0.01);
  const max = Math.max(...shown.map((x) => x.p));
  return (
    <section aria-labelledby="proiezione-squadra" className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <h2 id="proiezione-squadra" className="text-white text-lg">
        Dove può chiudere {name}: proiezione {competitionName}
      </h2>
      <p className="text-slate-300 text-sm mt-1">
        {o.runs.toLocaleString("it-IT")} simulazioni delle {o.remaining} partite di campionato che restano, con le
        probabilità dei nostri pronostici.
      </p>
      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-950/60 p-3">
          <dt className="text-slate-400 text-xs">Punti attesi</dt>
          <dd className="text-white text-xl font-semibold tabular-nums">{fmt(t.xpts)}</dd>
        </div>
        <div className="rounded-lg bg-slate-950/60 p-3">
          <dt className="text-slate-400 text-xs">Posizione più probabile</dt>
          <dd className="text-white text-xl font-semibold tabular-nums">{t.likely}°</dd>
        </div>
        {t.zones.map(({ zone, p }) => (
          <div key={zone.key} className="rounded-lg bg-slate-950/60 p-3">
            <dt className="text-slate-400 text-xs">{zone.short}</dt>
            <dd className={`text-xl font-semibold tabular-nums ${p > 0 ? TONE[zone.tone] : "text-slate-500"}`}>{pct(p)}</dd>
          </div>
        ))}
      </dl>
      {shown.length > 1 && (
        <div className="mt-4" role="img" aria-label={`Posizioni finali più frequenti: ${shown.map((x) => `${x.pos}° ${pct(x.p)}`).join(", ")}`}>
          <p className="text-slate-400 text-xs mb-2">Posizione finale nelle stagioni simulate</p>
          <div className="flex items-end gap-1 h-20">
            {shown.map((x) => (
              <div key={x.pos} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
                <div className="w-full rounded-t bg-predict/70" style={{ height: `${Math.max(4, (x.p / max) * 100)}%` }} title={`${x.pos}°: ${pct(x.p)}`} />
                <span className="text-[10px] text-slate-400 mt-1 tabular-nums">{x.pos}°</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-slate-400 text-xs mt-3">{o.note}</p>
    </section>
  );
}
