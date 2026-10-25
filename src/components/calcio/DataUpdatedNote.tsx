import { Clock } from "lucide-react";
import { formatUpdated } from "../../lib/footballCore";

export function DataUpdatedNote({ generatedAt, className = "" }: { generatedAt: string; className?: string }) {
  return (
    // data-volatile: changes at every data refresh, ignored when the pre-render decides if a page changed (lastmod)
    <p data-volatile="" className={`flex items-center gap-1.5 text-slate-400 text-sm ${className}`}>
      <Clock className="w-4 h-4" aria-hidden="true" />
      Dati aggiornati al {formatUpdated(generatedAt)} · risultati non in diretta
    </p>
  );
}
