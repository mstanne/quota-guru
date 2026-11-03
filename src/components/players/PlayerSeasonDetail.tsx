// Current season of a player page: key figures and per-90 values, split by competition, detailed statistics by area
// (ordered by the player's role), last matches and home/away figures. Data built by scripts/derive-players.mjs.
import type { ReactNode } from "react";
import { Activity, CalendarDays, House, ListChecks } from "lucide-react";
import { Link } from "../../lib/links";
import type { FootballPlayer, PlayerCurrent, PlayerDetail, PlayerSide } from "../../lib/players";
import { teamPaths } from "../../lib/teams";
import { Card, SectionTitle, num } from "../teams/TeamUi";

const th = "text-right font-normal py-2 px-2 whitespace-nowrap";
const td = "text-right px-2 py-2 tabular-nums";

/** Value every 90 minutes (needs at least 90 minutes played). */
const per90 = (v: number, min: number) => (min >= 90 ? num((v * 90) / min, 2) : "–");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");
const ratio = (a: number, b: number) => (b > 0 ? `${a} su ${b} (${pct(a, b)})` : String(a));

export function PlayerSeasonDetail({ player }: { player: FootballPlayer }) {
  const c = player.current;
  if (!c) return null;
  return (
    <>
      <SeasonSummary c={c} />
      {c.detail && <SeasonDetail c={c} d={c.detail} position={player.position} />}
      {c.last.length > 0 && <LastMatches c={c} />}
      {c.homeAway && <HomeAway c={c} />}
    </>
  );
}

