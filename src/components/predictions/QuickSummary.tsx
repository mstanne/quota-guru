// "In breve": the model's numbers at the top of a match page, readable in a few seconds on a phone without scrolling.
// Same figures as the full panel further down (#pronostico); statistical estimates, never presented as betting tips.
import { useState } from "react";
import { Check, X as XIcon } from "lucide-react";
import { cardImagePath } from "../../lib/footballCore";
import { pct, pickHit, pickLabel, pickProbability, topCombo, type Prediction } from "../../lib/predictionsCore";
import { fmtPts, type BasketPrediction } from "../../lib/basketPredict";
import { ConfidenceBadge } from "./PredictionUi";

function Item({ label, value, sub, strong = false }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-400 text-xs">{label}</dt>
      <dd
        className={`tabular-nums text-base sm:text-lg leading-snug ${strong ? "text-predict font-semibold" : "text-white"}`}
      >
        {value}
        {sub && <span className="block text-xs text-slate-400 font-normal">{sub}</span>}
      </dd>
    </div>
  );
}

function Box({
  title,
  badge,
  children,
  result,
}: {
  title: string;
  badge: React.ReactNode;
  children: React.ReactNode;
  result?: boolean | null;
}) {
  return (
    <section
      aria-labelledby="in-breve"
      className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 sm:p-5 text-left"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 id="in-breve" className="text-white text-base font-medium">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {result != null && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${result ? "bg-best/15 text-best" : "bg-slate-800 text-slate-300"}`}
            >
              {result ? (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <XIcon className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Pronostico {result ? "corretto" : "non corretto"}
            </span>
          )}
          {badge}
        </div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">{children}</dl>
      <p className="mt-3 text-xs text-slate-400">
        Probabilità di un modello statistico, non quote né consigli di gioco.{" "}
        <a href="#pronostico" className="text-action-text hover:text-action-text-hover">
          Tutti i mercati e i motivi della stima
        </a>
      </p>
    </section>
  );
}

/** Football: most likely outcome, Under/Over 2,5, Goal/No goal and most likely 1X2 + U/O combination. */
export function FootballQuickSummary({
  prediction: p,
  home,
  away,
  result,
}: {
  prediction: Prediction;
  home: string;
  away: string;
  /** Final score: the box then shows the estimate published before kick-off and whether it was right. */
  result?: { home: number; away: number } | null;
}) {
  const over = p.over["2.5"];
  const combo = topCombo(p);
  return (
    <Box
      title={result ? "Il pronostico prima della partita" : "Il pronostico in breve"}
      badge={<ConfidenceBadge confidence={p.confidence} />}
      result={result ? pickHit(p, result.home, result.away) : null}
    >
      <Item label="Esito più probabile" value={pickLabel(p, home, away)} sub={pct(pickProbability(p))} strong />
      <Item
        label="Under/Over 2,5"
        value={over >= 0.5 ? "Over 2,5" : "Under 2,5"}
        sub={pct(over >= 0.5 ? over : 1 - over)}
      />
      <Item
        label="Goal / No goal"
        value={p.btts >= 0.5 ? "Goal" : "No goal"}
        sub={pct(p.btts >= 0.5 ? p.btts : 1 - p.btts)}
      />
      {combo ? (
        <Item label="Combinazione più probabile" value={combo.label} sub={pct(combo.p)} />
      ) : (
        <Item
          label="Gol attesi"
          value={`${p.xg[0].toFixed(2).replace(".", ",")} – ${p.xg[1].toFixed(2).replace(".", ",")}`}
        />
      )}
    </Box>
  );
}

/** NBA: favourite, expected points and the total-points line closest to even. */
export function BasketQuickSummary({
  prediction: p,
  home,
  away,
  result,
}: {
  prediction: BasketPrediction;
  home: string;
  away: string;
  result?: { home: number; away: number } | null;
}) {
  const fav = p.fav === 0 ? home : away;
  const even = [...p.totals].sort((a, b) => Math.abs(a[1] - 0.5) - Math.abs(b[1] - 0.5))[0];
  const hit = result ? (result.home > result.away ? 0 : 1) === p.fav : null;
  return (
    <Box
      title={result ? "Il pronostico prima della partita" : "Il pronostico in breve"}
      badge={<ConfidenceBadge confidence={p.confidence} />}
      result={hit}
    >
      <Item label="Favorita" value={fav} sub={pct(p.p[p.fav])} strong />
      <Item label="Punti attesi" value={`${fmtPts(p.pts[0])} – ${fmtPts(p.pts[1])}`} />
      <Item label="Scarto atteso" value={`${fmtPts(Math.abs(p.margin))} punti`} sub={`a favore di ${fav}`} />
      {even && (
        <Item
          label={`Totale punti ${fmtPts(even[0])}`}
          value={even[1] >= 0.5 ? "Over" : "Under"}
          sub={pct(even[1] >= 0.5 ? even[1] : 1 - even[1])}
        />
      )}
    </Box>
  );
}

/**
 * The quick summary and, on wide screens only, the match's 16:9 image (drawn at build time by scripts/lib/og-cards.mjs
 * for the canonical page of the match, `imagePage`). On phones the image is not shown, so the numbers stay above
 * the fold. If the image is missing (e.g. `npm run dev`) the summary simply takes the whole width.
 */
export function SummaryWithImage({ children, imagePage, alt }: { children: React.ReactNode; imagePage: string; alt: string }) {
  const [missing, setMissing] = useState(false);
  return (
    <div className={`mt-6 mx-auto grid gap-6 items-center ${missing ? "max-w-3xl" : "max-w-3xl lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)]"}`}>
      {children}
      {!missing && (
        <img
          src={cardImagePath(imagePage)}
          alt={alt}
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          onError={() => setMissing(true)}
          className="hidden lg:block w-full h-auto rounded-xl border border-slate-700"
        />
      )}
    </div>
  );
}
