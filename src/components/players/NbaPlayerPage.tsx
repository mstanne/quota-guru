// /basket/nba/giocatori/:giocatore – an NBA player: profile, current season (averages, shooting, per 36 minutes, best
// games, home/away), last games and season-by-season averages (API-NBA data, built by scripts/derive-nba-players.mjs).
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { Activity, CalendarDays, House, Trophy, User } from "lucide-react";
import { Link } from "../../lib/links";
import { usePageMeta } from "../../lib/pageMeta";
import { nbaPlayer, nbaPlayerMeta, type NbaBest, type NbaPlayer, type NbaTeamRef, type NbaTotals } from "../../lib/nbaPlayers";
import { teamPaths } from "../../lib/teams";
import { NotFoundPage } from "../NotFoundPage";
import { PageHeader } from "../layout/PageHeader";
import { Card, Facts, SectionTitle, age, formatDate, num } from "../teams/TeamUi";

const th = "text-right font-normal py-2 px-2 whitespace-nowrap";
const td = "text-right px-2 py-2 tabular-nums";
const avg = (v: number, g: number) => (g ? num(v / g) : "–");
const pct = (m: number, a: number) => (a ? `${num((m / a) * 100)}%` : "–");
const per36 = (v: number, min: number) => (min >= 36 ? num((v * 36) / min) : "–");
const dayFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" });

function TeamName({ team }: { team: NbaTeamRef }) {
  return team.slug ? (
    <Link to={`${teamPaths.nba}/${team.slug}`} className="text-slate-200 hover:text-white">
      {team.shortName}
    </Link>
  ) : (
    <span className="text-slate-200">{team.shortName}</span>
  );
}

export function NbaPlayerPage() {
  const { giocatore } = useParams();
  const p = nbaPlayer(giocatore);
  if (p instanceof Promise) throw p; // data still loading (Suspense)
  usePageMeta(p ? nbaPlayerMeta(p) : null);
  if (!p) return <NotFoundPage />;

  const teamHref = `${teamPaths.nba}/${p.team.slug}`;
  const facts: [string, ReactNode][] = [
    // jersey 0 and 00 exist in the NBA: only a missing number is left out
    ...(p.number != null && String(p.number) !== "" ? ([["Numero di maglia", String(p.number)]] as [string, string][]) : []),
    ...(p.position ? ([["Ruolo", p.position]] as [string, string][]) : []),
    ...(p.born ? ([["Data di nascita", `${formatDate(p.born)} (${age(p.born)} anni)`]] as [string, string][]) : []),
    ...(p.country ? ([["Paese", p.country]] as [string, string][]) : []),
    ...(p.height ? ([["Altezza", `${num(p.height, 2)} m`]] as [string, string][]) : []),
    ...(p.weight ? ([["Peso", `${Math.round(p.weight)} kg`]] as [string, string][]) : []),
    ...(p.college ? ([["College", p.college]] as [string, string][]) : []),
    ...(p.nbaStart ? ([["Esordio in NBA", String(p.nbaStart)]] as [string, string][]) : []),
    ...(p.pro != null ? ([["Stagioni da professionista", String(p.pro)]] as [string, string][]) : []),
    [
      "Squadra",
      <Link key="t" to={teamHref} className="text-action-text hover:text-action-text-hover">
        {p.team.shortName}
      </Link>,
    ],
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={User}
        title={p.name}
        subtitle={[p.position, p.team.shortName, "NBA"].filter(Boolean).join(" · ")}
        breadcrumb={[
          { label: "Squadre NBA", to: teamPaths.nba },
          { label: p.team.shortName, to: teamHref },
          { label: p.name },
        ]}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card id="profilo">
          <SectionTitle id="profilo-titolo" icon={User}>
            Profilo
          </SectionTitle>
          <Facts rows={facts} />
        </Card>
        {p.current && <Season p={p} c={p.current} />}
        {p.current && <Best c={p.current} />}
        {p.current && p.current.last.length > 0 && <LastGames c={p.current} />}
        {p.current?.homeAway && <HomeAway c={p.current} />}
        {p.seasons.length > 0 && <Career p={p} />}
      </div>
    </div>
  );
}

