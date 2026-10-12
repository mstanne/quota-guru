import { createContext, useContext, useState, type ReactNode } from "react";

export interface BookmakerOdds {
  name: string;
  odds: number;
}

/** A single pick added to the bet slip ("schedina"). */
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
  selectedBookmaker: string;
  selectedOdds: number;
  /** Odds of the same pick on every bookmaker, used for the comparison table. */
  allBookmakers: BookmakerOdds[];
}

interface BetSlipContextValue {
  selections: BetSelection[];
  isOpen: boolean;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearAll: () => void;
  openBetSlip: () => void;
  closeBetSlip: () => void;
  stake: number;
  setStake: (stake: number) => void;
}

const BetSlipContext = createContext<BetSlipContextValue | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState(50);

  // Only one pick per match: a new pick replaces the previous one for the same match.
  const addSelection = (selection: BetSelection) => {
    const withId = { ...selection, id: selection.id ?? `${selection.matchId}-${selection.betType}` };
    setSelections((prev) => [...prev.filter((s) => s.matchId !== withId.matchId), withId]);
    setIsOpen(true);
  };

  const removeSelection = (id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAll = () => setSelections([]);
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
