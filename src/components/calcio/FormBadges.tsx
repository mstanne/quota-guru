import { recentForm, type Competition } from "../../lib/footballCore";

const FORM_STYLE = {
  V: "bg-best text-best-foreground",
  N: "bg-slate-500 text-white",
  P: "bg-live text-white",
} as const;
const FORM_TITLE = { V: "Vittoria", N: "Pareggio", P: "Sconfitta" } as const;

/** Last results of a team (most recent first) as V / N / P badges. */
export function FormBadges({
  competition,
  teamId,
  size = "md",
  empty = <p className="text-slate-400 text-sm">Nessuna partita recente nei dati.</p>,
}: {
  competition: Competition;
  teamId: number;
  size?: "sm" | "md";
  empty?: React.ReactNode;
}) {
  const form = recentForm(competition, teamId);
  if (form.length === 0) return <>{empty}</>;
  const box = size === "sm" ? "w-5 h-5 text-[11px]" : "w-7 h-7 text-xs";
  return (
    <ol className={`flex ${size === "sm" ? "gap-1" : "gap-1.5"}`} aria-label="Ultimi risultati, dal più recente">
      {form.map(({ result, match }) => (
        <li key={match.id}>
          <span
            title={`${FORM_TITLE[result]}: ${match.homeTeam.shortName} ${match.score.fullTime.home}-${match.score.fullTime.away} ${match.awayTeam.shortName}`}
            className={`${box} rounded inline-flex items-center justify-center font-semibold ${FORM_STYLE[result]}`}
          >
            {result}
          </span>
        </li>
      ))}
    </ol>
  );
}
