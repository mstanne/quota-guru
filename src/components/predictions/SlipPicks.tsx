// Quick picks: the model's probabilities as buttons that add the outcome to the bet slip ("schedina").
// Used by the match rows (football and NBA) and the prediction panel of the match page. One pick per match: tapping
// another outcome of the same match replaces it, tapping the selected one removes it.
import { Check, ListPlus, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useBetSlip } from "../../context/BetSlipContext";
import { Link } from "../../lib/links";
import { fairOdds, pct } from "../../lib/predictionsCore";
import { formatTime, romeDay, type Match } from "../../lib/footballCore";

/** The match a pick belongs to. `slipId`: "football-<id>" / "nba-<id>", the same ids as the odds blocks. */
export interface SlipMatch {
  slipId: string;
  competition: string;
  home: string;
  away: string;
  date?: string;
  time: string;
}

/** Slip match of a football fixture (ids and texts as in the odds block of the match page). */
export const footballSlip = (competition: string, m: Match): SlipMatch => ({
  slipId: `football-${m.id}`,
  competition,
  home: m.homeTeam.shortName,
  away: m.awayTeam.shortName,
  date: romeDay(m.utcDate),
  time: formatTime(m.utcDate),
});

export interface PickCell {
  key: string;
  label: string;
  value: number;
  top?: boolean;
  spoken: string;
  slipLabel: string;
}

/** Selection state and toggle for the picks of one match. `open`: open the slip after adding (match page only). */
export function useSlipPicks(match: SlipMatch | undefined, { open = false }: { open?: boolean } = {}) {
  const { selections, addSelection, removeSelection } = useBetSlip();
  const current = match ? selections.find((s) => s.matchId === match.slipId) : undefined;
  const idOf = (key: string) => `${match?.slipId}-pred-${key}`;
  return {
    picked: (key: string) => !!current && current.id === idOf(key),
    toggle: (cell: Pick<PickCell, "key" | "slipLabel" | "value">) => {
      if (!match) return;
      const id = idOf(cell.key);
      if (current?.id === id) return removeSelection(id);
      addSelection(
        {
          id,
          matchId: match.slipId,
          competition: match.competition,
          homeTeam: match.home,
          awayTeam: match.away,
          date: match.date,
          time: match.time,
          betType: cell.key,
          betTypeLabel: cell.slipLabel,
          probability: cell.value,
        },
        { open },
      );
    },
  };
}

/**
 * Compact probability cells of a list row. With `match` they are buttons that add the outcome to the slip;
 * without it (finished matches, previews) they are plain text, as before.
 */
