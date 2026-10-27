// Match report shown at the top of a finished NBA game page: final score, halves, overtime, how the game was
// decided and the points per quarter. Everything is computed from the downloaded data.
import { ClipboardList } from "lucide-react";
import type { BasketGame } from "../../lib/basket";
import { nbaTopPlayer, type NbaDetails } from "../../lib/matchDetails";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const periodLabel = (i: number) => (i < 4 ? `${i + 1}º quarto` : `${i - 3}º supplementare`);
const periodShort = (i: number) => (i < 4 ? `${i + 1}º` : `OT${i - 3}`);
const total = (a: number[]) => a.reduce((x, y) => x + y, 0);
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

interface Row {
  label: string;
  value: string;
}

export function basketReportRows(g: BasketGame): Row[] {
  const { home: hs, away: as } = g.score;
  if (hs == null || as == null) return [];
  const home = g.home.shortName ?? g.home.name;
  const away = g.away.shortName ?? g.away.name;
  const p = g.periods;
  const ot = p ? Math.max(0, p.home.length - 4) : 0;
  const rows: Row[] = [];
  const otText = ot === 1 ? " dopo un supplementare" : ot > 1 ? ` dopo ${ot} supplementari` : "";
  rows.push({ label: "Risultato finale", value: `${home} ${hs}–${as} ${away}${otText}` });

  const winner = hs > as ? home : away;
  rows.push({ label: "Esito", value: `Vittoria ${winner} di ${Math.abs(hs - as)} punti` });

  if (p && p.home.length >= 4) {
    const half = { home: total(p.home.slice(0, 2)), away: total(p.away.slice(0, 2)) };
    const second = { home: total(p.home.slice(2, 4)), away: total(p.away.slice(2, 4)) };
    rows.push({ label: "All'intervallo", value: `${half.home}–${half.away}` });
    rows.push({ label: "Secondo tempo", value: `${second.home}–${second.away}` });
    if (ot) {
      rows.push({
        label: ot === 1 ? "Supplementare" : "Supplementari",
        value: `${total(p.home.slice(4))}–${total(p.away.slice(4))}`,
      });
    }
    // comeback: behind at half time, winner at the end
    const halfGap = half.home - half.away;
    if ((halfGap < 0 && hs > as) || (halfGap > 0 && as > hs)) {
      rows.push({
        label: "Rimonta",
        value: `${winner} vince dopo essere stata sotto di ${Math.abs(halfGap)} all'intervallo`,
      });
    }
    // the period with the widest margin
    const gaps = p.home.map((v, i) => v - p.away[i]);
    const widest = gaps.reduce((best, d, i) => (Math.abs(d) > Math.abs(gaps[best]) ? i : best), 0);
    if (gaps[widest] !== 0) {
      rows.push({
        label: "Parziale più largo",
        value: `${periodLabel(widest)}: ${gaps[widest] > 0 ? home : away} ${signed(Math.abs(gaps[widest]))}`,
      });
    }
  }
  rows.push({ label: "Punti totali", value: String(hs + as) });
  return rows;
}

export function BasketBoxScore({ game, details }: { game: BasketGame; details?: NbaDetails }) {
  const rows = basketReportRows(game);
  if (rows.length === 0) return null;
  const { home: hs, away: as } = game.score;
  const top = details ? nbaTopPlayer(details, hs! > as! ? "home" : "away") : null;
  if (top) {
    const p = top.line;
    const team = top.side === "home" ? (game.home.shortName ?? game.home.name) : (game.away.shortName ?? game.away.name);
    rows.push({ label: "Migliore in campo", value: `${p.name} (${team}) · ${p.pts} punti, ${p.reb} rimbalzi, ${p.ast} assist` });
  }
  if (details?.arena) rows.push({ label: "Arena", value: details.city ? `${details.arena}, ${details.city}` : details.arena });
  const p = game.periods;
  return (
    <section className={`${card} @container`} aria-labelledby="tabellino">
      <h2 id="tabellino" className="flex items-center gap-2 text-white text-xl mb-4">
        <ClipboardList className="w-5 h-5 text-slate-300" aria-hidden="true" />
        Tabellino
      </h2>
      <dl className="grid gap-x-8 @lg:grid-cols-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4 py-2 border-b border-slate-800">
            <dt className="text-slate-400">{r.label}</dt>
            <dd className="text-white text-right tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>

      {top && (
        <p className="text-slate-400 text-xs mt-4">
          Migliore in campo: il giocatore con il Game Score più alto, un indice che pesa punti, tiri, rimbalzi, assist,
          recuperi, stoppate, palle perse e falli (nostro calcolo sulle statistiche della partita).
        </p>
      )}

      {p && p.home.length > 0 && (
        <>
          <h3 className="text-white mt-6 mb-2">Parziali</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="text-left font-normal py-2">
                    Squadra
                  </th>
                  {p.home.map((_, i) => (
                    <th key={i} scope="col" className="text-right font-normal py-2 px-2">
                      {periodShort(i)}
                    </th>
                  ))}
                  <th scope="col" className="text-right font-normal py-2 px-2">
                    Totale
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: game.home, v: p.home, s: game.score.home },
                  { t: game.away, v: p.away, s: game.score.away },
                ].map(({ t, v, s }) => (
                  <tr key={t.id} className="border-b border-slate-800 last:border-0">
                    <th scope="row" className="text-left font-normal py-2 text-white">
                      {t.name}
                    </th>
                    {v.map((x, i) => (
                      <td key={i} className="text-right px-2 text-slate-300 tabular-nums">
                        {x}
                      </td>
                    ))}
                    <td className="text-right px-2 text-white font-semibold tabular-nums">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