function SeasonSummary({ c }: { c: PlayerCurrent }) {
  const t = c.totals;
  const tiles: [string, ReactNode][] = [
    ["Presenze", `${t.apps}`],
    ["Da titolare", `${t.starts}`],
    ["Minuti", `${t.min}`],
    ["Gol", `${t.goals}`],
    ["Assist", `${t.assists}`],
    ["Voto medio", t.rating != null ? num(t.rating, 2) : "–"],
  ];
  const rates: [string, string][] = [
    ["Gol ogni 90'", per90(t.goals, t.min)],
    ["Assist ogni 90'", per90(t.assists, t.min)],
    ["Gol + assist ogni 90'", per90(t.goals + t.assists, t.min)],
    ["Minuti per gol", t.goals ? String(Math.round(t.min / t.goals)) : "–"],
    ["Minuti a partita", t.apps ? String(Math.round(t.min / t.apps)) : "–"],
  ];
  if (c.detail) rates.splice(3, 0, ["Tiri ogni 90'", per90(c.detail.shots, t.min)]);
  return (
    <Card id="stagione">
      <SectionTitle id="stagione-titolo" icon={Activity}>
        Stagione {c.label}
      </SectionTitle>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {tiles.map(([label, v]) => (
          <div key={label}>
            <dt className="text-slate-400 text-xs">{label}</dt>
            <dd className="text-white text-2xl tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-slate-800 pt-4">
        {rates.map(([label, v]) => (
          <div key={label}>
            <dt className="text-slate-400 text-xs">{label}</dt>
            <dd className="text-slate-200 text-lg tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-slate-400 text-xs mt-3">
        Tutte le competizioni con il {c.team.shortName}. I valori ogni 90 minuti compaiono dopo almeno 90 minuti giocati.
      </p>

      {c.byComp && c.byComp.length > 1 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left text-slate-300 mb-2">Per competizione</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal py-2 pr-2">Competizione</th>
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
              {c.byComp.map((s) => (
                <tr key={`${s.leagueId}-${s.league}`} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                    {s.league}
                  </th>
                  <td className={`${td} text-slate-300`}>{s.apps}</td>
                  <td className={`${td} text-slate-300`}>{s.starts}</td>
                  <td className={`${td} text-slate-300`}>{s.min}</td>
                  <td className={`${td} text-white font-semibold`}>{s.goals}</td>
                  <td className={`${td} text-slate-300`}>{s.assists}</td>
                  <td className={`${td} text-slate-300`}>{s.yellow}</td>
                  <td className={`${td} text-slate-300`}>{s.red}</td>
                  <td className={`${td} text-slate-300`}>{s.rating != null ? num(s.rating, 2) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

type Group = { key: string; title: string; rows: [string, string][]; shown: boolean };

function SeasonDetail({ c, d, position }: { c: PlayerCurrent; d: PlayerDetail; position: string | null }) {
  const min = c.totals.min;
  const cards = c.totals.yellow + c.totals.red;
  const penTaken = d.penScored + d.penMissed;
  const groups: Group[] = [
    {
      key: "porta",
      title: "Porta",
      shown: position === "Portiere" || d.saves > 0,
      rows: [
        ["Parate", `${d.saves} (${per90(d.saves, min)} ogni 90')`],
        ["Gol subiti", `${d.conceded} (${per90(d.conceded, min)} ogni 90')`],
        ["Rigori parati", String(d.penSaved)],
      ],
    },
    {
      key: "attacco",
      title: "Attacco",
      shown: d.shots + c.totals.goals + penTaken + d.penWon > 0,
      rows: [
        ["Tiri", `${d.shots} (${per90(d.shots, min)} ogni 90')`],
        ["Tiri in porta", ratio(d.shotsOn, d.shots)],
        ["Gol su tiri", d.shots ? pct(c.totals.goals, d.shots) : "–"],
        ["Rigori segnati", penTaken ? ratio(d.penScored, penTaken) : "0"],
        ["Rigori procurati", String(d.penWon)],
      ],
    },
    {
      key: "costruzione",
      title: "Costruzione",
      shown: d.passes + d.keyPasses + d.dribbles > 0,
      rows: [
        ["Passaggi", `${d.passes} (${per90(d.passes, min)} ogni 90')`],
        ["Passaggi chiave", `${d.keyPasses} (${per90(d.keyPasses, min)} ogni 90')`],
        ["Dribbling riusciti", ratio(d.dribblesOk, d.dribbles)],
      ],
    },
    {
      key: "difesa",
      title: "Difesa",
      shown: d.tackles + d.interceptions + d.blocks + d.duels > 0,
      rows: [
        ["Contrasti", `${d.tackles} (${per90(d.tackles, min)} ogni 90')`],
        ["Intercetti", `${d.interceptions} (${per90(d.interceptions, min)} ogni 90')`],
        ["Tiri respinti", String(d.blocks)],
        ["Duelli vinti", ratio(d.duelsWon, d.duels)],
      ],
    },
    {
      key: "disciplina",
      title: "Disciplina",
      shown: true,
      rows: [
        ["Falli commessi", String(d.fouls)],
        ["Falli subiti", String(d.foulsDrawn)],
        ["Cartellini", `${c.totals.yellow} gialli, ${c.totals.red} rossi`],
        ["Cartellini ogni 90'", per90(cards, min)],
        ["Rigori causati", String(d.penCommitted)],
      ],
    },
  ];
  // the areas that matter most for the player's role come first
  const order: Record<string, string[]> = {
    Portiere: ["porta", "costruzione", "difesa", "disciplina", "attacco"],
    Difensore: ["difesa", "costruzione", "attacco", "disciplina", "porta"],
    Centrocampista: ["costruzione", "difesa", "attacco", "disciplina", "porta"],
  };
  const keys = order[position ?? ""] ?? ["attacco", "costruzione", "difesa", "disciplina", "porta"];
  const shown = keys.map((k) => groups.find((g) => g.key === k)!).filter((g) => g.shown);
  const subs = d.subIn || d.subOut || d.bench;

  return (
    <Card id="rendimento">
      <SectionTitle id="rendimento-titolo" icon={ListChecks}>
        Rendimento {c.label}
      </SectionTitle>
      <div className="grid gap-6 md:grid-cols-2">
        {shown.map((g) => (
          <div key={g.key}>
            <h3 className="text-slate-300 text-sm font-semibold mb-1">{g.title}</h3>
            <dl className="text-sm">
              {g.rows.map(([label, v]) => (
                <div key={label} className="flex justify-between gap-4 py-2 border-b border-slate-800">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="text-white text-right tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {subs > 0 && (
        <p className="text-slate-400 text-sm mt-4">
          Entrato dalla panchina {d.subIn} volte, sostituito {d.subOut} volte, in panchina senza entrare {d.bench} volte.
        </p>
      )}
      <p className="text-slate-400 text-xs mt-3">Tutte le competizioni della stagione. Dati API-Football.</p>
    </Card>
  );
}

const dayFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" });

function LastMatches({ c }: { c: PlayerCurrent }) {
  const keeper = c.last.some((m) => m.saves > 0 || m.conceded > 0);
  return (
    <Card id="ultime-partite">
      <SectionTitle id="ultime-partite-titolo" icon={CalendarDays}>
        Ultime partite
      </SectionTitle>
      <p className="text-slate-400 text-xs mb-2">
        Le partite più recenti della stagione {c.label} in cui è sceso in campo, campionato e coppe.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Ultime partite della stagione {c.label}</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-2 pr-2">Data</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Partita</th>
              <th scope="col" className="text-left font-normal py-2 px-2">Risultato</th>
              <th scope="col" className={th}>Min.</th>
              {keeper ? (
                <>
                  <th scope="col" className={th}>Parate</th>
                  <th scope="col" className={th}>Gol sub.</th>
                </>
              ) : (
                <>
                  <th scope="col" className={th}>Gol</th>
                  <th scope="col" className={th}>Assist</th>
                  <th scope="col" className={th}>Tiri</th>
                </>
              )}
              <th scope="col" className={th}>Voto</th>
            </tr>
          </thead>
          <tbody>
            {c.last.map((m) => {
              const [gf, ga] = m.score;
              const res = gf == null || ga == null ? null : gf > ga ? "V" : gf < ga ? "P" : "N";
              const score = gf == null || ga == null ? "–" : `${gf}-${ga}`;
              const opp = m.opponent.slug ? (
                <Link to={`${teamPaths.football}/${m.opponent.slug}`} className="text-slate-200 hover:text-white">
                  {m.opponent.name}
                </Link>
              ) : (
                <span className="text-slate-200">{m.opponent.name}</span>
              );
              return (
                <tr key={m.id} className="border-b border-slate-800 last:border-0">
                  <td className="text-left py-2 pr-2 text-slate-300 whitespace-nowrap tabular-nums">{dayFmt.format(new Date(m.date))}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className="text-slate-400">{m.home ? "vs " : "@ "}</span>
                    {opp}
                    {m.competition && <span className="block text-slate-400 text-xs">{m.competition}</span>}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                    {m.path ? (
                      <Link to={m.path} className="text-action-text hover:text-action-text-hover">
                        {score}
                      </Link>
                    ) : (
                      <span className="text-slate-200">{score}</span>
                    )}
                    {res && <span className="sr-only">{res === "V" ? " vittoria" : res === "P" ? " sconfitta" : " pareggio"}</span>}
                    {res && (
                      <span aria-hidden="true" className="ml-1.5 text-xs text-slate-400">
                        {res}
                      </span>
                    )}
                  </td>
                  <td className={`${td} text-slate-300`}>
                    {m.min}
                    {!m.starter && <span className="text-slate-400 text-xs" title="Entrato dalla panchina"> (s)</span>}
                  </td>
                  {keeper ? (
                    <>
                      <td className={`${td} text-slate-300`}>{m.saves}</td>
                      <td className={`${td} text-slate-300`}>{m.conceded}</td>
                    </>
                  ) : (
                    <>
                      <td className={`${td} text-white font-semibold`}>{m.goals}</td>
                      <td className={`${td} text-slate-300`}>{m.assists}</td>
                      <td className={`${td} text-slate-300`}>{m.shots}</td>
                    </>
                  )}
                  <td className={`${td} text-slate-300`}>{m.rating != null ? num(m.rating, 1) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-3">
        (s) = entrato dalla panchina. Risultato dal punto di vista della sua squadra: V vittoria, N pareggio, P sconfitta.
      </p>
    </Card>
  );
}

function HomeAway({ c }: { c: PlayerCurrent }) {
  const sides: [string, PlayerSide | null | undefined][] = [
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
              <th scope="col" className={th}>Pres.</th>
              <th scope="col" className={th}>Minuti</th>
              <th scope="col" className={th}>Gol</th>
              <th scope="col" className={th}>Assist</th>
              <th scope="col" className={th}>G+A ogni 90'</th>
              <th scope="col" className={th}>Voto</th>
            </tr>
          </thead>
          <tbody>
            {sides.map(([label, s]) => (
              <tr key={label} className="border-b border-slate-800 last:border-0">
                <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                  {label}
                </th>
                <td className={`${td} text-slate-300`}>{s?.apps ?? 0}</td>
                <td className={`${td} text-slate-300`}>{s?.min ?? 0}</td>
                <td className={`${td} text-white font-semibold`}>{s?.goals ?? 0}</td>
                <td className={`${td} text-slate-300`}>{s?.assists ?? 0}</td>
                <td className={`${td} text-slate-300`}>{s ? per90(s.goals + s.assists, s.min) : "–"}</td>
                <td className={`${td} text-slate-300`}>{s?.rating != null ? num(s.rating, 2) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-400 text-xs mt-3">Partite della stagione {c.label} con i dati di ogni giocatore.</p>
    </Card>
  );
}
