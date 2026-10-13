// Small shared pieces of the tennis pages (surface chip, ranking movement, tournament status).
import { ArrowDown, ArrowUp } from "lucide-react";
import { statusLabel, surfaceInfo, tournamentStatus, type Tournament } from "../../lib/tennis";

export function SurfaceChip({ surface }: { surface: string | null }) {
  const s = surfaceInfo(surface);
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-300 text-xs">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function Movement({ value }: { value: number }) {
  if (!value) return <span className="text-slate-500" aria-label="Posizione invariata">–</span>;
  const up = value > 0;
  const n = Math.abs(value);
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${up ? "text-best" : "text-red-400"}`}
      aria-label={`${up ? "Sale" : "Scende"} di ${n} ${n === 1 ? "posizione" : "posizioni"}`}
    >
      {up ? <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />}
      {n}
    </span>
  );
}

export function StatusBadge({ tournament }: { tournament: Tournament }) {
  const st = tournamentStatus(tournament);
  const cls =
    st === "live" ? "bg-live text-white" : st === "upcoming" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400";
  return <span className={`px-2 py-0.5 rounded-md text-xs ${cls}`}>{statusLabel[st]}</span>;
}