export function PickCells({
  cells,
  match,
  name,
  width = "w-11",
  className = "",
  cellClassName = "py-1",
  raised = false,
  hideLabels = false,
  inline = false,
}: {
  /** Label and percentage side by side on one line (wider cells: combos, "1+Under 41%"). */
  inline?: boolean;
  /** The list has column headers (1 · X · 2…): cells show only the percentage, a bit larger. */
  hideLabels?: boolean;
  /** Cells on a slate-800 card (instead of the page background): darker neutral cells so they stay visible. */
  raised?: boolean;
  cells: PickCell[];
  match?: SlipMatch;
  /** Market name for screen readers, e.g. "1X2". */
  name: string;
  width?: string;
  className?: string;
  cellClassName?: string;
}) {
  const { picked, toggle } = useSlipPicks(match);
  const summary = `${name}, probabilità stimate dal modello e quota equa: ${cells.map((c) => `${c.spoken} ${pct(c.value)}, quota equa ${fairOdds(c.value)}`).join("; ")}`;
  if (!match)
    return (
      <div className={`flex gap-1 ${className}`} role="img" aria-label={summary}>
        {cells.map((c) => (
          <span
            key={c.key}
            aria-hidden="true"
            className={`${width} rounded-md px-1 ${cellClassName} text-center leading-tight ${
              c.top ? "bg-predict/15 text-predict" : `${raised ? "bg-slate-900" : "bg-slate-800"} text-slate-300`
            }`}
          >
            <CellText cell={c} hideLabels={hideLabels} inline={inline} />
          </span>
        ))}
      </div>
    );
  return (
    <div
      className={`flex gap-1 ${className}`}
      role="group"
      aria-label={`${name}: tocca un esito per aggiungerlo alla schedina`}
    >
      {cells.map((c) => {
        const on = picked(c.key);
        return (
          <button
            key={c.key}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(c);
            }}
            aria-pressed={on}
            aria-label={`${c.spoken}, probabilità ${pct(c.value)}, quota equa ${fairOdds(c.value)}. ${on ? "Togli dalla" : "Aggiungi alla"} schedina`}
            title={on ? "Togli dalla schedina" : "Aggiungi alla schedina"}
            className={`relative ${width} rounded-md px-1 ${cellClassName} text-center leading-tight border transition-colors cursor-pointer ${
              on
                ? "bg-selected text-selected-foreground border-selected"
                : c.top
                  ? "bg-predict/15 text-predict border-transparent hover:border-predict/60"
                  : `${raised ? "bg-slate-900" : "bg-slate-800"} text-slate-300 border-transparent hover:border-slate-500`
            }`}
          >
            <CellText cell={c} hideLabels={hideLabels} inline={inline} on={on} />
            {on && (
              <Check
                className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-action text-action-foreground p-0.5"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Label, percentage and fair odds (1 ÷ probability, smaller and fainter) of one cell: stacked (default), without the
 * label (`hideLabels`) or on one line (`inline`).
 */
function CellText({
  cell,
  hideLabels,
  inline,
  on = false,
}: {
  cell: PickCell;
  hideLabels: boolean;
  inline: boolean;
  on?: boolean;
}) {
  const label = on ? "text-slate-600" : "text-slate-400";
  if (inline)
    return (
      <span className="flex items-baseline justify-between gap-1.5 px-0.5">
        <span className={`text-[11px] whitespace-nowrap ${label}`}>{cell.label}</span>
        <span className="tabular-nums font-medium text-sm">
          {pct(cell.value)}
          <span className="ml-1 text-[10px] font-normal opacity-70">{fairOdds(cell.value)}</span>
        </span>
      </span>
    );
  return (
    <>
      {!hideLabels && <span className={`block text-[10px] whitespace-nowrap ${label}`}>{cell.label}</span>}
      <span className={`block tabular-nums font-medium ${hideLabels ? "text-sm" : "text-xs"}`}>{pct(cell.value)}</span>
      <span className="block tabular-nums text-[10px] opacity-70" title="Quota equa: 1 ÷ probabilità">
        {fairOdds(cell.value)}
      </span>
    </>
  );
}

/** Framed "Aggiungi un esito alla schedina" block for the prediction panels of the match pages. */
export function SlipPicksBox({ children }: { children: ReactNode }) {
  return (
    <div id="schedina" className="mt-5 scroll-mt-28 rounded-lg border border-action/40 bg-slate-950/40 px-4 py-3">
      <h3 className="flex items-center gap-2 text-white text-base">
        <ListPlus className="w-4 h-4 text-action" aria-hidden="true" />
        Aggiungi un esito alla schedina
      </h3>
      <p className="mt-1 text-slate-400 text-xs leading-relaxed">
        La schedina calcola la probabilità stimata che si verifichino tutti gli esiti scelti. Un esito per partita.
      </p>
      {children}
    </div>
  );
}

const TIP_KEY = "qg-suggerimento-schedina";
const TIP_MS = 12_000;

/**
 * First-use tip of the lists whose probabilities can be added to the slip: a small bar at the bottom of the screen
 * (fixed, so it never moves the page), shown until the reader adds a first pick or closes it, then never again
 * (remembered in this browser), or after 12 seconds on screen. Not in the pre-rendered HTML: it appears after
 * loading, if not dismissed yet.
 */
export function SlipHint() {
  const { selections } = useBetSlip();
  const [show, setShow] = useState(false);
  const done = () => {
    setShow(false);
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {
      /* storage unavailable: the tip simply comes back next time */
    }
  };
  useEffect(() => {
    try {
      if (!localStorage.getItem(TIP_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  // seen long enough: it goes away by itself (and does not come back)
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(done, TIP_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);
  // the first pick is the sign it has been understood
  useEffect(() => {
    if (selections.length && show) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections.length]);
  if (!show || selections.length) return null;
  return (
    <div
      role="note"
      className="fixed z-40 bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm sm:max-w-xl flex items-center gap-2 rounded-lg border border-action/50 bg-slate-900/95 backdrop-blur pl-3 pr-1 py-1 shadow-xl shadow-black/40"
    >
      <ListPlus className="w-4 h-4 text-action shrink-0" aria-hidden="true" />
      <p className="flex-1 text-white text-xs sm:text-sm leading-snug">
        Tocca una percentuale per metterla in <strong className="font-medium">schedina</strong>
        <span className="hidden sm:inline">: calcola la probabilità che si verifichino tutti gli esiti</span>.
      </p>
      <button
        type="button"
        onClick={done}
        aria-label="Chiudi il suggerimento"
        className="inline-flex items-center justify-center size-9 shrink-0 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** One line under the lists: what the small number under each percentage is. */
export function FairOddsLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-slate-500 text-xs ${className}`}>
      Sotto ogni percentuale, più piccola, la quota equa: 1 ÷ la probabilità stimata, cioè il prezzo dell'esito senza il
      margine dell'operatore. Non è una quota offerta da un bookmaker.{" "}
      <Link to="/guide/quota-equa-e-valore-atteso" className="text-slate-400 underline hover:text-white">
        Cos'è la quota equa
      </Link>
    </p>
  );
}
