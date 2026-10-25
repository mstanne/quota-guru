// /calcio/squadre/:squadra — club details, squad and season-by-season statistics.
import { useParams } from "react-router";
import { Building2, CalendarDays, ListChecks, ListOrdered, Shield, Users } from "lucide-react";
import { hasResults, resultsPath } from "../../lib/results";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { TeamBadge } from "../calcio/MatchRow";
import { NotFoundPage } from "../NotFoundPage";
import { usePageMeta } from "../../lib/pageMeta";
import { footballTeam, type FootballSeason, type FootballTeam } from "../../lib/teams";
import { footballTeamMeta } from "../../lib/teamMeta";
import { Card, Facts, SectionTitle, age, formatDate, num } from "./TeamUi";

const GROUPS: [string, RegExp][] = [
  ["Portieri", /keeper/i],
  ["Difensori", /back|defen/i],
  ["Centrocampisti", /midfield/i],
  ["Attaccanti", /forward|wing|offen|striker|attack/i],
];
const groupOf = (pos: string | null) => GROUPS.find(([, re]) => pos && re.test(pos))?.[0] ?? "Altri";

function Squad({ team }: { team: FootballTeam }) {
  if (!team.squad.length) return null;
  const groups = [...GROUPS.map(([g]) => g), "Altri"]
    .map((g) => [g, team.squad.filter((p) => groupOf(p.position) === g)] as const)
    .filter(([, list]) => list.length);
  const current = team.seasons.find((s) => s.current);
  return (
    <Card id="rosa">
      <SectionTitle id="rosa-titolo" icon={Users}>
        Rosa {current?.label ?? ""}
      </SectionTitle>
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map(([g, list]) => (
          <div key={g}>
            <h3 className="text-slate-300 mb-2">{g}</h3>
            <ul className="divide-y divide-slate-800 text-sm">
              {list.map((p) => (
                <li key={p.name} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-right tabular-nums text-slate-400">{p.number ?? ""}</span>
                  <span className="flex-1 text-white">{p.name}</span>
                  <span className="text-slate-400">{[p.nationality, p.born ? `${age(p.born)} anni` : null].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Record({ s }: { s: FootballSeason }) {
  const r = s.record;
  if (!r) return null;
  const cells: [string, string | number][] = [
    ["Posizione", `${r.position}ª di ${r.size}`],
    ["Punti", r.points ?? 0],
    ["Partite", r.played],
    ["Vittorie / Pareggi / Sconfitte", `${r.won} / ${r.draw ?? 0} / ${r.lost}`],
    ["Gol fatti / subiti", `${r.gf ?? 0} / ${r.ga ?? 0}`],
    ["Media gol fatti", r.played ? num((r.gf ?? 0) / r.played, 2) : "–"],
  ];
  if (r.home && r.away) {
    const rec = (x: NonNullable<typeof r.home>) => `${x.won}V ${x.draw ?? 0}N ${x.lost}P · ${x.gf ?? 0}-${x.ga ?? 0}`;
    cells.push(["In casa", rec(r.home)], ["In trasferta", rec(r.away)]);
  }
  return <Facts rows={cells} />;
}

function Players({ s }: { s: FootballSeason }) {
  if (!s.players?.length) return null;
  const th = "text-right font-normal py-2 px-2 whitespace-nowrap";
  const td = "text-right px-2 py-2 tabular-nums";
  return (
    <div className="overflow-x-auto mt-5">
      <table className="w-full text-sm">
        <caption className="text-left text-slate-300 mb-2">Statistiche dei giocatori (tutte le competizioni)</caption>
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal py-2 pr-2">Giocatore</th>
            <th scope="col" className={th}>Pres.</th>
            <th scope="col" className={th}>Tit.</th>
            <th scope="col" className={th}>Minuti</th>
            <th scope="col" className={th}>Gol</th>
            <th scope="col" className={th}>Assist</th>
            <th scope="col" className={th}>Amm.</th>
            <th scope="col" className={th}>Esp.</th>
            <th scope="col" className={th}>Voto</th>
          </tr>
        </thead>
        <tbody>
          {s.players.map((p) => (
            <tr key={p.name} className="border-b border-slate-800 last:border-0">
              <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                {p.name}
                {p.pos && <span className="text-slate-400 text-xs ml-1.5">{p.pos}</span>}
              </th>
              <td className={`${td} text-slate-300`}>{p.apps}</td>
              <td className={`${td} text-slate-300`}>{p.starts}</td>
              <td className={`${td} text-slate-300`}>{p.min}</td>
              <td className={`${td} text-white font-semibold`}>{p.goals}</td>
              <td className={`${td} text-slate-300`}>{p.assists}</td>
              <td className={`${td} text-slate-300`}>{p.yellow}</td>
              <td className={`${td} text-slate-300`}>{p.red}</td>
              <td className={`${td} text-slate-300`}>{p.rating != null ? num(p.rating, 2) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-slate-400 text-xs mt-2">Statistiche e voti dei giocatori: dati API-Football.</p>
    </div>
  );
}

function Season({ s, open }: { s: FootballSeason; open: boolean }) {
  return (
    <details open={open} className="group border-b border-slate-800 last:border-0 py-4">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
        <h3 className="text-white text-lg">
          {s.label} · {s.competition}
          {s.current && <span className="text-slate-400 text-sm ml-2">in corso</span>}
        </h3>
        {s.record && (
          <span className="text-slate-300 text-sm tabular-nums">
            {s.record.position}ª · {s.record.points} punti
          </span>
        )}
      </summary>
      <div className="mt-4">
        {s.partial && (
          <p className="text-warn text-xs mb-3">
            Classifica calcolata su {s.partial.played} partite delle {s.partial.expected} della stagione: posizione e
            punti possono essere approssimati.
          </p>
        )}
        <Record s={s} />
        {s.recent.length > 0 && (
          <div className="mt-4">
            <p className="text-slate-300 text-sm mb-2">Ultime partite</p>
            <ul className="text-sm divide-y divide-slate-800">
              {s.recent.map((m, i) => (
                <li key={i} className="flex gap-3 py-1.5">
                  <span className="w-24 text-slate-400 tabular-nums">{formatDate(m.date)}</span>
                  <span className="flex-1 text-slate-200">
                    {m.home ? "vs" : "@"} {m.opponent}
                  </span>
                  {m.path ? (
                    <Link to={m.path} className="tabular-nums text-white hover:underline underline-offset-4" aria-label={`${m.gf}-${m.ga} contro ${m.opponent}: scheda della partita`}>
                      {m.gf}–{m.ga}
                    </Link>
                  ) : (
                    <span className="tabular-nums text-white">
                      {m.gf}–{m.ga}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Players s={s} />
      </div>
    </details>
  );
}

export function FootballTeamPage() {
  const { squadra } = useParams();
  const t = footballTeam(squadra);
  if (t instanceof Promise) throw t; // league data still loading (Suspense)
  usePageMeta(t ? footballTeamMeta(t) : null);
  if (!t) return <NotFoundPage />;
  const cur = t.seasons.find((s) => s.current);
  const facts: [string, string | number | JSX.Element][] = [
    ["Nome", t.name],
    ...(t.founded ? ([["Fondazione", t.founded]] as [string, number][]) : []),
    ...(t.colors ? ([["Colori sociali", t.colors]] as [string, string][]) : []),
    ...(t.venue
      ? ([
          [
            "Stadio",
            `${t.venue.name}${t.venue.city ? `, ${t.venue.city}` : ""}${t.venue.capacity ? ` (${t.venue.capacity.toLocaleString("it-IT")} posti)` : ""}`,
          ],
        ] as [string, string][])
      : []),
    ...(t.coach ? ([["Allenatore", `${t.coach.name}${t.coach.nationality ? ` (${t.coach.nationality})` : ""}`]] as [string, string][]) : []),
    ...(t.address ? ([["Sede", t.address]] as [string, string][]) : []),
    ...(t.website
      ? ([
          [
            "Sito ufficiale",
            <a href={t.website} target="_blank" rel="noopener noreferrer" className="text-action-text hover:text-action-text-hover">
              {t.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>,
          ],
        ] as [string, JSX.Element][])
      : []),
    ["Campionato", t.competition.name],
  ];
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <TeamBadge team={{ tla: t.tla, shortName: t.shortName, crest: t.crest }} size="lg" />
            {t.shortName}
          </span>
        }
        subtitle={`Società, rosa e statistiche stagione per stagione${t.name !== t.shortName ? ` di ${t.name}` : ""}.`}
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: "Squadre", to: "/calcio/squadre" },
          { label: t.shortName },
        ]}
        meta={cur?.record ? <span>{cur.label}: {cur.record.position}ª in {t.competition.name} con {cur.record.points} punti</span> : undefined}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card id="societa">
          <SectionTitle id="societa-titolo" icon={Building2}>
            La società
          </SectionTitle>
          <Facts rows={facts} />
        </Card>
        <Squad team={t} />
        <Card id="stagioni">
          <SectionTitle id="stagioni-titolo" icon={CalendarDays}>
            Stagione per stagione
          </SectionTitle>
          {t.seasons.length ? (
            t.seasons.map((s, i) => <Season key={s.season} s={s} open={i === 0} />)
          ) : (
            <p className="text-slate-400">Nessuna stagione nei dati.</p>
          )}
        </Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to={`/calcio/${t.competition.slug}/classifica`} className="inline-flex items-center gap-2 text-action-text hover:text-action-text-hover">
            <ListOrdered className="w-4 h-4" aria-hidden="true" />
            Classifica {t.competition.name}
          </Link>
          <Link to={`/calcio/${t.competition.slug}`} className="inline-flex items-center gap-2 text-action-text hover:text-action-text-hover">
            <Shield className="w-4 h-4" aria-hidden="true" />
            Partite di {t.competition.name}
          </Link>
          {hasResults(t.competition.slug) && (
            <Link to={resultsPath(t.competition.slug)} className="inline-flex items-center gap-2 text-action-text hover:text-action-text-hover">
              <ListChecks className="w-4 h-4" aria-hidden="true" />
              Risultati {t.competition.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
