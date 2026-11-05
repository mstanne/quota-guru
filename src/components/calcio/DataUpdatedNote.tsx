import { Clock } from "lucide-react";
import { formatUpdated } from "../../lib/footballCore";

export function DataUpdatedNote({
  generatedAt,
  className = "",
  short = false,
  cadence = "durante le partite ogni 15 minuti circa",
}: {
  /** How often the data are refreshed ("ogni 3 ore circa" for data outside the quick updates, e.g. the Serie A basket standings). */
  cadence?: string;
  generatedAt: string;
  className?: string;
  /** Lists with an "In corso" group (which says how often scores change): the explanation only from `sm` up. */
  short?: boolean;
}) {
  return (
    // data-volatile: changes at every data refresh, ignored when the pre-render decides if a page changed (lastmod)
    <p data-volatile="" className={`flex items-center gap-1.5 text-slate-400 text-sm ${className}`}>
      <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>
        Dati aggiornati al {formatUpdated(generatedAt)}
        <span className={short ? "hidden sm:inline" : ""}> · {cadence}, non in tempo reale</span>
      </span>
    </p>
  );
}
