// /basket/nba/squadre/:squadra — roster and season-by-season statistics of an NBA team.
import { useParams } from "react-router";
import { Building2, CalendarDays, Users } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { NotFoundPage } from "../NotFoundPage";
import { usePageMeta } from "../../lib/pageMeta";
import { nbaTeam, type NbaTeam } from "../../lib/teams";
import { nbaTeamMeta } from "../../lib/teamMeta";
import { Card, Facts, SectionTitle, age, num } from "./TeamUi";
import { gameHref, isGameLive, isGameUpcoming, nbaGames } from "../../lib/basket";
import { NextMatches } from "./NextMatches";

const pct = (m: number, a: number) => (a ? `${num((m / a) * 100)}%` : "–");

function Roster({ team }: { team: NbaTeam }) {
  if (!team.roster.length) return null;
  const cur = team.seasons.find((s) => s.current);
  return (
    <Card id="roster">
      <SectionTitle id="roster-titolo" icon={Users}>
        Roster {cur?.label ?? ""}
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-right font-normal py-2 pr-3">#</th>
              <th scope="col" className="text-left font-normal py-2">Giocatore</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Ruolo</th>
              <th scope="col" className="text-right font-normal py-2 px-2">Età</th>
              <th scope="col" className="text-right font-normal py-2 px-2">Altezza</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Paese</th>
              <th scope="col" className="text-left font-normal py-2 px-2">College</th>
            </tr>
          </thead>
          <tbody>
            {team.roster.map((p) => (
              <tr key={p.name} className="border-b border-slate-800 last:border-0">
                <td className="text-right pr-3 py-2 tabular-nums text-slate-400">{p.number ?? ""}</td>
                <th scope="row" className="text-left font-normal py-2 text-white whitespace-nowrap">{p.name}</th>
                <td className="px-2 text-slate-300">{p.pos ?? ""}</td>
                <td className="text-right px-2 tabular-nums text-slate-300">{p.born ? age(p.born) : ""}</td>
                <td className="text-right px-2 tabular-nums text-slate-300">{p.height ? `${num(p.height, 2)} m` : ""}</td>
                <td className="px-2 text-slate-300">{p.country ?? ""}</td>
                <td className="px-2 text-slate-400">{p.college ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Season({ s, open }: { s: NbaTeam["seasons"][number]; open: boolean }) {
  const r = s.record;
  const th = "text-right font-normal py-2 px-2 whitespace-nowrap";
  const td = "text-right px-2 py-2 tabular-nums";
  return (
    <details open={open} className="border-b border-slate-800 last:border-0 py-4">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
        <h3 className="text-white text-lg">
          Stagione {s.label}
          {s.current && <span className="text-slate-400 text-sm ml-2">in corso</span>}
        </h3>
        {r && (
          <span className="text-slate-300 text-sm tabular-nums">
            {r.won}-{r.lost}
          </span>
        )}
      </summary>
      <div className="mt-4">
        {r && (
          <Facts
            rows={[
              ["Record (stagione regolare)", `${r.won} vinte, ${r.lost} perse`],
              ["Posizione nella NBA per vittorie", `${r.position}ª di ${r.size}`],
              ["Punti fatti a partita", r.played ? num((r.pf ?? 0) / r.played) : "–"],
              ["Punti subiti a partita", r.played ? num((r.pa ?? 0) / r.played) : "–"],
              ...(r.home && r.away
                ? ([
                    ["In casa", `${r.home.won}-${r.home.lost}`],
                    ["In trasferta", `${r.away.won}-${r.away.lost}`],
                  ] as [string, string][])
                : []),
            ]}
          />
        )}
        {s.players && s.players.length > 0 && (
          <div className="overflow-x-auto mt-5">
            <table className="w-full text-sm">
              <caption className="text-left text-slate-300 mb-2">Medie a partita dei giocatori</caption>
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="text-left font-normal py-2 pr-2">Giocatore</th>
                  <th scope="col" className={th}>Partite</th>
                  <th scope="col" className={th}>Min</th>
                  <th scope="col" className={th}>Punti</th>
                  <th scope="col" className={th}>Rimb.</th>
                  <th scope="col" className={th}>Assist</th>
                  <th scope="col" className={th}>Rec.</th>
                  <th scope="col" className={th}>Stopp.</th>
                  <th scope="col" className={th}>Tiri</th>
                  <th scope="col" className={th}>Da 3</th>
                  <th scope="col" className={th}>Liberi</th>
                </tr>
              </thead>
              <tbody>
                {s.players.map((p) => (
                  <tr key={p.name} className="border-b border-slate-800 last:border-0">
                    <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">{p.name}</th>
                    <td className={`${td} text-slate-300`}>{p.g}</td>
                    <td className={`${td} text-slate-300`}>{num(p.min / p.g)}</td>
                    <td className={`${td} text-white font-semibold`}>{num(p.pts / p.g)}</td>
                    <td className={`${td} text-slate-300`}>{num(p.reb / p.g)}</td>
                    <td className={`${td} text-slate-300`}>{num(p.ast / p.g)}</td>
                    <td className={`${td} text-slate-300`}>{num(p.stl / p.g)}</td>
                    <td className={`${td} text-slate-300`}>{num(p.blk / p.g)}</td>
                    <td className={`${td} text-slate-300`}>{pct(p.fgm, p.fga)}</td>
                    <td className={`${td} text-slate-300`}>{pct(p.tpm, p.tpa)}</td>
                    <td className={`${td} text-slate-300`}>{pct(p.ftm, p.fta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-slate-400 text-xs mt-2">Statistiche dei giocatori: dati API-NBA.</p>
          </div>
        )}
      </div>
    </details>
  );
}

export function NbaTeamPage() {
  const { squadra } = useParams();
  const t = nbaTeam(squadra);
  if (t instanceof Promise) throw t; // data still loading (Suspense)
  usePageMeta(t ? nbaTeamMeta(t) : null);
  if (!t) return <NotFoundPage />;
  const cur = t.seasons.find((s) => s.current);
  const next = nbaGames
    .filter((g) => (isGameUpcoming(g) || isGameLive(g)) && (g.home.id === t.id || g.away.id === t.id))
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, 3)
    .map((g) => ({
      id: g.id,
      href: gameHref(g),
      home: g.home.shortName || g.home.name,
      away: g.away.shortName || g.away.name,
      utcDate: g.utcDate,
      live: isGameLive(g),
    }));
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={t.name}
        subtitle="Roster e statistiche stagione per stagione."
        breadcrumb={[
          { label: "Basket", to: "/basket" },
          { label: "NBA", to: "/pronostici/nba" },
          { label: "Squadre", to: "/basket/nba/squadre" },
          { label: t.shortName },
        ]}
        meta={cur?.record ? <span>Stagione {cur.label}: {cur.record.won}-{cur.record.lost}</span> : undefined}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card id="squadra">
          <SectionTitle id="squadra-titolo" icon={Building2}>
            La squadra
          </SectionTitle>
          <Facts
            rows={[
              ["Nome", t.name],
              ...(t.city ? ([["Città", t.city]] as [string, string][]) : []),
              ["Sigla", t.abbr],
              ["Lega", "NBA"],
            ]}
          />
        </Card>
        <NextMatches team={t.name} matches={next} label="NBA: probabilità di vittoria calcolate dal modello statistico." />
        <Roster team={t} />
        <Card id="stagioni">
          <SectionTitle id="stagioni-titolo" icon={CalendarDays}>
            Stagione per stagione
          </SectionTitle>
          {t.seasons.map((s, i) => (
            <Season key={s.season} s={s} open={i === 0} />
          ))}
        </Card>
        <Link to="/pronostici/nba" className="text-sm text-action-text hover:text-action-text-hover">
          Calendario e risultati NBA
        </Link>
      </div>
    </div>
  );
}
