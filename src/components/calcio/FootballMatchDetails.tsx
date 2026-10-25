// Line-ups, team statistics and timeline of a finished match (API-Football data, see src/lib/matchDetails.ts).
// The timeline text is built from the events only: nothing is added that the data does not say.
import { BarChart3, ListOrdered, Users } from "lucide-react";
import type { Match } from "../../lib/footballCore";
import { FOOTBALL_STATS, goalsWithScore, isGoal, type FootballDetails, type Lineup, type TimelineEvent } from "../../lib/matchDetails";
import { playedScore } from "./FootballBoxScore";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const minute = (e: Pick<TimelineEvent, "minute" | "extra">) => (e.extra ? `${e.minute}+${e.extra}'` : `${e.minute}'`);

function Title({ id, icon: Icon, children }: { id: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-white text-xl mb-4">
      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
      {children}
    </h2>
  );
}

function TeamLineup({ name, lineup }: { name: string; lineup: Lineup }) {
  return (
    <div>
      <p className="text-white mb-1">
        {name}
        {lineup.formation && <span className="text-slate-400"> · {lineup.formation}</span>}
      </p>
      {lineup.coach && <p className="text-slate-400 text-sm mb-3">Allenatore: {lineup.coach}</p>}
      <ol className="space-y-1 text-sm">
        {lineup.starters.map((p, i) => (
          <li key={i} className="flex gap-3 text-slate-200">
            <span className="w-6 text-right tabular-nums text-slate-400">{p.number ?? ""}</span>
            {p.name}
          </li>
        ))}
      </ol>
      {lineup.bench.length > 0 && (
        <>
          <p className="text-slate-400 text-sm mt-4 mb-1">A disposizione</p>
          <p className="text-sm text-slate-300">
            {lineup.bench.map((p) => (p.number != null ? `${p.number} ${p.name}` : p.name)).join(", ")}
          </p>
        </>
      )}
    </div>
  );
}

function fmtStat(v: number | null | undefined, kind: "pct" | "dec" | "int") {
  if (v == null) return "0";
  if (kind === "pct") return `${v}%`;
  if (kind === "dec") return v.toFixed(2).replace(".", ",");
  return String(v);
}

function Stats({ match, d }: { match: Match; d: FootballDetails }) {
  const h = d.stats.home ?? {};
  const a = d.stats.away ?? {};
  const rows = FOOTBALL_STATS.filter(([k]) => h[k] != null || a[k] != null);
  if (!rows.length) return null;
  return (
    <section className={card} aria-labelledby="statistiche">
      <Title id="statistiche" icon={BarChart3}>
        Statistiche
      </Title>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal py-2">
              {match.homeTeam.shortName}
            </th>
            <th scope="col" className="font-normal py-2">
              <span className="sr-only">Statistica</span>
            </th>
            <th scope="col" className="text-right font-normal py-2">
              {match.awayTeam.shortName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, label, kind]) => {
            const hv = h[k] ?? 0;
            const av = a[k] ?? 0;
            return (
              <tr key={k} className="border-b border-slate-800 last:border-0">
                <td className={`py-2.5 tabular-nums ${hv > av ? "text-white font-semibold" : "text-slate-300"}`}>
                  {fmtStat(h[k], kind)}
                </td>
                <th scope="row" className="py-2.5 text-center text-slate-400 font-normal">
                  {label}
                </th>
                <td className={`py-2.5 text-right tabular-nums ${av > hv ? "text-white font-semibold" : "text-slate-300"}`}>
                  {fmtStat(a[k], kind)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

const VAR_DETAIL: Record<string, string> = {
  "goal cancelled": "gol annullato",
  "goal disallowed": "gol annullato",
  "goal disallowed - offside": "gol annullato per fuorigioco",
  "goal disallowed - handball": "gol annullato per fallo di mano",
  "goal disallowed - foul": "gol annullato per fallo",
  "goal confirmed": "gol convalidato",
  "penalty confirmed": "rigore confermato",
  "penalty cancelled": "rigore annullato",
  "card upgrade": "cartellino modificato",
  "card reviewed": "cartellino rivisto",
};

/** One sentence per event, from the data only. */
function describe(e: TimelineEvent, team: string, score: string | undefined) {
  const who = e.player ?? "un giocatore";
  if (isGoal(e)) {
    if (e.detail === "Own Goal") return `Autogol di ${who}: ${score}.`;
    const how = e.detail === "Penalty" ? " su rigore" : "";
    const assist = e.other ? `, assist di ${e.other}` : "";
    return `Gol di ${who} (${team})${how}${assist}: ${score}.`;
  }
  if (e.type === "goal") return `${who} (${team}) sbaglia un rigore.`;
  if (e.type === "card") {
    if (/second yellow/i.test(e.detail)) return `Seconda ammonizione ed espulsione per ${who} (${team}).`;
    if (/red/i.test(e.detail)) return `Espulso ${who} (${team}).`;
    return `Ammonito ${who} (${team}).`;
  }
  if (e.type === "sub") {
    return e.other ? `Cambio (${team}): entra ${e.other}, esce ${who}.` : `Cambio (${team}): esce ${who}.`;
  }
  if (e.type === "var") {
    const what = VAR_DETAIL[e.detail.toLowerCase()] ?? "decisione rivista";
    return `VAR (${team}): ${what}${e.player ? `, ${e.player}` : ""}.`;
  }
  return `${e.detail} (${team}).`;
}

function Timeline({ match, d }: { match: Match; d: FootballDetails }) {
  if (!d.timeline.length) return null;
  const scores = new Map(goalsWithScore(d, playedScore(match)).map((g) => [g.event, g]));
  const name = (side: "home" | "away") => (side === "home" ? match.homeTeam.shortName : match.awayTeam.shortName);
  return (
    <section className={card} aria-labelledby="cronaca">
      <Title id="cronaca" icon={ListOrdered}>
        Cronaca
      </Title>
      <ol className="divide-y divide-slate-800">
        {d.timeline.map((e, i) => {
          const g = scores.get(e);
          return (
            <li key={i} className="flex gap-4 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-right tabular-nums text-slate-400">{minute(e)}</span>
              <span className={g ? "text-white font-semibold" : "text-slate-300"}>
                {describe(e, name(g?.side ?? e.side), g?.score.replace("-", "–"))}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function FootballMatchDetails({ match, details: d }: { match: Match; details: FootballDetails }) {
  const { home, away } = d.lineups;
  return (
    <>
      {(home || away) && (
        <section className={card} aria-labelledby="formazioni">
          <Title id="formazioni" icon={Users}>
            Formazioni
          </Title>
          <div className="grid sm:grid-cols-2 gap-6">
            {home && <TeamLineup name={match.homeTeam.shortName} lineup={home} />}
            {away && <TeamLineup name={match.awayTeam.shortName} lineup={away} />}
          </div>
        </section>
      )}
      <Stats match={match} d={d} />
      <Timeline match={match} d={d} />
      <p className="text-slate-400 text-xs">Formazioni, statistiche, voti e cronaca: dati API-Football.</p>
    </>
  );
}
