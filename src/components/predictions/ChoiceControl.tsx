// One choice among a few (period, market…): a segmented control from `sm` up, a native menu on phones, where the
// segments would not fit on one line. Both are always in the page (one hidden by CSS), so the pre-rendered HTML
// works on any width.
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

export function ChoiceControl<T extends string>({
  label,
  options,
  value,
  onChange,
  icon: Icon,
  tone = "neutral",
  className = "",
  trackAttrs,
}: {
  /** Name of the choice ("Periodo", "Mercato"), shown before the control and read by screen readers. */
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  icon?: LucideIcon;
  /** "predict": the active segment in the predictions colour (markets). */
  tone?: "neutral" | "predict";
  className?: string;
  /** data-track-* attributes added to each segment (analytics). */
  trackAttrs?: (id: T) => Record<string, string>;
}) {
  const active = tone === "predict" ? "bg-predict/15 text-predict" : "bg-slate-700 text-white";
  return (
    <div className={`min-w-0 ${className}`}>
      {/* phones: native menu */}
      <label className="sm:hidden flex items-center gap-2 min-w-0">
        <span className="shrink-0 inline-flex items-center text-slate-400">
          {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          <span className="sr-only">{label}</span>
        </span>
        <span className="relative flex-1 min-w-0">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as T)}
            className="w-full h-10 appearance-none rounded-md border border-slate-700 bg-slate-900 pl-3 pr-8 text-white text-sm cursor-pointer"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
        </span>
      </label>

      {/* from sm: segmented control */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm">
          {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          {label}
        </span>
        <div role="group" aria-label={label} className="flex gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={value === o.id}
              {...(trackAttrs?.(o.id) ?? {})}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors cursor-pointer ${
                value === o.id ? active : "text-slate-400 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
