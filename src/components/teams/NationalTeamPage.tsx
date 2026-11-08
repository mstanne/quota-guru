// /calcio/squadre/:squadra for a national team: next matches with the model's 1X2, last results, record year by
// year and by competition, Under/Over and Goal, call-ups and coach (data: scripts/derive-teams.mjs).
import { BarChart3, CalendarClock, CalendarDays, Flag, ListChecks, Users } from "lucide-react";
import { Link } from "../../lib/links";
import { formatDay, formatTime } from "../../lib/footballCore";
import { footballTeamPath, type NationalTeam } from "../../lib/teams";
import { confedLabel, nationalTeamMeta } from "../../lib/teamMeta";
import { usePageMeta } from "../../lib/pageMeta";
import { PageHeader } from "../layout/PageHeader";
import { TeamBadge } from "../calcio/MatchRow";
import { FootballPlayerLink } from "../players/FootballPlayerLink";
import { GoalStatsNote, TeamGoalTable } from "../stats/GoalStats";
import { Card, Facts, SectionTitle, formatDate } from "./TeamUi";

const pc = (v: number) => `${Math.round(v * 100)}%`;
const GROUPS: [string, RegExp][] = [
  ["Portieri", /keeper/i],
  ["Difensori", /back|defen/i],
  ["Centrocampisti", /midfield/i],
  ["Attaccanti", /forward|wing|offen|striker|attack/i],
];
const groupOf = (pos: string | null) => GROUPS.find(([, re]) => pos && re.test(pos))?.[0] ?? "Altri";

function Opponent({ id, name }: { id: number; name: string }) {
  const to = footballTeamPath(id);
  return to ? (
    <Link to={to} className="text-action-text hover:text-action-text-hover">
      {name}
    </Link>
  ) : (
    <>{name}</>
  );
}

