// Quick market selector above the match lists: switches the probabilities shown in every row,
// client-side, without reloading the page. Segmented control from `sm` up, a menu on phones (ChoiceControl).
import { ChartColumn } from "lucide-react";
import { currentPage, track } from "../../lib/analytics";
import { ChoiceControl } from "./ChoiceControl";

export function MarketFilter<T extends string>({
  options,
  value,
  onChange,
  sport = "calcio",
  className = "mb-6",
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  sport?: "calcio" | "nba";
  className?: string;
}) {
  return (
    <ChoiceControl
      label="Mercato"
      icon={ChartColumn}
      tone="predict"
      options={options}
      value={value}
      onChange={(v) => {
        onChange(v);
        track("market_filter", { market: v, sport, page: currentPage() });
      }}
      className={className}
    />
  );
}
