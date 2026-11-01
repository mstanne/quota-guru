// Injured and suspended players of a match still to be played (API-Football, scripts/fetch-football.mjs).
import { UserX } from "lucide-react";
import type { Match, Unavailable } from "../../lib/footballCore";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

function TeamList({ name, list }: { name: string; list: Unavailable[] }) {
  return (
    <div>
      <p className="text-white mb-2">{name}</p>
      {list.length ? (
        <ul className="space-y-1.5 text-sm">
          {list.map((p, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-slate-200">
              <span>{p.name}</span>
              <span className="text-slate-400">{p.reason}</span>
              {p.doubtful && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-warn text-xs">in dubbio</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-400 text-sm">Nessun indisponibile segnalato.</p>
      )}
    </div>
  );
}

export function MatchUnavailable({ match }: { match: Match }) {
  const inj = match.injuries;
  if (!inj || (!inj.home.length && !inj.away.length)) return null;
  return (
    <section className={card} aria-labelledby="indisponibili">
      <h2 id="indisponibili" className="flex items-center gap-2 text-white text-xl mb-4">
        <UserX className="w-5 h-5 text-slate-300" aria-hidden="true" />
        Indisponibili
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <TeamList name={match.homeTeam.shortName} list={inj.home} />
        <TeamList name={match.awayTeam.shortName} list={inj.away} />
      </div>
      <p className="text-slate-400 text-xs mt-4">
        Infortunati e squalificati segnalati prima della partita (dati API-Football); «in dubbio» indica una presenza
        incerta. Le scelte definitive si vedono nelle formazioni ufficiali, circa un'ora prima del calcio d'inizio.
      </p>
    </section>
  );
}
