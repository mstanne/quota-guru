// Quick market selector above the match lists: switches the probabilities shown in every row,
// client-side, without reloading the page.
import { ChartColumn } from "lucide-react";
import { currentPage, track } from "../../lib/analytics";

export function MarketFilter<T extends string>({
  options,
  value,
  onChange,
  sport = "calcio",
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  sport?: "calcio" | "nba";
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm">
        <ChartColumn className="w-4 h-4" aria-hidden="true" />
        Mercato
      </span>
      <div
        role="group"
        aria-label="Mercato mostrato nei pronostici"
        className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800"
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              onChange(o.id);
              track("market_filter", { market: o.id, sport, page: currentPage() });
            }}
            aria-pressed={value === o.id}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors cursor-pointer ${
              value === o.id ? "bg-predict/15 text-predict" : "text-slate-400 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
