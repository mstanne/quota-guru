// Prediction widgets (football): probability bar, compact 1X2 for match rows, full panel for match pages.
// Numbers come from the Poisson / Dixon-Coles model (scripts/predict-football.mjs). They are statistical
// estimates, shown with their reliability and never as a betting tip.
import { useEffect, useRef } from "react";
import { trackWhenVisible } from "../../lib/analytics";
import { Link } from "../../lib/links";
import { ChartColumn, Check, Info, Lightbulb, X as XIcon } from "lucide-react";
import { paths } from "../../routes";
import {
  CONFIDENCE_LABEL,
  FOOTBALL_MARKETS,
  fairOdds,
  marketCells,
  pct,
  pickHit,
  pickLabel,
  topOutcome,
  type FootballMarket,
  type Prediction,
} from "../../lib/predictionsCore";

const OUTCOMES = ["1", "X", "2"] as const;

function a11yLabel(p: Prediction, home: string, away: string) {
  return `Probabilità stimate dal modello: vittoria ${home} ${pct(p.p[0])}, pareggio ${pct(p.p[1])}, vittoria ${away} ${pct(p.p[2])}`;
}

/** Three-segment bar 1 / X / 2; the most likely outcome is highlighted. */
export function ProbabilityBar({
  prediction,
  home,
  away,
  showTeams = true,
}: {
  prediction: Prediction;
  home: string;
  away: string;
  showTeams?: boolean;
}) {
  const top = topOutcome(prediction);
  const names = [home, "Pareggio", away];
  return (
    <div role="img" aria-label={a11yLabel(prediction, home, away)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800 gap-0.5" aria-hidden="true">
        {prediction.p.map((v, i) => (
          <span
            key={i}
            className={i === top ? "bg-predict" : i === 1 ? "bg-slate-600" : "bg-slate-500"}
            style={{ width: `${v * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm" aria-hidden="true">
        {prediction.p.map((v, i) => (
          <div key={i} className={i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}>
            <span className={`block tabular-nums text-lg ${i === top ? "text-predict font-semibold" : "text-white"}`}>
              {pct(v)}
            </span>
            <span className="block text-slate-400 truncate">
              {OUTCOMES[i]}
              {showTeams && ` · ${names[i]}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact 1 X 2 percentages for list rows. */
export function PredictionMini({ prediction, home, away }: { prediction: Prediction; home: string; away: string }) {
  const top = topOutcome(prediction);
  return (
    <div className="flex gap-1" role="img" aria-label={a11yLabel(prediction, home, away)}>
      {prediction.p.map((v, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-10 sm:w-11 rounded-md px-0.5 sm:px-1 py-1 text-center leading-tight ${
            i === top ? "bg-predict/15 text-predict" : "bg-slate-800 text-slate-300"
          }`}
        >
          <span className="block text-[10px] text-slate-400">{OUTCOMES[i]}</span>
          <span className="block text-xs tabular-nums font-medium">{pct(v)}</span>
        </span>
      ))}
    </div>
  );
}

/** Compact cells for the market chosen in the quick filter (1X2, doppia chance, U/O, GG/NG, combo). */
export function MarketMini({
  prediction,
  market,
  home,
  away,
}: {
  prediction: Prediction;
  market: FootballMarket;
  home: string;
  away: string;
}) {
  if (market === "1x2") return <PredictionMini prediction={prediction} home={home} away={away} />;
  const cells = marketCells(prediction, market, home, away);
  const name = FOOTBALL_MARKETS.find((m) => m.id === market)!.label;
  const combo = market === "combo";
  const wide = combo ? "w-[4.5rem]" : market === "gg" ? "w-14" : "w-12";
  return (
    <div
      // combos are stacked on phones so the team names keep their room
      className={`flex gap-1 ${combo ? "flex-col sm:flex-row" : ""}`}
      role="img"
      aria-label={`${name}, probabilità stimate dal modello: ${cells.map((c) => `${c.spoken} ${pct(c.value)}`).join(", ")}`}
    >
      {cells.map((c) => (
        <span
          key={c.label}
          aria-hidden="true"
          className={`${wide} rounded-md px-1 ${combo ? "py-0.5 sm:py-1" : "py-1"} text-center leading-tight ${
            c.top ? "bg-predict/15 text-predict" : "bg-slate-800 text-slate-300"
          }`}
        >
          <span className="block text-[10px] text-slate-400 whitespace-nowrap">{c.label}</span>
          <span className="block text-xs tabular-nums font-medium">{pct(c.value)}</span>
        </span>
      ))}
    </div>
  );
}

/** "Perché questo pronostico": the data points behind the estimate (src/lib/predictionReasons.ts). */
export function ReasonList({ reasons, compact = false }: { reasons: string[]; compact?: boolean }) {
  if (!reasons.length) return null;
  const list = (
    <ul className={`space-y-1.5 ${compact ? "text-sm" : ""}`}>
      {reasons.map((r) => (
        <li key={r} className="flex gap-2 text-slate-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-predict" aria-hidden="true" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
  if (compact) return list;
  return (
    <div className="mt-5">
      <h3 className="flex items-center gap-2 text-white text-base mb-2">
        <Lightbulb className="w-4 h-4 text-slate-300" aria-hidden="true" />
        Perché questo pronostico
      </h3>
      {list}
    </div>
  );
}

/** "Pubblicato il 24 ottobre alle 15:00, prima del calcio d'inizio (archivio)." */
export function PublishedNote({ iso }: { iso: string }) {
  return (
    <span className="block text-slate-300 mb-1">
      Pubblicato su QuotaGuru {formatUpdatedAt(iso)}, prima dell'inizio della partita, e conservato senza modifiche
      nell'archivio dei pronostici.
    </span>
  );
}

const formatUpdatedAt = (iso: string) => {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "long" }).format(d);
  const time = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }).format(d);
  return `il ${day} alle ${time}`;
};

export function ConfidenceBadge({ confidence }: { confidence: Prediction["confidence"] }) {
  const dots = confidence === "alta" ? 3 : confidence === "media" ? 2 : 1;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
      title="Quanti dati recenti ha il modello sulle due squadre"
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= dots ? "bg-predict" : "bg-slate-600"}`} />
        ))}
      </span>
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

function Stat({ label, p, strong = false }: { label: string; p: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-800 last:border-0">
      <dt className="text-slate-400 text-sm">{label}</dt>
      <dd className="tabular-nums text-right whitespace-nowrap">
        <span className={strong ? "text-predict font-semibold" : "text-white"}>{pct(p)}</span>
        <span className="ml-2 inline-block w-10 text-slate-500 text-xs" title="Quota equa: 1 ÷ probabilità">
          {fairOdds(p)}
        </span>
      </dd>
    </div>
  );
}

export const FAIR_ODDS_GUIDE = "/guide/quota-equa-e-valore-atteso";

/**
 * "Quota equa" strip under the main probabilities: 1 ÷ probability for each outcome, i.e. the price with no
 * bookmaker margin. Informational: no operator odds, no "value" verdict, no link to any operator.
 */
export function FairOddsStrip({ items }: { items: { label: string; p: number }[] }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3">
      <dl className={`grid gap-3 text-sm ${items.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {items.map((it, i) => (
          <div
            key={it.label}
            className={items.length === 3 ? (i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right") : i === 0 ? "text-left" : "text-right"}
          >
            <dt className="text-slate-400 text-xs truncate">Quota equa {it.label}</dt>
            <dd className="text-white tabular-nums text-base">{fairOdds(it.p)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-slate-400 text-xs leading-relaxed">
        La quota equa è 1 ÷ la probabilità stimata: il prezzo dell'esito senza il margine dell'operatore. Non è una quota
        offerta da un bookmaker. Una quota di mercato più alta della quota equa indica solo che il mercato stima
        quell'esito meno probabile del modello, non che la giocata sia conveniente: il modello può sbagliare.{" "}
        <Link to={FAIR_ODDS_GUIDE} className="text-action-text hover:text-action-text-hover">
          Come si legge
        </Link>
        .
      </p>
    </div>
  );
}

/** Full prediction block for the match page. */
export function PredictionPanel({
  prediction,
  home,
  away,
  result,
  reasons = [],
  publishedAt,
}: {
  prediction: Prediction;
  home: string;
  away: string;
  /** Final score, for finished matches: the panel then shows the pre-match estimate and whether it was right. */
  result?: { home: number; away: number } | null;
  /** Data points behind the estimate (upcoming matches only). */
  reasons?: string[];
  /** When the shown prediction was published (archive): the panel then says so. */
  publishedAt?: string;
}) {
  const p = prediction;
  const finished = !!result;
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => trackWhenVisible(panelRef.current, "prediction_view", { sport: "calcio" }), []);
  const hit = finished ? pickHit(p, result.home, result.away) : null;
  const dcLabels = [`1X · ${home} o pareggio`, `12 · ${home} o ${away}`, `X2 · ${away} o pareggio`];
  // "12" (no draw) is almost always the highest double chance: highlight the best of 1X / X2 instead
  const dcTop = p.dc[0] >= p.dc[2] ? 0 : 2;

  return (
    <section ref={panelRef} className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="pronostico">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 id="pronostico" className="flex items-center gap-2 text-white text-xl">
          <ChartColumn className="w-5 h-5 text-slate-300" aria-hidden="true" />
          {finished ? "Il pronostico prima della partita" : "Pronostico del modello"}
        </h2>
        <ConfidenceBadge confidence={p.confidence} />
      </div>
      <p className="text-slate-400 text-sm mb-5">
        {publishedAt ? <PublishedNote iso={publishedAt} /> : null}
        Probabilità stimate da un modello statistico sui risultati delle ultime stagioni, con la quota equa
        corrispondente. Non sono quote di un operatore né consigli di gioco.
      </p>

      <ProbabilityBar prediction={p} home={home} away={away} />
      <FairOddsStrip
        items={[
          { label: "1", p: p.p[0] },
          { label: "X", p: p.p[1] },
          { label: "2", p: p.p[2] },
        ]}
      />

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-slate-950/50 border border-slate-800 px-4 py-3">
        <p className="text-white">
          <span className="text-slate-400">Esito più probabile: </span>
          <strong className="text-predict">{pickLabel(p, home, away)}</strong>
        </p>
        <p className="text-white tabular-nums">
          <span className="text-slate-400">Gol attesi: </span>
          {p.xg[0].toFixed(2).replace(".", ",")} – {p.xg[1].toFixed(2).replace(".", ",")}
        </p>
        {finished && (
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

      {!finished && <ReasonList reasons={reasons} />}

      <p className="mt-5 text-slate-500 text-xs">Per ogni esito: probabilità stimata e, in grigio, quota equa.</p>
      <div className="mt-2 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-white text-base mb-1">Doppia chance</h3>
          <dl>
            {p.dc.map((v, i) => (
              <Stat key={i} label={dcLabels[i]} p={v} strong={i === dcTop} />
            ))}
          </dl>
        </div>
        <div>
          <h3 className="text-white text-base mb-1">Gol</h3>
          <dl>
            <Stat label="Over 1,5" p={p.over["1.5"]} />
            <Stat label="Over 2,5" p={p.over["2.5"]} strong={p.over["2.5"] >= 0.5} />
            <Stat label="Under 2,5" p={1 - p.over["2.5"]} strong={p.over["2.5"] < 0.5} />
            <Stat label="Over 3,5" p={p.over["3.5"]} />
            <Stat label="Goal (entrambe segnano)" p={p.btts} strong={p.btts >= 0.5} />
            <Stat label="No goal" p={1 - p.btts} strong={p.btts < 0.5} />
          </dl>
        </div>
        <div>
          <h3 className="text-white text-base mb-1">Risultati più probabili</h3>
          <dl>
            {p.scores.map(([h, a, v], i) => (
              <Stat key={`${h}-${a}`} label={`${h} – ${a}`} p={v} strong={i === 0} />
            ))}
          </dl>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 text-slate-400 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
        <span>
          Il modello considera solo i gol segnati e subiti (con più peso alle partite recenti) e il fattore campo: non
          conosce infortuni, squalifiche o turnover. Come funziona:{" "}
          <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
            metodologia dei pronostici
          </Link>
          .
        </span>
      </p>
    </section>
  );
}