function Upcoming({ t }: { t: NationalTeam }) {
  if (!t.upcoming.length) return null;
  return (
    <Card id="prossime">
      <SectionTitle id="prossime-titolo" icon={CalendarClock}>
        Prossime partite della nazionale
      </SectionTitle>
      <ul className="divide-y divide-slate-800 text-sm">
        {t.upcoming.map((m) => (
          <li key={m.path + m.date} className="py-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span>
              <Link to={m.path} className="text-action-text hover:text-action-text-hover">
                Pronostico {m.home ? `${t.name} – ${m.opponent}` : `${m.opponent} – ${t.name}`}
              </Link>
              <span className="text-slate-400"> · {m.competition}</span>
            </span>
            <span className="text-slate-400 tabular-nums">
              {formatDay(m.date)}, ore {formatTime(m.date)}
              {m.p && (
                <span className="ml-3 text-slate-300">
                  vittoria {pc(m.p[0])} · pari {pc(m.p[1])} · sconfitta {pc(m.p[2])}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-slate-400 text-xs mt-3">
        Probabilità di vittoria, pareggio e sconfitta della nazionale {t.name} secondo il modello statistico delle
        nazionali: non sono quote né consigli di gioco.
      </p>
    </Card>
  );
}

function Recent({ t }: { t: NationalTeam }) {
  if (!t.recent.length) return null;
  return (
    <Card id="risultati">
      <SectionTitle id="risultati-titolo" icon={ListChecks}>
        Ultimi risultati
      </SectionTitle>
      <ul className="divide-y divide-slate-800 text-sm">
        {t.recent.map((r) => {
          const res = r.gf > r.ga ? "V" : r.gf === r.ga ? "N" : "P";
          const score = r.home ? `${r.gf}-${r.ga}` : `${r.ga}-${r.gf}`;
          return (
            <li key={r.date + r.opponentId} className="py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`inline-flex w-6 justify-center rounded text-xs font-semibold ${res === "V" ? "bg-emerald-900 text-emerald-200" : res === "N" ? "bg-slate-700 text-slate-200" : "bg-rose-900 text-rose-200"}`}
                aria-label={res === "V" ? "vittoria" : res === "N" ? "pareggio" : "sconfitta"}
              >
                {res}
              </span>
              <span className="text-slate-400 tabular-nums w-24">{formatDate(r.date)}</span>
              <span className="flex-1 text-white">
                {r.home ? t.name : <Opponent id={r.opponentId} name={r.opponent} />}{" "}
                {r.path ? (
                  <Link to={r.path} className="text-action-text hover:text-action-text-hover tabular-nums">
                    {score}
                  </Link>
                ) : (
                  <span className="tabular-nums">{score}</span>
                )}{" "}
                {r.home ? <Opponent id={r.opponentId} name={r.opponent} /> : t.name}
              </span>
              <span className="text-slate-400 text-xs">{r.competition}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Years({ t }: { t: NationalTeam }) {
  if (!t.years.length) return null;
  const cell = "text-right px-2 tabular-nums";
  return (
    <Card id="anni">
      <SectionTitle id="anni-titolo" icon={CalendarDays}>
        Anno per anno
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <caption className="sr-only">Bilancio di {t.name} anno per anno, per competizione</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-3 pr-2">Anno</th>
              <th scope="col" className="text-right font-normal py-3 px-2"><abbr title="Partite giocate">G</abbr></th>
              <th scope="col" className="text-right font-normal py-3 px-2"><abbr title="Vittorie">V</abbr></th>
              <th scope="col" className="text-right font-normal py-3 px-2"><abbr title="Pareggi">N</abbr></th>
              <th scope="col" className="text-right font-normal py-3 px-2"><abbr title="Sconfitte">P</abbr></th>
              <th scope="col" className="text-right font-normal py-3 px-2"><abbr title="Gol fatti e subiti">Gol</abbr></th>
            </tr>
          </thead>
          <tbody>
            {t.years.flatMap((y) => [
              <tr key={y.year} className="border-b border-slate-800 text-white">
                <th scope="row" className="text-left font-semibold py-2.5 pr-2">{y.year}</th>
                <td className={cell}>{y.total.played}</td>
                <td className={cell}>{y.total.won}</td>
                <td className={cell}>{y.total.draw}</td>
                <td className={cell}>{y.total.lost}</td>
                <td className={cell}>{y.total.gf}-{y.total.ga}</td>
              </tr>,
              ...(y.byComp.length > 1
                ? y.byComp.map((c) => (
                    <tr key={`${y.year}-${c.competition}`} className="border-b border-slate-800 text-slate-400">
                      <th scope="row" className="text-left font-normal py-2 pr-2 pl-4">{c.competition}</th>
                      <td className={cell}>{c.played}</td>
                      <td className={cell}>{c.won}</td>
                      <td className={cell}>{c.draw}</td>
                      <td className={cell}>{c.lost}</td>
                      <td className={cell}>{c.gf}-{c.ga}</td>
                    </tr>
                  ))
                : []),
            ])}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-3">
        Partite ufficiali e amichevoli degli ultimi anni presenti nei dati del sito.
      </p>
    </Card>
  );
}

function Squad({ t }: { t: NationalTeam }) {
  if (!t.squad.length) return null;
  const groups = [...GROUPS.map(([g]) => g), "Altri"]
    .map((g) => [g, t.squad.filter((p) => groupOf(p.position) === g)] as const)
    .filter(([, list]) => list.length);
  return (
    <Card id="convocati">
      <SectionTitle id="convocati-titolo" icon={Users}>
        Convocati
      </SectionTitle>
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map(([g, list]) => (
          <div key={g}>
            <h3 className="text-slate-300 mb-2">{g}</h3>
            <ul className="divide-y divide-slate-800 text-sm">
              {list.map((p) => (
                <li key={p.name} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-right tabular-nums text-slate-400">{p.number ?? ""}</span>
                  <span className="flex-1 text-white">
                    <FootballPlayerLink id={p.id} name={p.name} />
                  </span>
                  <span className="text-slate-400">{p.age ? `${p.age} anni` : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {t.squadUpdatedAt && (
        <p className="text-slate-400 text-xs mt-3">
          Ultima lista disponibile, aggiornata al {formatDate(t.squadUpdatedAt)}: può includere giocatori non convocati
          per la prossima partita.
        </p>
      )}
    </Card>
  );
}

export function NationalTeamPage({ t }: { t: NationalTeam }) {
  usePageMeta(nationalTeamMeta(t));
  const facts: [string, string][] = [
    ["Nazionale", t.name],
    ...(t.confed ? ([["Confederazione", confedLabel(t.confed)!]] as [string, string][]) : []),
    ...(t.coach
      ? ([["Commissario tecnico", `${t.coach.name}${t.coach.nationality ? ` (${t.coach.nationality})` : ""}`]] as [string, string][])
      : []),
  ];
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <TeamBadge team={{ tla: t.tla, shortName: t.shortName, crest: t.crest }} size="lg" />
            Nazionale {t.name}
          </span>
        }
        subtitle={`Pronostici delle prossime partite, risultati, bilancio anno per anno e convocati della nazionale ${t.name === "Italia" ? "italiana" : `di ${t.name}`}.`}
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: "Squadre", to: "/calcio/squadre" },
          { label: t.name },
        ]}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card id="nazionale">
          <SectionTitle id="nazionale-titolo" icon={Flag}>
            La nazionale
          </SectionTitle>
          <Facts rows={facts} />
        </Card>
        <Upcoming t={t} />
        <Recent t={t} />
        <Years t={t} />
        {t.goals && (
          <Card id="under-over">
            <SectionTitle id="under-over-titolo" icon={BarChart3}>
              Under/Over e Goal
            </SectionTitle>
            <TeamGoalTable stats={t.goals} caption={`Under/Over e Goal di ${t.name}, ultimi due anni`} />
            <GoalStatsNote complete={t.goals.complete ?? true} />
          </Card>
        )}
        <Squad t={t} />
      </div>
    </div>
  );
}
