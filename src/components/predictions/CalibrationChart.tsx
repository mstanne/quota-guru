// Calibration (reliability) chart of the archived predictions: for each 10% band of predicted probability,
// how often the outcome actually happened. Points on the diagonal = the stated probabilities are honest.
// Shown on the Metodologia page only once the archive is long enough (src/lib/trackRecord.ts).
import { useState } from "react";
import { archivedCalibration, type CalibrationBin } from "../../lib/trackRecord";
import { formatShortDate } from "../../lib/footballCore";

const W = 320;
const H = 320;
const PAD = { l: 44, r: 12, t: 12, b: 40 };
const x = (v: number) => PAD.l + v * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b);
const pct = (v: number) => `${Math.round(v * 100)}%`;

function Chart({ bins, label }: { bins: CalibrationBin[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxN = Math.max(...bins.map((b) => b.n));
  const r = (n: number) => 4 + 6 * Math.sqrt(n / maxN);
  const h = hover !== null ? bins[hover] : null;
  return (
    <figure className="relative max-w-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
        {/* grid and axes */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-slate-800" />
            <line x1={x(t)} x2={x(t)} y1={y(0)} y2={y(1)} stroke="currentColor" className="text-slate-800" />
            <text x={x(t)} y={H - PAD.b + 16} textAnchor="middle" className="fill-slate-400 text-[11px]">
              {pct(t)}
            </text>
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
              {pct(t)}
            </text>
          </g>
        ))}
        <text x={(x(0) + x(1)) / 2} y={H - 4} textAnchor="middle" className="fill-slate-400 text-[11px]">
          Probabilità stimata
        </text>
        <text
          x={12}
          y={(y(0) + y(1)) / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${(y(0) + y(1)) / 2})`}
          className="fill-slate-400 text-[11px]"
        >
          Frequenza osservata
        </text>
        {/* perfect calibration */}
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="currentColor" strokeDasharray="4 4" className="text-slate-500" />
        {bins.map((b, i) => (
          <g key={b.lo} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {/* larger invisible hit target */}
            <circle cx={x(b.pred)} cy={y(b.obs)} r={14} fill="transparent" />
            <circle
              cx={x(b.pred)}
              cy={y(b.obs)}
              r={r(b.n)}
              className="fill-predict"
              stroke="var(--color-slate-900)"
              strokeWidth={2}
              opacity={hover === null || hover === i ? 1 : 0.5}
            />
          </g>
        ))}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white shadow"
          style={{ left: `${(x(h.pred) / W) * 100}%`, top: `${(y(h.obs) / H) * 100}%`, transform: "translate(-50%, -130%)" }}
        >
          Stimato {pct(h.pred)} · successo {pct(h.obs)} · {h.n} esiti
        </div>
      )}
    </figure>
  );
}

function Table({ bins }: { bins: CalibrationBin[] }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-slate-300">Vedi i numeri</summary>
      <table className="mt-2 w-full max-w-sm text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal py-1">Fascia</th>
            <th scope="col" className="text-right font-normal py-1">Stimato</th>
            <th scope="col" className="text-right font-normal py-1">Successo</th>
            <th scope="col" className="text-right font-normal py-1">Esiti</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((b) => (
            <tr key={b.lo} className="border-b border-slate-800 last:border-0 tabular-nums">
              <td className="py-1 text-slate-300">
                {pct(b.lo)}–{pct(b.hi)}
              </td>
              <td className="py-1 text-right text-white">{pct(b.pred)}</td>
              <td className="py-1 text-right text-white">{pct(b.obs)}</td>
              <td className="py-1 text-right text-slate-400">{b.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** One block per sport with enough archived predictions; nothing at all before that. */
export function CalibrationSection() {
  const sports = (["calcio", "nba"] as const)
    .map((s) => ({ s, c: archivedCalibration(s) }))
    .filter((x): x is { s: "calcio" | "nba"; c: NonNullable<ReturnType<typeof archivedCalibration>> } => !!x.c);
  if (!sports.length) return null;
  return (
    <>
      <h2 id="calibrazione">Le probabilità sono affidabili?</h2>
      <p>
        Un modello onesto non deve solo indovinare: quando dice 60%, l'esito dovrebbe verificarsi circa 6 volte su 10.
        Nei grafici ogni punto raccoglie gli esiti con una probabilità stimata simile (per esempio tra il 50% e il 60%):
        più è vicino alla diagonale tratteggiata, più le percentuali pubblicate sono affidabili. I dati vengono
        dall'archivio dei pronostici pubblicati prima di ogni partita; i punti più grandi raccolgono più esiti.
      </p>
      <div className="not-prose grid gap-8 sm:grid-cols-2 my-6">
        {sports.map(({ s, c }) => (
          <div key={s}>
            <h3 className="text-white text-base mb-1">{s === "calcio" ? "Calcio (1, X, 2)" : "NBA (vittoria)"}</h3>
            <p className="text-slate-400 text-xs mb-2">
              {c.matches} partite{c.since ? ` dal ${formatShortDate(c.since)}` : ""}
            </p>
            <Chart
              bins={c.bins}
              label={`Calibrazione dei pronostici ${s === "calcio" ? "del calcio" : "NBA"}: ${c.bins
                .map((b) => `stimato ${pct(b.pred)}, verificato ${pct(b.obs)}`)
                .join("; ")}`}
            />
            <Table bins={c.bins} />
          </div>
        ))}
      </div>
    </>
  );
}
