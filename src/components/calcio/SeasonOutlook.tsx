import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { CUP_STAGES, leagueOutlook, leagueXg, pct, strengthOf, type TeamOutlook, type Zone } from "../../lib/seasonOutlook";
import { strengthRankingPath } from "../../lib/strengthRanking";
import { footballTrackRecord } from "../../lib/trackRecordFootball";
// same path as TRACK_RECORD_PATH (src/lib/trackRecordMeta.ts), not imported to keep the NBA track record out of this chunk
const TRACK_RECORD_PATH = "/bilancio-pronostici";
import type { Competition } from "../../lib/footballCore";
import { TeamBadge } from "./MatchRow";
import { TeamName } from "../teams/TeamLink";
import { numberFormat } from "../../lib/intl";

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
  const runs = numberFormat("it-IT").format(o.runs);
  return (
    <section aria-labelledby="proiezione">
      <h2 id="proiezione" className="text-white text-xl">
        {o.cup ? `Proiezione ${competition.name}: fase campionato e chi vince la coppa` : `Proiezione di fine stagione ${competition.name}`}
      </h2>
      {o.cup ? (
        <p className="text-slate-300 mt-2 max-w-3xl">
          Abbiamo simulato {runs} volte le {o.remaining} partite che restano della fase campionato e poi playoff, ottavi,
          quarti, semifinali (andata e ritorno, con supplementari e rigori) e finale, con le stesse probabilità dei nostri
          pronostici. Per ogni squadra: i punti attesi a fine fase campionato, la zona della classifica e fin dove arriva.{" "}
          {o.note}
        </p>
      ) : (
        <p className="text-slate-300 mt-2 max-w-3xl">
          Abbiamo simulato {runs} volte le {o.remaining} partite che restano, con le stesse probabilità dei nostri
          pronostici. Per ogni squadra: i punti attesi a fine stagione e in quante stagioni simulate chiude in ogni zona
          della classifica. {o.note}
        </p>
      )}
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className={`w-full text-sm ${o.cup ? "min-w-[900px]" : "min-w-[640px]"}`}>
          <caption className="sr-only">{o.cup ? `Proiezione ${competition.name}` : `Proiezione di fine stagione ${competition.name}`}</caption>
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
              {o.cup &&
                CUP_STAGES.slice(1).map((st) => (
                  <th key={st.i} scope="col" className="text-right font-normal px-2 whitespace-nowrap" title={st.long}>
                    {st.short}
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
                {o.cup && CUP_STAGES.slice(1).map((st) => <Cell key={st.i} p={t.stage?.[st.i] ?? 0} tone="top" />)}
                <td className="text-right px-4 text-slate-300 tabular-nums">{t.likely}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-2 max-w-3xl">
        {o.cup
          ? "Stime statistiche aggiornate a ogni turno, non certezze: a parità di punti contano differenza reti e gol fatti (gli altri criteri UEFA sono decisi a sorte); gli accoppiamenti sono quelli del tabellone per posizione, con un sorteggio dove il regolamento lo prevede, e quarti e semifinali seguono un tabellone semplificato."
          : "Stime statistiche aggiornate a ogni turno, non certezze: a parità di punti contano differenza reti e gol fatti (non gli scontri diretti); playoff, playout e spareggi non sono simulati."}{" "}
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
  const strength = strengthOf(teamId);
  const run = leagueXg(slug)?.team(teamId);
  // the positions seen in at least 1% of the simulated seasons, for the distribution bar
  const shown = t.pos.map((p, i) => ({ pos: i + 1, p })).filter((x) => x.p >= 0.01);
  const max = Math.max(...shown.map((x) => x.p));
  return (
    <section aria-labelledby={`proiezione-squadra-${slug}`} className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <h2 id={`proiezione-squadra-${slug}`} className="text-white text-lg">
        {o.cup ? `Fin dove può arrivare ${name} in ${competitionName}` : `Dove può chiudere ${name}: proiezione ${competitionName}`}
      </h2>
      <p className="text-slate-300 text-sm mt-1">
        {o.cup
          ? `${numberFormat("it-IT").format(o.runs)} simulazioni delle ${o.remaining} partite che restano della fase campionato e dei turni a eliminazione diretta, con le probabilità dei nostri pronostici.`
          : `${numberFormat("it-IT").format(o.runs)} simulazioni delle ${o.remaining} partite di campionato che restano, con le probabilità dei nostri pronostici.`}
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
        {!o.cup && strength && (
          <div className="rounded-lg bg-slate-950/60 p-3">
            <dt className="text-slate-400 text-xs">Ranking di forza</dt>
            <dd className="text-white text-xl font-semibold tabular-nums">
              <Link to={strengthRankingPath} className="hover:underline underline-offset-4">
                {strength.rank}ª
              </Link>{" "}
              <span className="text-slate-400 text-xs font-normal">({strength.leagueRank}ª in {competitionName})</span>
            </dd>
          </div>
        )}
        {!o.cup && run?.schedRank && (
          <div className="rounded-lg bg-slate-950/60 p-3">
            <dt className="text-slate-400 text-xs">Difficoltà del calendario che resta</dt>
            <dd className="text-white text-xl font-semibold tabular-nums">
              {run.schedRank}ª <span className="text-slate-400 text-xs font-normal">su {run.of} (1ª = più duro)</span>
            </dd>
          </div>
        )}
        {!o.cup && run?.xg && (
          <div className="rounded-lg bg-slate-950/60 p-3">
            <dt className="text-slate-400 text-xs">Punti attesi dagli xG</dt>
            <dd className="text-white text-xl font-semibold tabular-nums">
              {fmt(run.xg[0])} <span className="text-slate-400 text-xs font-normal">(ne ha fatti {run.xg[1]})</span>
            </dd>
          </div>
        )}
        {o.cup &&
          CUP_STAGES.map((st) => (
            <div key={st.i} className="rounded-lg bg-slate-950/60 p-3">
              <dt className="text-slate-400 text-xs">{st.short === "Vince" ? "Vince la coppa" : st.short}</dt>
              <dd className={`text-xl font-semibold tabular-nums ${(t.stage?.[st.i] ?? 0) > 0 ? TONE.top : "text-slate-500"}`}>{pct(t.stage?.[st.i] ?? 0)}</dd>
            </div>
          ))}
      </dl>
      {shown.length > 1 && (
        <div className="mt-4" role="img" aria-label={`Posizioni finali più frequenti: ${shown.map((x) => `${x.pos}° ${pct(x.p)}`).join(", ")}`}>
          <p className="text-slate-400 text-xs mb-2">{o.cup ? "Posizione finale nella fase campionato, nelle simulazioni" : "Posizione finale nelle stagioni simulate"}</p>
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

/**
 * Expected points from the xG of the matches played and difficulty of the matches still to play (standings page):
 * who has collected more or less than the chances it created and conceded, and whose run-in is harder.
 */
export function XgPointsTable({ competition }: { competition: Competition }) {
  const x = leagueXg(competition.slug);
  if (!x || competition.standings.length !== 1) return null;
  const rows = competition.standings[0].table
    .map((r) => ({ r, t: x.team(r.team.id), s: strengthOf(r.team.id) }))
    .filter((v): v is typeof v & { t: NonNullable<typeof v.t> } => !!v.t?.xg)
    .sort((a, b) => b.t.xg![0] - a.t.xg![0]);
  if (rows.length < 4) return null;
  const diff = (v: number) => {
    const r = Math.round(v * 10) / 10;
    return r === 0 ? "0,0" : `${r > 0 ? "+" : ""}${fmt(r)}`;
  };
  return (
    <section aria-labelledby="punti-attesi">
      <h2 id="punti-attesi" className="text-white text-xl">
        Classifica dei punti attesi (xG) e calendario {competition.name}
      </h2>
      <p className="text-slate-300 mt-2 max-w-3xl">
        Quanti punti avrebbe ogni squadra se le occasioni create e concesse (gli expected goals) si fossero trasformate in
        gol con la frequenza abituale. Una differenza positiva vuol dire più punti di quanti ne valessero le occasioni:
        bravura sotto porta, un portiere in giornata o un po' di fortuna. Accanto, la difficoltà delle partite che restano
        secondo il nostro modello e la forza della squadra.
      </p>
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <caption className="sr-only">Punti attesi da xG e difficoltà del calendario {competition.name}</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3">Squadra</th>
              <th scope="col" className="text-right font-normal px-2" title="Punti nelle partite con gli xG">Punti</th>
              <th scope="col" className="text-right font-normal px-2" title="Punti attesi dagli xG delle partite giocate">Punti attesi (xG)</th>
              <th scope="col" className="text-right font-normal px-2" title="Punti reali meno punti attesi">Differenza</th>
              <th scope="col" className="text-right font-normal px-2 whitespace-nowrap" title="Difficoltà delle partite che restano: 1ª = la più difficile">Calendario (1ª = più duro)</th>
              <th scope="col" className="text-right font-normal px-4 whitespace-nowrap" title="Differenza reti attesa a partita contro una squadra media, in campo neutro (modello)">Forza</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, t, s }) => {
              const [xpts, pts] = t.xg!;
              const d = pts - xpts;
              return (
                <tr key={r.team.id} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="text-left font-normal px-4 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <TeamBadge team={r.team} />
                      <TeamName id={r.team.id} name={r.team.shortName} />
                    </span>
                  </th>
                  <td className="text-right px-2 text-slate-300 tabular-nums">{pts}</td>
                  <td className="text-right px-2 text-white font-semibold tabular-nums">{fmt(xpts)}</td>
                  <td className={`text-right px-2 tabular-nums ${d >= 2 ? "text-predict" : d <= -2 ? "text-rose-300" : "text-slate-300"}`}>{diff(d)}</td>
                  <td className="text-right px-2 text-slate-300 tabular-nums whitespace-nowrap">
                    {t.schedRank ? `${t.schedRank}ª` : "–"}
                  </td>
                  <td className="text-right px-4 text-slate-300 tabular-nums">{s ? diff(s.gd) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-2 max-w-3xl">
        Calendario: i punti a partita che una squadra media del campionato si aspetterebbe contro gli stessi avversari,
        negli stessi campi; meno punti = calendario più difficile. Forza: differenza reti attesa a partita contro una
        squadra media, in campo neutro, dalle valutazioni di attacco e difesa del modello.{" "}
        <Link to={strengthRankingPath} className="text-action-text hover:text-action-text-hover">
          Ranking delle squadre
        </Link>
      </p>
    </section>
  );
}

/** How the published predictions of one competition went (site track record, src/lib/trackRecordFootball.ts). */
export function CompetitionTrack({ competition }: { competition: Competition }) {
  const t = footballTrackRecord();
  const c = t.byWhere?.find((w) => w.where === competition.name);
  if (!c || c.n < 10) return null;
  const share = Math.round((c.hits / c.n) * 100);
  return (
    <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-300 text-sm max-w-3xl">
      <span className="text-white font-semibold">Il modello in {competition.name}:</span>{" "}
      {`su ${c.n} partite (${
        t.source === "archivio" ? "pronostici pubblicati prima del calcio d'inizio" : "pronostici ricalcolati con i dati di prima del calcio d'inizio"
      }) l'esito indicato come più probabile si è verificato ${c.hits} volte, il ${share}%.`}{" "}
      <Link to={TRACK_RECORD_PATH} className="text-action-text hover:text-action-text-hover">
        Bilancio completo dei pronostici
      </Link>
    </p>
  );
}
