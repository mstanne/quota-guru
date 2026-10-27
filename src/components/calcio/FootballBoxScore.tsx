// Match report shown at the top of a finished match page: final and partial scores, how the match was decided
// and, when the data plan provides them, scorers and cards. Everything is computed from the downloaded data.
import { ClipboardList } from "lucide-react";
import type { Match, MatchCard, MatchGoal, Score, Team } from "../../lib/footballCore";
import { goalsWithScore, type FootballDetails } from "../../lib/matchDetails";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

const has = (s?: Score | null): s is { home: number; away: number } => s?.home != null && s?.away != null;
const sum = (a: Score, b?: Score | null): Score =>
  has(a) && has(b) ? { home: a.home + b.home, away: a.away + b.away } : a;
const diff = (a: Score, b: Score): Score =>
  has(a) && has(b) ? { home: a.home - b.home, away: a.away - b.away } : { home: null, away: null };
const fmt = (s: Score) => `${s.home}–${s.away}`;
const minute = (m: number, extra?: number | null) => (extra ? `${m}+${extra}'` : `${m}'`);

/** Score at the end of play (regular + extra time), without penalties. */
export function playedScore(m: Match): Score {
  const { fullTime, regularTime, extraTime, duration } = m.score;
  if (duration === "PENALTY_SHOOTOUT" && has(regularTime)) return sum(regularTime, extraTime);
  return fullTime;
}

interface Row {
  label: string;
  value: string;
}

export function footballReportRows(m: Match): Row[] {
  const home = m.homeTeam.shortName;
  const away = m.awayTeam.shortName;
  const played = playedScore(m);
  const ht = m.score.halfTime;
  if (!has(played)) return [];
  const regular = m.score.duration && has(m.score.regularTime) ? m.score.regularTime : played;
  const rows: Row[] = [];
  const suffix =
    m.score.duration === "PENALTY_SHOOTOUT" ? " d.c.r." : m.score.duration === "EXTRA_TIME" ? " d.t.s." : "";
  rows.push({ label: "Risultato finale", value: `${home} ${fmt(played)} ${away}${suffix}` });
  if (has(ht)) {
    rows.push({ label: "Primo tempo", value: fmt(ht) });
    const second = diff(regular, ht);
    if (has(second)) rows.push({ label: "Secondo tempo", value: fmt(second) });
  }
  if (m.score.duration && has(m.score.extraTime)) rows.push({ label: "Supplementari", value: fmt(m.score.extraTime) });
  if (m.score.duration === "PENALTY_SHOOTOUT" && has(m.score.penalties)) {
    rows.push({ label: "Rigori", value: fmt(m.score.penalties) });
  }

  // outcome (after penalties, if any)
  const decider = m.score.duration === "PENALTY_SHOOTOUT" && has(m.score.penalties) ? m.score.penalties : played;
  const winner = decider.home! > decider.away! ? home : decider.home! < decider.away! ? away : null;
  rows.push({ label: "Esito", value: winner ? `Vittoria ${winner}` : "Pareggio" });

  // comebacks: behind at half time, not beaten at the end
  if (has(ht) && ht.home !== ht.away) {
    const leaderHome = ht.home > ht.away;
    const trailing = leaderHome ? away : home;
    const end = leaderHome ? decider.away! - decider.home! : decider.home! - decider.away!;
    if (end >= 0) {
      rows.push({
        label: "Rimonta",
        value: `${trailing} ${end > 0 ? (decider === played ? "vince" : "vince ai rigori") : "pareggia"} dopo essere stata sotto ${fmt(ht)} all'intervallo`,
      });
    }
  }

  // goal markets are settled on the 90 minutes: extra time does not count
  const ninety = has(regular) ? regular : played;
  const at90 = m.score.duration ? " nei 90'" : "";
  const goals = ninety.home! + ninety.away!;
  rows.push({ label: `Gol totali${at90}`, value: `${goals} (${goals > 2.5 ? "Over" : "Under"} 2,5)` });
  rows.push({
    label: `Entrambe a segno${at90}`,
    value: ninety.home! > 0 && ninety.away! > 0 ? "Sì (Goal)" : "No (No goal)",
  });
  if (m.referee) rows.push({ label: "Arbitro", value: m.referee });
  return rows;
}

const GOAL_NOTE = { REGULAR: "", PENALTY: " (rig.)", OWN: " (aut.)" } as const;
const CARD_LABEL = { YELLOW: "Ammonizione", YELLOW_RED: "Doppia ammonizione", RED: "Espulsione" } as const;

