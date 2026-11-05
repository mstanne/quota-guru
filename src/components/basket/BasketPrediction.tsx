// NBA prediction widgets: compact win % for game rows and the full panel for the game page.
import { useEffect, useRef } from "react";
import { trackWhenVisible } from "../../lib/analytics";
import { Link } from "../../lib/links";
import { ChartColumn, Check, Info, X as XIcon } from "lucide-react";
import { paths } from "../../routes";
import { pct } from "../../lib/predictionsCore";
import { fmtPts, type BasketPrediction } from "../../lib/basketPredict";
import { ConfidenceBadge, FairOddsStrip, PublishedNote, ReasonList } from "../predictions/PredictionUi";
import { PickCells, SlipPicksBox, type PickCell, type SlipMatch } from "../predictions/SlipPicks";

const label = (p: BasketPrediction, home: string, away: string) =>
  `Probabilità di vittoria stimate dal modello: ${home} ${pct(p.p[0])}, ${away} ${pct(p.p[1])}`;

/** Compact "1 / 2" win probabilities for list rows; with `slip` each one adds the outcome to the bet slip. */
export function BasketPredictionMini({
  prediction,
  home,
  away,
  slip,
}: {
  prediction: BasketPrediction;
  home: string;
  away: string;
  slip?: SlipMatch;
}) {
  return <BasketMarketMini prediction={prediction} market="win" home={home} away={away} slip={slip} />;
}

export type BasketMarket = "win" | "spread" | "total";

export const BASKET_MARKETS: { id: BasketMarket; label: string }[] = [
  { id: "win", label: "Vincente" },
  { id: "spread", label: "Handicap" },
  { id: "total", label: "Totale punti" },
];

/** Width of the win cells under the "1 · 2" column headers of the NBA list. */
export const NBA_COLUMN_WIDTH = "w-10 sm:w-11";

/** Row cells for the market chosen in the quick filter. Handicap and total use the model's middle line. */
export function BasketMarketMini({
  prediction: p,
  market,
  home,
  away,
  slip,
  columns = false,
}: {
  prediction: BasketPrediction;
  market: BasketMarket;
  home: string;
  away: string;
  /** Upcoming games: the cells become buttons that add the outcome to the bet slip. */
  slip?: SlipMatch;
  /** The list shows the "1 · 2" column headers: win cells drop their labels (handicap/total keep theirs: the line
   * changes from game to game). */
  columns?: boolean;
}) {
  const names = [home, away];
  const useWin = market === "win" || (market === "spread" && !p.spread.length) || (market === "total" && !p.totals.length);
  let cells: PickCell[];
  if (useWin) {
    cells = p.p.map((v, i) => ({
      key: i === 0 ? "1" : "2",
      label: i === 0 ? "1" : "2",
      value: v,
      top: i === p.fav,
      spoken: `vittoria ${names[i]}`,
      slipLabel: `Vincente – ${names[i]}`,
    }));
  } else {
    const fav = names[p.fav];
    const dog = names[1 - p.fav];
    const [line, prob] = market === "spread" ? p.spread[0] : p.totals[Math.floor(p.totals.length / 2)];
    const l = fmtPts(line);
    cells =
      market === "spread"
        ? [
            { key: `hcp-fav-${line}`, label: `${p.fav === 0 ? "1" : "2"} −${l}`, value: prob, spoken: `${fav} vince con più di ${l} punti`, slipLabel: `Handicap – ${fav} −${l}` },
            { key: `hcp-dog-${line}`, label: `${p.fav === 0 ? "2" : "1"} +${l}`, value: 1 - prob, spoken: `${dog} perde di meno o vince`, slipLabel: `Handicap – ${dog} +${l}` },
          ]
        : [
            { key: `under-${line}`, label: `U ${l}`, value: 1 - prob, spoken: `meno di ${l} punti totali`, slipLabel: `Totale punti – Under ${l}` },
            { key: `over-${line}`, label: `O ${l}`, value: prob, spoken: `più di ${l} punti totali`, slipLabel: `Totale punti – Over ${l}` },
          ];
    const top = cells[0].value >= cells[1].value ? 0 : 1;
    cells = cells.map((c, i) => ({ ...c, top: i === top }));
  }
  const name = BASKET_MARKETS.find((m) => m.id === (useWin ? "win" : market))!.label;
  const plain = columns && useWin;
  return (
    <PickCells
      cells={cells}
      match={slip}
      name={name}
      width={plain ? NBA_COLUMN_WIDTH : useWin ? "w-11" : "w-16"}
      hideLabels={plain}
      cellClassName={plain ? "py-1.5" : "py-1"}
    />
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
  reasons = [],
  publishedAt,
  slip,
}: {
  prediction: BasketPrediction;
  home: string;
  away: string;
  /** Final score, for finished games: the panel shows the pre-game estimate and whether it was right. */
  result?: { home: number; away: number } | null;
  /** Data points behind the estimate (upcoming games only). */
  reasons?: string[];
  /** When the shown prediction was published (archive). */
  publishedAt?: string;
  /** Upcoming games only: lets the reader add an outcome to the bet slip, with its probability. */
  slip?: SlipMatch;
}) {
  const p = prediction;
  const names = [home, away];
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => trackWhenVisible(panelRef.current, "prediction_view", { sport: "nba" }), []);
  const favName = names[p.fav];
  const hit = result ? (result.home > result.away ? 0 : 1) === p.fav : null;
  const tired = names.filter((_, i) => p.b2b[i]);
  return (
    <section ref={panelRef} className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="pronostico">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 id="pronostico" className="flex items-center gap-2 text-white text-xl">
          <ChartColumn className="w-5 h-5 text-slate-300" aria-hidden="true" />
          {result ? "Il pronostico prima della partita" : "Pronostico del modello"}
        </h2>
        <ConfidenceBadge confidence={p.confidence} />
      </div>
      <p className="text-slate-400 text-sm mb-5">
        {publishedAt ? <PublishedNote iso={publishedAt} /> : null}
        Probabilità stimate da un modello statistico sui punteggi delle ultime due stagioni, con la quota equa
        corrispondente. Non sono quote di un operatore né consigli di gioco.
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
      <FairOddsStrip
        items={[
          { label: `1 · ${home}`, p: p.p[0] },
          { label: `2 · ${away}`, p: p.p[1] },
        ]}
      />

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

      {!result && slip && (
        <SlipPicksBox>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {BASKET_MARKETS.filter((m) => m.id === "win" || (m.id === "spread" ? p.spread.length : p.totals.length)).map(
              (m) => (
                <div key={m.id}>
                  <div className="text-slate-400 text-xs mb-1.5">{m.label}</div>
                  <BasketMarketMini prediction={p} market={m.id} home={home} away={away} slip={slip} />
                </div>
              ),
            )}
          </div>
        </SlipPicksBox>
      )}

      {!result && <ReasonList reasons={reasons} />}

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

      {tired.length > 0 && (result || !reasons.length) && (
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
