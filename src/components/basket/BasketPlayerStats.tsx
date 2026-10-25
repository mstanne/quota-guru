// Box score of a finished NBA game (API-NBA data, see src/lib/matchDetails.ts): starting five, every player's line
// and team totals compared.
import { BarChart3, Users } from "lucide-react";
import type { BasketGame } from "../../lib/basket";
import { nbaTotals, type NbaDetails, type NbaPlayerLine, type Side } from "../../lib/matchDetails";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";
const pct = (m: number, a: number) => (a ? `${Math.round((m / a) * 1000) / 10}%`.replace(".", ",") : "–");
const shot = (m: number, a: number) => `${m}/${a}`;
const isStarter = (p: NbaPlayerLine) => !!p.pos;
const played = (p: NbaPlayerLine) => p.min != null && p.min !== "0" && p.min !== "0:00" && p.min !== "";

function Title({ id, icon: Icon, children }: { id: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-white text-xl mb-4">
      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
      {children}
    </h2>
  );
}

function TeamTable({ name, lines }: { name: string; lines: NbaPlayerLine[] }) {
  const rows = [...lines].filter(played).sort((a, b) => Number(isStarter(b)) - Number(isStarter(a)) || b.pts - a.pts);
  const t = nbaTotals(rows);
  const th = "text-right font-normal py-2 px-2 whitespace-nowrap";
  const td = "text-right px-2 py-2 tabular-nums whitespace-nowrap";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="text-left text-white mb-2">{name}</caption>
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal py-2 pr-2">
              Giocatore
            </th>
            <th scope="col" className={th}>MIN</th>
            <th scope="col" className={th}>PTS</th>
            <th scope="col" className={th}>RIM</th>
            <th scope="col" className={th}>AST</th>
            <th scope="col" className={th}>REC</th>
            <th scope="col" className={th}>STP</th>
            <th scope="col" className={th}>PP</th>
            <th scope="col" className={th}>TIRI</th>
            <th scope="col" className={th}>DA 3</th>
            <th scope="col" className={th}>LIBERI</th>
            <th scope="col" className={th}>+/-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={i} className="border-b border-slate-800">
              <th scope="row" className="text-left font-normal py-2 pr-2 text-white whitespace-nowrap">
                {p.name}
                {isStarter(p) && <span className="text-slate-400 text-xs ml-1.5">{p.pos}</span>}
              </th>
              <td className={`${td} text-slate-400`}>{p.min}</td>
              <td className={`${td} text-white font-semibold`}>{p.pts}</td>
              <td className={`${td} text-slate-300`}>{p.reb}</td>
              <td className={`${td} text-slate-300`}>{p.ast}</td>
              <td className={`${td} text-slate-300`}>{p.stl}</td>
              <td className={`${td} text-slate-300`}>{p.blk}</td>
              <td className={`${td} text-slate-300`}>{p.tov}</td>
              <td className={`${td} text-slate-300`}>{shot(p.fgm, p.fga)}</td>
              <td className={`${td} text-slate-300`}>{shot(p.tpm, p.tpa)}</td>
              <td className={`${td} text-slate-300`}>{shot(p.ftm, p.fta)}</td>
              <td className={`${td} text-slate-400`}>{p.pm == null ? "" : p.pm > 0 ? `+${p.pm}` : p.pm}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="text-left font-normal py-2 pr-2 text-slate-300">
              Totale
            </th>
            <td className={td} />
            <td className={`${td} text-white font-semibold`}>{t.pts}</td>
            <td className={`${td} text-white`}>{t.reb}</td>
            <td className={`${td} text-white`}>{t.ast}</td>
            <td className={`${td} text-white`}>{t.stl}</td>
            <td className={`${td} text-white`}>{t.blk}</td>
            <td className={`${td} text-white`}>{t.tov}</td>
            <td className={`${td} text-white`}>{shot(t.fgm, t.fga)}</td>
            <td className={`${td} text-white`}>{shot(t.tpm, t.tpa)}</td>
            <td className={`${td} text-white`}>{shot(t.ftm, t.fta)}</td>
            <td className={td} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function BasketPlayerStats({ game, details }: { game: BasketGame; details: NbaDetails }) {
  const name = (s: Side) => (s === "home" ? game.home.name : game.away.name);
  const short = (s: Side) => (s === "home" ? (game.home.shortName ?? game.home.name) : (game.away.shortName ?? game.away.name));
  const h = nbaTotals(details.players.home ?? []);
  const a = nbaTotals(details.players.away ?? []);
  const compare: [string, string, string, number, number][] = [
    ["Tiri dal campo", `${shot(h.fgm, h.fga)} (${pct(h.fgm, h.fga)})`, `${shot(a.fgm, a.fga)} (${pct(a.fgm, a.fga)})`, h.fgm / (h.fga || 1), a.fgm / (a.fga || 1)],
    ["Tiri da 3", `${shot(h.tpm, h.tpa)} (${pct(h.tpm, h.tpa)})`, `${shot(a.tpm, a.tpa)} (${pct(a.tpm, a.tpa)})`, h.tpm / (h.tpa || 1), a.tpm / (a.tpa || 1)],
    ["Tiri liberi", `${shot(h.ftm, h.fta)} (${pct(h.ftm, h.fta)})`, `${shot(a.ftm, a.fta)} (${pct(a.ftm, a.fta)})`, h.ftm / (h.fta || 1), a.ftm / (a.fta || 1)],
    ["Rimbalzi (offensivi)", `${h.reb} (${h.oreb})`, `${a.reb} (${a.oreb})`, h.reb, a.reb],
    ["Assist", String(h.ast), String(a.ast), h.ast, a.ast],
    ["Recuperi", String(h.stl), String(a.stl), h.stl, a.stl],
    ["Stoppate", String(h.blk), String(a.blk), h.blk, a.blk],
    ["Palle perse", String(h.tov), String(a.tov), -h.tov, -a.tov],
    ["Falli", String(h.pf), String(a.pf), -h.pf, -a.pf],
  ];
  const starters = (s: Side) => (details.players[s] ?? []).filter(isStarter);
  const hasFives = starters("home").length === 5 && starters("away").length === 5;
  return (
    <>
      <section className={card} aria-labelledby="statistiche-squadra">
        <Title id="statistiche-squadra" icon={BarChart3}>
          Statistiche di squadra
        </Title>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal py-2">
                {short("home")}
              </th>
              <th scope="col" className="font-normal py-2">
                <span className="sr-only">Statistica</span>
              </th>
              <th scope="col" className="text-right font-normal py-2">
                {short("away")}
              </th>
            </tr>
          </thead>
          <tbody>
            {compare.map(([label, hv, av, hn, an]) => (
              <tr key={label} className="border-b border-slate-800 last:border-0">
                <td className={`py-2.5 tabular-nums ${hn > an ? "text-white font-semibold" : "text-slate-300"}`}>{hv}</td>
                <th scope="row" className="py-2.5 text-center text-slate-400 font-normal">
                  {label}
                </th>
                <td className={`py-2.5 text-right tabular-nums ${an > hn ? "text-white font-semibold" : "text-slate-300"}`}>{av}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {hasFives && (
        <section className={card} aria-labelledby="quintetti">
          <Title id="quintetti" icon={Users}>
            Quintetti iniziali
          </Title>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            {(["home", "away"] as Side[]).map((s) => (
              <div key={s}>
                <p className="text-white mb-2">{name(s)}</p>
                <ul className="space-y-1 text-slate-300">
                  {starters(s).map((p, i) => (
                    <li key={i}>
                      <span className="inline-block w-8 text-slate-400">{p.pos}</span>
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={card} aria-labelledby="statistiche-giocatori">
        <Title id="statistiche-giocatori" icon={Users}>
          Statistiche dei giocatori
        </Title>
        <div className="space-y-8">
          <TeamTable name={name("home")} lines={details.players.home ?? []} />
          <TeamTable name={name("away")} lines={details.players.away ?? []} />
        </div>
        <p className="text-slate-400 text-xs mt-4">
          RIM rimbalzi · AST assist · REC recuperi · STP stoppate · PP palle perse · tiri realizzati/tentati. Dati
          API-NBA.
        </p>
      </section>
    </>
  );
}
