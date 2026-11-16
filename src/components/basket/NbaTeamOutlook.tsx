// Season projection of one NBA team, for its page (/basket/nba/squadre/:squadra): expected wins, conference place,
// chance of each playoff stage and the distribution of the final seed (src/lib/nbaSeason.ts).
import { Link } from "../../lib/links";
import { confName, nbaProjectionInfo, nbaStandingsPath, nbaTeamStanding, NBA_STAGES, seedZones } from "../../lib/nbaSeason";
import { pct } from "../../lib/seasonOutlook";
import { numberFormat } from "../../lib/intl";

export function NbaTeamOutlook({ teamId, name }: { teamId: number; name: string }) {
  const st = nbaTeamStanding(teamId);
  if (!st?.conf || st.w + st.l === 0) return null;
  const s = st.sim;
  const { runs, remaining } = nbaProjectionInfo();
  const z = s ? seedZones(s) : null;
  const shown = s ? s.seed.map((p, i) => ({ pos: i + 1, p })).filter((x) => x.p >= 0.01) : [];
  const max = Math.max(0, ...shown.map((x) => x.p));
  const tile = (label: string, value: string, strong = false) => (
    <div key={label} className="rounded-lg bg-slate-950/60 p-3">
      <dt className="text-slate-400 text-xs">{label}</dt>
      <dd className={`text-xl font-semibold tabular-nums ${strong ? "text-predict" : "text-white"}`}>{value}</dd>
    </div>
  );
  return (
    <section aria-labelledby="proiezione-nba" className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <h2 id="proiezione-nba" className="text-white text-lg">
        {s ? `Dove può arrivare ${name}: classifica e proiezione` : `${name} in classifica`}
      </h2>
      <p className="text-slate-300 text-sm mt-1">
        Oggi {st.pos}ª nella {confName(st.conf)} con {st.w} vinte e {st.l} perse
        {st.streak ? ` (serie: ${st.streak})` : ""}.
        {s &&
          ` Abbiamo simulato ${numberFormat("it-IT").format(runs)} volte le ${remaining} partite di stagione regolare che restano, poi play-in e playoff, con le probabilità dei nostri pronostici.`}
      </p>
      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tile("Posizione attuale", `${st.pos}ª`)}
        {tile("Ultime 10", `${st.last10[0]}-${st.last10[1]}`)}
        {s && tile("Vittorie attese", s.xw.toFixed(1).replace(".", ","))}
        {z && tile("Posizione più probabile", `${z.likely}ª`)}
        {z && tile("Primi 6 posti", pct(z.top6), z.top6 >= 0.5)}
        {z && tile("Play-in (7°-10°)", pct(z.playIn), z.playIn >= 0.5)}
        {s && NBA_STAGES.slice(1).map((x) => tile(x.short === "Playoff" ? "Playoff (play-in compreso)" : x.short === "Finale conf." ? "Finale di conference" : x.short === "Semifinale conf." ? "Semifinale di conference" : x.short, pct(s.stage[x.i]), s.stage[x.i] >= 0.5))}
      </dl>
      {shown.length > 1 && (
        <div className="mt-4" role="img" aria-label={`Posizioni finali più frequenti: ${shown.map((x) => `${x.pos}ª ${pct(x.p)}`).join(", ")}`}>
          <p className="text-slate-400 text-xs mb-2">Posizione finale nella {confName(st.conf)}, nelle stagioni simulate</p>
          <div className="flex items-end gap-1 h-20">
            {shown.map((x) => (
              <div key={x.pos} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
                <div className="w-full rounded-t bg-predict/70" style={{ height: `${Math.max(4, (x.p / max) * 100)}%` }} title={`${x.pos}ª: ${pct(x.p)}`} />
                <span className="text-[10px] text-slate-400 mt-1 tabular-nums">{x.pos}ª</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-slate-400 text-xs mt-3">
        Le prime 6 vanno direttamente ai playoff, dalla 7ª alla 10ª al play-in. Stime statistiche, non certezze.{" "}
        <Link to={nbaStandingsPath} className="text-action-text hover:text-action-text-hover">
          Classifica NBA completa
        </Link>
      </p>
    </section>
  );
}
