// Quick picks: the model's probabilities as buttons that add the outcome to the bet slip ("schedina").
// Used by the match rows (football and NBA) and the prediction panel of the match page. One pick per match: tapping
// another outcome of the same match replaces it, tapping the selected one removes it.
import { Check, ListPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useBetSlip } from "../../context/BetSlipContext";
import { pct } from "../../lib/predictionsCore";
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
}: {
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
  const summary = `${name}, probabilità stimate dal modello: ${cells.map((c) => `${c.spoken} ${pct(c.value)}`).join(", ")}`;
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
            <span className="block text-[10px] text-slate-400 whitespace-nowrap">{c.label}</span>
            <span className="block text-xs tabular-nums font-medium">{pct(c.value)}</span>
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
            aria-label={`${c.spoken}, probabilità ${pct(c.value)}. ${on ? "Togli dalla" : "Aggiungi alla"} schedina`}
            title={on ? "Togli dalla schedina" : "Aggiungi alla schedina"}
            className={`relative ${width} rounded-md px-1 ${cellClassName} text-center leading-tight border transition-colors cursor-pointer ${
              on
                ? "bg-selected text-selected-foreground border-selected"
                : c.top
                  ? "bg-predict/15 text-predict border-transparent hover:border-predict/60"
                  : `${raised ? "bg-slate-900" : "bg-slate-800"} text-slate-300 border-transparent hover:border-slate-500`
            }`}
          >
            <span className={`block text-[10px] whitespace-nowrap ${on ? "text-slate-600" : "text-slate-400"}`}>
              {c.label}
            </span>
            <span className="block text-xs tabular-nums font-medium">{pct(c.value)}</span>
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

/** Framed "Aggiungi un esito alla schedina" block for the prediction panels of the match pages. */
export function SlipPicksBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 rounded-lg border border-action/40 bg-slate-950/40 px-4 py-3">
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

/** One-line hint above the lists whose probabilities can be added to the slip. */
export function SlipHint({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-slate-400 text-xs ${className}`}>
      <ListPlus className="w-4 h-4 text-action" aria-hidden="true" />
      Tocca una probabilità per aggiungerla alla schedina
    </p>
  );
}