function Season({ p, c }: { p: NbaPlayer; c: NonNullable<NbaPlayer["current"]> }) {
  const t = c.totals;
  const tiles: [string, string][] = [
    ["Partite", String(t.g)],
    ["Minuti", avg(t.min, t.g)],
    ["Punti", avg(t.pts, t.g)],
    ["Rimbalzi", avg(t.reb, t.g)],
    ["Assist", avg(t.ast, t.g)],
    ["Recuperi", avg(t.stl, t.g)],
  ];
  const more: [string, string][] = [
    ["Stoppate", avg(t.blk, t.g)],
    ["Palle perse", avg(t.tov, t.g)],
    ["Tiri dal campo", pct(t.fgm, t.fga)],
    ["Tiri da 3", pct(t.tpm, t.tpa)],
    ["Tiri liberi", pct(t.ftm, t.fta)],
    ["Rimbalzi off./dif.", `${avg(t.oreb, t.g)} / ${avg(t.dreb, t.g)}`],
  ];
  const p36: [string, string][] = [
    ["Punti", per36(t.pts, t.min)],
    ["Rimbalzi", per36(t.reb, t.min)],
    ["Assist", per36(t.ast, t.min)],
    ["Recuperi", per36(t.stl, t.min)],
    ["Stoppate", per36(t.blk, t.min)],
    ["Palle perse", per36(t.tov, t.min)],
  ];
  const grid = (rows: [string, string][], big: boolean) => (
    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {rows.map(([label, v]) => (
        <div key={label}>
          <dt className="text-slate-400 text-xs">{label}</dt>
          <dd className={`${big ? "text-white text-2xl" : "text-slate-200 text-lg"} tabular-nums`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <Card id="stagione">
      <SectionTitle id="stagione-titolo" icon={Activity}>
        Stagione {c.label}: medie a partita
      </SectionTitle>
      {grid(tiles, true)}
      <div className="mt-5 border-t border-slate-800 pt-4">{grid(more, false)}</div>
      <h3 className="text-slate-300 text-sm font-semibold mt-6 mb-2">Ogni 36 minuti</h3>
      {grid(p36, false)}
      <p className="text-slate-400 text-xs mt-3">
        Regular season e playoff della stagione {c.label}
        {c.byTeam ? "" : ` con i ${p.team.shortName}`}. I valori ogni 36 minuti compaiono dopo almeno 36 minuti giocati.
      </p>
      {c.byTeam && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left text-slate-300 mb-2">Per squadra</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal py-2 pr-2">Squadra</th>
                <th scope="col" className={th}>Partite</th>
                <th scope="col" className={th}>Min</th>
                <th scope="col" className={th}>Punti</th>
                <th scope="col" className={th}>Rimb.</th>
                <th scope="col" className={th}>Assist</th>
              </tr>
            </thead>
            <tbody>
              {c.byTeam.map((s) => (
                <tr key={s.team.id} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="text-left font-normal py-2 pr-2 whitespace-nowrap">
                    <TeamName team={s.team} />
                  </th>
                  <td className={`${td} text-slate-300`}>{s.g}</td>
                  <td className={`${td} text-slate-300`}>{avg(s.min, s.g)}</td>
                  <td className={`${td} text-white font-semibold`}>{avg(s.pts, s.g)}</td>
                  <td className={`${td} text-slate-300`}>{avg(s.reb, s.g)}</td>
                  <td className={`${td} text-slate-300`}>{avg(s.ast, s.g)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Best({ c }: { c: NonNullable<NbaPlayer["current"]> }) {
  const rows: [string, NbaBest | null][] = [
    ["Punti", c.best.pts],
    ["Rimbalzi", c.best.reb],
    ["Assist", c.best.ast],
    ["Triple", c.best.tpm],
  ];
  const shown = rows.filter((r): r is [string, NbaBest] => r[1] != null);
  if (!shown.length) return null;
  return (
    <Card id="migliori-prestazioni">
      <SectionTitle id="migliori-prestazioni-titolo" icon={Trophy}>
        Migliori prestazioni {c.label}
      </SectionTitle>
      <dl className="text-sm grid gap-x-8 sm:grid-cols-2">
        {shown.map(([label, b]) => (
          <div key={label} className="flex justify-between gap-4 py-2 border-b border-slate-800">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-right">
              <span className="text-white font-semibold tabular-nums">{b.value}</span>{" "}
              <span className="text-slate-400">
                contro{" "}
                {b.path ? (
                  <Link to={b.path} className="text-action-text hover:text-action-text-hover">
                    {b.opponent}
                  </Link>
                ) : (
                  b.opponent
                )}
                , {dayFmt.format(new Date(b.date))}
              </span>
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-2 border-b border-slate-800">
          <dt className="text-slate-400">Doppie doppie</dt>
          <dd className="text-white tabular-nums">{c.doubleDoubles}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2 border-b border-slate-800">
          <dt className="text-slate-400">Triple doppie</dt>
          <dd className="text-white tabular-nums">{c.tripleDoubles}</dd>
        </div>
      </dl>
      <p className="text-slate-400 text-xs mt-3">Dalle partite della stagione con il tabellino del giocatore.</p>
    </Card>
  );
}

function LastGames({ c }: { c: NonNullable<NbaPlayer["current"]> }) {
  const signed = (n: number | null) => (n == null ? "–" : n > 0 ? `+${n}` : String(n));
  return (
    <Card id="ultime-partite">
      <SectionTitle id="ultime-partite-titolo" icon={CalendarDays}>
        Ultime partite
      </SectionTitle>
      <p className="text-slate-400 text-xs mb-2">Le partite più recenti della stagione {c.label} in cui è sceso in campo.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Ultime partite della stagione {c.label}</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-2 pr-2">Data</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Partita</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Risultato</th>
              <th scope="col" className={th}>Min</th>
              <th scope="col" className={th}>Punti</th>
              <th scope="col" className={th}>Rimb.</th>
              <th scope="col" className={th}>Assist</th>
              <th scope="col" className={th}>Tiri</th>
              <th scope="col" className={th}>Da 3</th>
              <th scope="col" className={th}>+/-</th>
            </tr>
          </thead>
          <tbody>
            {c.last.map((g) => {
              const won = g.score[0] > g.score[1];
              const score = `${g.score[0]}-${g.score[1]}`;
              return (
                <tr key={g.id} className="border-b border-slate-800 last:border-0">
                  <td className="text-left py-2 pr-2 text-slate-300 whitespace-nowrap tabular-nums">{dayFmt.format(new Date(g.date))}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className="text-slate-400">{g.home ? "vs " : "@ "}</span>
                    <TeamName team={g.opponent} />
                    {g.post && <span className="block text-slate-400 text-xs">Playoff</span>}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                    {g.path ? (
                      <Link to={g.path} className="text-action-text hover:text-action-text-hover">
                        {score}
                      </Link>
                    ) : (
                      <span className="text-slate-200">{score}</span>
                    )}
                    <span className="sr-only">{won ? " vittoria" : " sconfitta"}</span>
                    <span aria-hidden="true" className="ml-1.5 text-xs text-slate-400">
                      {won ? "V" : "P"}
                    </span>
                  </td>
                  <td className={`${td} text-slate-300`}>{g.min}</td>
                  <td className={`${td} text-white font-semibold`}>{g.pts}</td>
                  <td className={`${td} text-slate-300`}>{g.reb}</td>
                  <td className={`${td} text-slate-300`}>{g.ast}</td>
                  <td className={`${td} text-slate-300`}>{`${g.fgm}/${g.fga}`}</td>
                  <td className={`${td} text-slate-300`}>{`${g.tpm}/${g.tpa}`}</td>
                  <td className={`${td} text-slate-300`}>{signed(g.pm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-3">Risultato dal punto di vista della sua squadra: V vittoria, P sconfitta.</p>
    </Card>
  );
}

function HomeAway({ c }: { c: NonNullable<NbaPlayer["current"]> }) {
  const sides: [string, NbaTotals | null | undefined][] = [
    ["In casa", c.homeAway?.home],
    ["In trasferta", c.homeAway?.away],
  ];
  return (
    <Card id="casa-trasferta">
      <SectionTitle id="casa-trasferta-titolo" icon={House}>
        In casa e in trasferta
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-2 pr-2">
                <span className="sr-only">Campo</span>
              </th>
              <th scope="col" className={th}>Partite</th>
              <th scope="col" className={th}>Min</th>
              <th scope="col" className={th}>Punti</th>
              <th scope="col" className={th}>Rimb.</th>
              <th scope="col" className={th}>Assist</th>
              <th scope="col" className={th}>Tiri</th>
            </tr>
          </thead>
          <tbody>
            {sides.map(([label, s]) => (
              <tr key={label} className="border-b border-slate-800 last:border-0">
                <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                  {label}
                </th>
                <td className={`${td} text-slate-300`}>{s?.g ?? 0}</td>
                <td className={`${td} text-slate-300`}>{s ? avg(s.min, s.g) : "–"}</td>
                <td className={`${td} text-white font-semibold`}>{s ? avg(s.pts, s.g) : "–"}</td>
                <td className={`${td} text-slate-300`}>{s ? avg(s.reb, s.g) : "–"}</td>
                <td className={`${td} text-slate-300`}>{s ? avg(s.ast, s.g) : "–"}</td>
                <td className={`${td} text-slate-300`}>{s ? pct(s.fgm, s.fga) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-3">Medie a partita, regular season {c.label}.</p>
    </Card>
  );
}

function Career({ p }: { p: NbaPlayer }) {
  return (
    <Card id="stagioni">
      <SectionTitle id="stagioni-titolo" icon={User}>
        Carriera: medie stagione per stagione
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-2 pr-2">Stagione</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Squadra</th>
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
            {p.seasons.map((s) => (
              <tr key={`${s.season}-${s.team.id}`} className="border-b border-slate-800 last:border-0">
                <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                  {s.label}
                </th>
                <td className="px-2 py-2 whitespace-nowrap">
                  <TeamName team={s.team} />
                </td>
                <td className={`${td} text-slate-300`}>{s.g}</td>
                <td className={`${td} text-slate-300`}>{avg(s.min, s.g)}</td>
                <td className={`${td} text-white font-semibold`}>{avg(s.pts, s.g)}</td>
                <td className={`${td} text-slate-300`}>{avg(s.reb, s.g)}</td>
                <td className={`${td} text-slate-300`}>{avg(s.ast, s.g)}</td>
                <td className={`${td} text-slate-300`}>{avg(s.stl, s.g)}</td>
                <td className={`${td} text-slate-300`}>{avg(s.blk, s.g)}</td>
                <td className={`${td} text-slate-300`}>{pct(s.fgm, s.fga)}</td>
                <td className={`${td} text-slate-300`}>{pct(s.tpm, s.tpa)}</td>
                <td className={`${td} text-slate-300`}>{pct(s.ftm, s.fta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-3">
        Le stagioni scaricate finora (la stagione in corso e la precedente). Statistiche: dati API-NBA.
      </p>
    </Card>
  );
}