function TeamEvents({ team, goals, cards }: { team: Team; goals: MatchGoal[]; cards: MatchCard[] }) {
  return (
    <div>
      <p className="text-slate-300 mb-2">{team.shortName}</p>
      {goals.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {goals.map((g, i) => (
            <li key={i} className="text-white">
              <span className="tabular-nums text-slate-400 mr-2">{minute(g.minute, g.injuryTime)}</span>
              {g.scorer ?? "Gol"}
              {GOAL_NOTE[g.type]}
              {g.assist && <span className="text-slate-400"> (assist {g.assist})</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">Nessun gol</p>
      )}
      {cards.length > 0 && (
        <ul className="space-y-1 text-sm mt-3">
          {cards.map((c, i) => (
            <li key={i} className="text-slate-300">
              <span className="tabular-nums text-slate-400 mr-2">{minute(c.minute)}</span>
              <span
                aria-hidden="true"
                className={`inline-block w-2.5 h-3.5 rounded-sm mr-2 align-[-2px] ${c.card === "YELLOW" ? "bg-yellow-400" : "bg-red-600"}`}
              />
              {CARD_LABEL[c.card]}
              {c.player ? `: ${c.player}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Goals and cards from the API-Sports timeline, in the same shape as football-data.org's. */
function eventsFromDetails(match: Match, d: FootballDetails): { goals: MatchGoal[]; cards: MatchCard[] } {
  const id = (side: "home" | "away") => (side === "home" ? match.homeTeam.id : match.awayTeam.id);
  const final = playedScore(match);
  const goals = goalsWithScore(d, final).map(({ event: e, side }) => ({
    minute: e.minute,
    injuryTime: e.extra,
    type: e.detail === "Own Goal" ? ("OWN" as const) : e.detail === "Penalty" ? ("PENALTY" as const) : ("REGULAR" as const),
    team: id(side),
    scorer: e.player,
    assist: e.detail === "Own Goal" ? null : e.other,
  }));
  const cards = d.timeline
    .filter((e) => e.type === "card")
    .map((e) => ({
      minute: e.minute,
      team: id(e.side),
      player: e.player,
      card: /second yellow/i.test(e.detail) ? ("YELLOW_RED" as const) : /red/i.test(e.detail) ? ("RED" as const) : ("YELLOW" as const),
    }));
  return { goals, cards };
}

export function FootballBoxScore({ match, details }: { match: Match; details?: FootballDetails }) {
  const rows = footballReportRows(match);
  if (rows.length === 0) return null;
  const fromDetails = !match.goals && details ? eventsFromDetails(match, details) : null;
  const goals = match.goals ?? fromDetails?.goals ?? [];
  const cards = match.cards ?? fromDetails?.cards ?? [];
  if (details?.top) {
    const t = details.top;
    const who = t.side === "home" ? match.homeTeam.shortName : match.awayTeam.shortName;
    const extra = [t.goals ? `${t.goals} gol` : "", t.assists ? `${t.assists} assist` : ""]
      .filter(Boolean)
      .join(", ");
    rows.push({
      label: "Migliore in campo",
      value: `${t.name} (${who}) · voto ${t.rating.toFixed(1).replace(".", ",")}${extra ? ` · ${extra}` : ""}`,
    });
  }
  if (details?.venue) rows.push({ label: "Stadio", value: details.city ? `${details.venue}, ${details.city}` : details.venue });
  const forTeam = (id: number) => ({
    goals: goals.filter((g) => g.team === id),
    cards: cards.filter((c) => c.team === id),
  });
  return (
    <section className={`${card} @container`} aria-labelledby="tabellino">
      <h2 id="tabellino" className="flex items-center gap-2 text-white text-xl mb-4">
        <ClipboardList className="w-5 h-5 text-slate-300" aria-hidden="true" />
        Tabellino
      </h2>
      <dl className="grid gap-x-8 @lg:grid-cols-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4 py-2 border-b border-slate-800">
            <dt className="text-slate-400">{r.label}</dt>
            <dd className="text-white text-right tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      {(goals.length > 0 || cards.length > 0) && (
        <div className="grid @lg:grid-cols-2 gap-5 mt-5">
          <TeamEvents team={match.homeTeam} {...forTeam(match.homeTeam.id)} />
          <TeamEvents team={match.awayTeam} {...forTeam(match.awayTeam.id)} />
        </div>
      )}
      {details?.top && (
        <p className="text-slate-400 text-xs mt-4">
          Migliore in campo: giocatore con il voto più alto assegnato da API-Football in base alle statistiche della
          partita.
        </p>
      )}
    </section>
  );
}
