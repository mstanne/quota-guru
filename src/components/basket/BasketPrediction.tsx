// NBA prediction widgets: compact win % for game rows and the full panel for the game page.
import { Link } from "react-router";
import { ChartColumn, Check, Info, X as XIcon } from "lucide-react";
import { paths } from "../../routes";
import { pct } from "../../lib/predictionsCore";
import { fmtPts, type BasketPrediction } from "../../lib/basketPredict";
import { ConfidenceBadge } from "../predictions/PredictionUi";

const label = (p: BasketPrediction, home: string, away: string) =>
  `Probabilità di vittoria stimate dal modello: ${home} ${pct(p.p[0])}, ${away} ${pct(p.p[1])}`;

/** Compact "1 / 2" win probabilities for list rows. */
export function BasketPredictionMini({ prediction, home, away }: { prediction: BasketPrediction; home: string; away: string }) {
  return (
    <div className="flex gap-1" role="img" aria-label={label(prediction, home, away)}>
      {prediction.p.map((v, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-11 rounded-md px-1 py-1 text-center leading-tight ${
            i === prediction.fav ? "bg-predict/15 text-predict" : "bg-slate-800 text-slate-300"
          }`}
        >
          <span className="block text-[10px] text-slate-400">{i === 0 ? "1" : "2"}</span>
          <span className="block text-xs tabular-nums font-medium">{pct(v)}</span>
        </span>
      ))}
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-800 last:border-0">
      <dt className="text-slate-400 text-sm">{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-predict font-semibold" : "text-white"}`}>{value}</dd>
    </div>
  );
}

export function BasketPredictionPanel({
  prediction,
  home,
  away,
  result,
}: {
  prediction: BasketPrediction;
  home: string;
  away: string;
  /** Final score, for finished games: the panel shows the pre-game estimate and whether it was right. */
  result?: { home: number; away: number } | null;
}) {
  const p = prediction;
  const names = [home, away];
  const favName = names[p.fav];
  const hit = result ? (result.home > result.away ? 0 : 1) === p.fav : null;
  const tired = names.filter((_, i) => p.b2b[i]);
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="pronostico">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 id="pronostico" className="flex items-center gap-2 text-white text-xl">
          <ChartColumn className="w-5 h-5 text-slate-300" aria-hidden="true" />
          {result ? "Il pronostico prima della partita" : "Pronostico del modello"}
        </h2>
        <ConfidenceBadge confidence={p.confidence} />
      </div>
      <p className="text-slate-400 text-sm mb-5">
        Probabilità stimate da un modello statistico sui punteggi delle ultime due stagioni. Non sono quote né consigli
        di gioco.
      </p>

      <div role="img" aria-label={label(p, home, away)}>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800 gap-0.5" aria-hidden="true">
          {p.p.map((v, i) => (
            <span key={i} className={i === p.fav ? "bg-predict" : "bg-slate-500"} style={{ width: `${v * 100}%` }} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3" aria-hidden="true">
          {names.map((n, i) => (
            <div key={i} className={i === 0 ? "text-left" : "text-right"}>
              <span className={`block tabular-nums text-2xl ${i === p.fav ? "text-predict font-semibold" : "text-white"}`}>
                {pct(p.p[i])}
              </span>
              <span className="block text-slate-400 text-sm truncate">
                {i === 0 ? "1" : "2"} · {n}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-slate-950/50 border border-slate-800 px-4 py-3">
        <p className="text-white tabular-nums">
          <span className="text-slate-400">Punteggio atteso: </span>
          {Math.round(p.pts[0])} – {Math.round(p.pts[1])}
        </p>
        <p className="text-white">
          <span className="text-slate-400">Favorito: </span>
          <strong className="text-predict">{favName}</strong>
          <span className="text-slate-400 tabular-nums"> di {fmtPts(Math.abs(p.margin))} punti</span>
        </p>
        {result && (
          <p
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm ${
              hit ? "bg-best text-best-foreground" : "bg-slate-700 text-white"
            }`}
          >
            {hit ? <Check className="w-4 h-4" aria-hidden="true" /> : <XIcon className="w-4 h-4" aria-hidden="true" />}
            {hit ? "Pronostico corretto" : "Pronostico sbagliato"} ({result.home}-{result.away})
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-white text-base mb-1">Scarto</h3>
          <dl>
            {p.spread.map(([line, v]) => (
              <Row key={line} label={`${favName} vince di oltre ${fmtPts(line)}`} value={pct(v)} />
            ))}
          </dl>
        </div>
        <div>
          <h3 className="text-white text-base mb-1">Punti totali</h3>
          <dl>
            {p.totals.map(([line, v]) => (
              <Row key={line} label={`Più di ${fmtPts(line)}`} value={pct(v)} strong={v >= 0.5 && v < 0.55} />
            ))}
          </dl>
          <p className="mt-1 text-slate-400 text-xs tabular-nums">Totale atteso: {fmtPts(p.total)} punti</p>
        </div>
        <div>
          <h3 className="text-white text-base mb-1">Vittoria larga</h3>
          <dl>
            <Row label={`${home} di 10+ punti`} value={pct(p.big[0])} />
            <Row label={`${away} di 10+ punti`} value={pct(p.big[1])} />
            <Row label="Partita entro 9 punti" value={pct(1 - p.big[0] - p.big[1])} />
          </dl>
        </div>
      </div>

      {tired.length > 0 && (
        <p className="mt-4 text-slate-300 text-sm">
          {tired.join(" e ")} {tired.length > 1 ? "giocano" : "gioca"} la seconda partita in due giorni: il modello ne
          tiene conto.
        </p>
      )}

      <p className="mt-5 flex items-start gap-2 text-slate-400 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Il modello considera punti segnati e subiti (con più peso alle partite recenti), fattore campo e partite in due
          giorni consecutivi: non conosce infortuni, assenze e turni di riposo. Come funziona:{" "}
          <Link to={`${paths.metodologia}#pronostici-basket`} className="text-action-text hover:text-action-text-hover">
            metodologia dei pronostici
          </Link>
          .
        </span>
      </p>
    </section>
  );
}
