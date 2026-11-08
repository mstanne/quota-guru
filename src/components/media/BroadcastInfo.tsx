// "In TV" row of the match information box: channels in Italy from the 2026/27 rights deals (src/lib/broadcast.ts).
import { BROADCAST_SEASON, type Broadcast } from "../../lib/broadcast";

/** "2026-11-08" -> "08/11/2026" */
export const formatIsoDay = (d: string) => d.split("-").reverse().join("/");

export function BroadcastRow({ broadcast, className = "" }: { broadcast: Broadcast | null; className?: string }) {
  if (!broadcast) return null;
  return (
    <div className={className}>
      <div className="flex justify-between gap-4">
        <dt className="text-slate-400">In TV</dt>
        <dd className="text-white text-right">{broadcast.channels}</dd>
      </div>
      <p className="text-slate-400 text-xs mt-1 text-right">
        {broadcast.verifiedAt
          ? `Dal palinsesto delle emittenti, controllato il ${formatIsoDay(broadcast.verifiedAt)}: può cambiare all'ultimo momento.`
          : `${broadcast.note ? `${broadcast.note} ` : ""}Secondo gli accordi sui diritti TV ${BROADCAST_SEASON}; il palinsesto definitivo è quello delle emittenti.`}
      </p>
    </div>
  );
}
