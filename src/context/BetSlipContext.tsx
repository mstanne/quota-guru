import { createContext, useContext, useState, type ReactNode } from "react";
import type { OddValue } from "../lib/odds";
import { currentPage, track } from "../lib/analytics";

export interface BookmakerOdds {
  /** References OperatorData.id (src/data/operators.ts). */
  operatorId: string;
  odds: OddValue;
}

/**
 * A single pick added to the bet slip ("schedina"): from an operator's odds (OddsComparison) or from the model's
 * prediction (PredictionSlipPicks). Odds fields are missing for prediction picks; `probability` for odds picks.
 */
export interface BetSelection {
  /** Unique id of the pick. Generated from matchId + betType when not provided. */
  id?: string;
  matchId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date?: string;
  time: string;
  betType: string;
  betTypeLabel: string;
  /** OperatorData.id of the operator chosen for this pick. */
  selectedBookmaker?: string;
  selectedOdds?: OddValue;
  /** Odds of the same pick on every bookmaker, used for the comparison table. */
  allBookmakers?: BookmakerOdds[];
  /** Probability of the pick estimated by the model (0–1), when it was added from a prediction. */
  probability?: number;
}

interface BetSlipContextValue {
  selections: BetSelection[];
  isOpen: boolean;
  /** Adds a pick (replacing the previous pick of the same match). `open: false` keeps the slip closed: used by the
   *  quick picks in the lists, where opening the panel at every tap would cover the page. */
  addSelection: (selection: BetSelection, options?: { open?: boolean }) => void;
  removeSelection: (id: string) => void;
  clearAll: () => void;
  openBetSlip: () => void;
  closeBetSlip: () => void;
  stake: number;
  setStake: (stake: number) => void;
  /** Last change, for the screen-reader announcement and the floating button's highlight (count goes up). */
  lastChange: { message: string; n: number } | null;
}

/** Width from which the open slip sits beside the page instead of over it (Tailwind `xl`). */
export const SLIP_DOCK_QUERY = "(min-width: 1280px)";
export const slipDocked = () => typeof window !== "undefined" && !!window.matchMedia?.(SLIP_DOCK_QUERY).matches;

const BetSlipContext = createContext<BetSlipContextValue | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState(50);
  const [lastChange, setLastChange] = useState<{ message: string; n: number } | null>(null);
  const announce = (message: string) => setLastChange((prev) => ({ message, n: (prev?.n ?? 0) + 1 }));

  // Only one pick per match: a new pick replaces the previous one for the same match.
  const addSelection = (selection: BetSelection, { open = true }: { open?: boolean } = {}) => {
    const withId = { ...selection, id: selection.id ?? `${selection.matchId}-${selection.betType}` };
    setSelections((prev) => [...prev.filter((s) => s.matchId !== withId.matchId), withId]);
    // wide screens: the slip is a column beside the page (see BetSlip), so it opens with the first pick too
    if (open || slipDocked()) setIsOpen(true);
    announce(`Aggiunto alla schedina: ${withId.homeTeam} – ${withId.awayTeam}, ${withId.betTypeLabel}`);
    track("bet_slip_add", {
      operator: withId.selectedBookmaker ?? "pronostico",
      market: withId.betType,
      page: currentPage(),
    });
  };

  const removeSelection = (id: string) => {
    const gone = selections.find((s) => s.id === id);
    setSelections((prev) => prev.filter((s) => s.id !== id));
    if (gone) announce(`Tolto dalla schedina: ${gone.homeTeam} – ${gone.awayTeam}`);
  };

  const clearAll = () => {
    setSelections([]);
    announce("Schedina svuotata");
  };
  const openBetSlip = () => setIsOpen(true);
  const closeBetSlip = () => setIsOpen(false);

  return (
    <BetSlipContext.Provider
      value={{
        selections,
        isOpen,
        addSelection,
        removeSelection,
        clearAll,
        openBetSlip,
        closeBetSlip,
        stake,
        setStake,
        lastChange,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (context === undefined) throw new Error("useBetSlip must be used within a BetSlipProvider");
  return context;
}
