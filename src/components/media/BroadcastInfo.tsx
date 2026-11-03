// "In TV" row of the match information box: channels in Italy from the 2026/27 rights deals (src/lib/broadcast.ts).
import { BROADCAST_SEASON, type Broadcast } from "../../lib/broadcast";

export function BroadcastRow({ broadcast, className = "" }: { broadcast: Broadcast | null; className?: string }) {
  if (!broadcast) return null;
  return (
    <div className={className}>
      <div className="flex justify-between gap-4">
        <dt className="text-slate-400">In TV</dt>
        <dd className="text-white text-right">{broadcast.channels}</dd>
      </div>
      <p className="text-slate-400 text-xs mt-1 text-right">
        {broadcast.note ? `${broadcast.note} ` : ""}Secondo gli accordi sui diritti TV {BROADCAST_SEASON}; il palinsesto definitivo
        è quello delle emittenti.
      </p>
    </div>
  );
}
