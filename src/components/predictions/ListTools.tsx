// Small pieces shared by the match lists (football and NBA calendar pages): team search, empty state and the
// heading of a competition inside a day.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Search, X } from "lucide-react";

/**
 * Team search of a match list. From `sm` up a small field at the end of the filter row; on phones a search button
 * that opens the field on its own row (the sticky bar stays two rows high until it is used).
 */
export function TeamSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const shown = open || !!value;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={shown}
        aria-label="Cerca una squadra"
        className={`sm:hidden inline-flex items-center justify-center size-10 rounded-md border cursor-pointer ${
          shown ? "border-slate-500 bg-slate-800 text-white" : "border-slate-700 bg-slate-900 text-slate-300"
        }`}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
      </button>
      <label className={`${shown ? "flex" : "hidden"} sm:flex col-span-full sm:ml-auto relative items-center`}>
        <span className="sr-only">Cerca una squadra</span>
        <Search className="pointer-events-none absolute left-2.5 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onChange("");
              setOpen(false);
            }
          }}
          placeholder="Cerca squadra"
          autoComplete="off"
          className="w-full sm:w-44 h-10 rounded-md border border-slate-700 bg-slate-900 pl-8 pr-8 text-white text-sm placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              input.current?.focus();
            }}
            aria-label="Cancella la ricerca"
            className="absolute right-1 inline-flex items-center justify-center size-8 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </label>
    </>
  );
}

/** Empty list: what happened and, when there is one, the way out (next matches, clear the search). */
export function EmptyList({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 sm:p-10 text-center">
      <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true" />
      <p className="text-white mb-1">{title}</p>
      {text && <p className="text-slate-400 text-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const emptyActionClass =
  "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm hover:border-slate-500 cursor-pointer";

/** Heading of one competition (and round) inside a day card: "Serie A · 11ª giornata". */
export function GroupSubheading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400 first:rounded-t-xl">
      {children}
    </div>
  );
}
