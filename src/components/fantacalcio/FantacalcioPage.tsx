// /fantacalcio — fantasy football advice for the next round of Serie A: every player by role, ordered by expected
// bonus, with start chance, goal, assist, clean sheet and booking chances (src/lib/fantacalcio.ts).
import { useState } from "react";
import { Shirt, Scale } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { TeamName } from "../teams/TeamLink";
import { usePageMeta } from "../../lib/pageMeta";
import { paths } from "../../routes";
import { formatDay, formatTime } from "../../lib/footballCore";
import {
  ROLES,
  chiSchierarePath,
  deadlineText,
  fanta,
  fantaMeta,
  fmtBonus,
  hasFanta,
  playersOf,
  playsLikely,
  type Role,
} from "../../lib/fantacalcio";
import { Band, Fixture, PlayerName, pc } from "./FantaUi";

const SHOWN = 20;
const th = "text-right font-normal px-2 py-3 whitespace-nowrap";
const td = "text-right px-2 tabular-nums";

function RoleTable({ role, onlyLikely }: { role: (typeof ROLES)[number]; onlyLikely: boolean }) {
  const [all, setAll] = useState(false);
  const list = playersOf(role.key as Role).filter((p) => !onlyLikely || playsLikely(p));
  const shown = all ? list : list.slice(0, SHOWN);
  const gk = role.key === "P";
  return (
    <section id={role.anchor} aria-labelledby={`${role.anchor}-titolo`} className="scroll-mt-24">
      <h2 id={`${role.anchor}-titolo`} className="text-white text-xl mb-3">
        {role.plural} da schierare nella {fanta.matchday}ª giornata
      </h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <caption className="sr-only">
            {role.plural}: bonus atteso nella {fanta.matchday}ª giornata di Serie A
          </caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3 w-10">#</th>
              <th scope="col" className="text-left font-normal py-3">Giocatore</th>
              <th scope="col" className="text-left font-normal px-2 py-3">Partita</th>
              <th scope="col" className="text-left font-normal px-2 py-3">Titolare</th>
              {gk ? (
                <>
                  <th scope="col" className={th} title="Probabilità di non subire gol">Porta inviolata</th>
                  <th scope="col" className={th} title="Gol subiti attesi">Gol subiti</th>
                  <th scope="col" className={th} title="Probabilità di parare un rigore">Rigore parato</th>
                </>
              ) : (
                <>
                  <th scope="col" className={th} title="Probabilità di segnare almeno un gol">Gol</th>
                  <th scope="col" className={th} title="Probabilità di fare almeno un assist">Assist</th>
                </>
              )}
              <th scope="col" className={th} title="Probabilità di essere ammonito">Ammonizione</th>
              <th scope="col" className={`${th} pr-4`} title="Bonus e malus attesi (regole classiche)">Bonus atteso</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p, i) => (
              <tr key={p.id} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{i + 1}</td>
                <th scope="row" className="py-2.5 text-left font-normal">
                  <PlayerName p={p} />
                </th>
                <td className="px-2">
                  <Fixture p={p} />
                </td>
                <td className="px-2">
                  <Band p={p} />
                </td>
                {gk ? (
                  <>
                    <td className={`${td} text-white`}>{pc(p.cleanSheet ?? 0)}</td>
                    <td className={`${td} text-slate-300`}>{(p.conceded ?? 0).toFixed(1).replace(".", ",")}</td>
                    <td className={`${td} text-slate-300`}>{pc(p.penSaved ?? 0)}</td>
                  </>
                ) : (
                  <>
                    <td className={`${td} text-white`}>{pc(p.goal)}</td>
                    <td className={`${td} text-slate-300`}>{pc(p.assist)}</td>
                  </>
                )}
                <td className={`${td} text-slate-300`}>{pc(p.card)}</td>
                <td className={`${td} pr-4 font-semibold ${p.bonus > 0 ? "text-predict" : p.bonus < 0 ? "text-rose-300" : "text-slate-300"}`}>
                  {fmtBonus(p.bonus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > SHOWN && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 text-sm text-action-text hover:text-action-text-hover"
          aria-expanded={all}
        >
          {all ? `Mostra solo i primi ${SHOWN}` : `Mostra tutti i ${list.length} ${role.plural.toLowerCase()}`}
        </button>
      )}
    </section>
  );
}

function Matches() {
  return (
    <section aria-labelledby="partite-giornata">
      <h2 id="partite-giornata" className="text-white text-xl mb-3">
        Le partite della {fanta.matchday}ª giornata: gol attesi e porta inviolata
      </h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <caption className="sr-only">Partite della giornata con gol attesi e probabilità di porta inviolata</caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3">Quando</th>
              <th scope="col" className="text-left font-normal py-3">Partita</th>
              <th scope="col" className={th} title="Gol attesi casa – trasferta">Gol attesi</th>
              <th scope="col" className={`${th} pr-4`} title="Probabilità che la squadra non subisca gol, casa – trasferta">Porta inviolata</th>
            </tr>
          </thead>
          <tbody>
            {fanta.matches.map((m) => (
              <tr key={m.id} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                  {formatDay(m.kickoff)} {formatTime(m.kickoff)}
                </td>
                <th scope="row" className="py-2.5 text-left font-normal text-white whitespace-nowrap">
                  <TeamName id={m.home.id} name={m.home.name} /> – <TeamName id={m.away.id} name={m.away.name} />
                  {m.lineups && <span className="ml-2 text-xs text-predict">formazioni ufficiali</span>}
                </th>
                <td className={`${td} text-slate-300`}>
                  {m.xg ? `${m.xg[0].toFixed(1).replace(".", ",")} – ${m.xg[1].toFixed(1).replace(".", ",")}` : "–"}
                </td>
                <td className={`${td} pr-4 text-slate-300`}>
                  {m.cleanSheet ? `${pc(m.cleanSheet[0])} – ${pc(m.cleanSheet[1])}` : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FantacalcioPage() {
  const ok = hasFanta();
  usePageMeta(ok ? fantaMeta() : null);
  const [onlyLikely, setOnlyLikely] = useState(true);
  if (!ok) return <NotFoundPage />;
  const deadline = deadlineText();
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Shirt}
        title={`Consigli Fantacalcio: ${fanta.matchday}ª giornata di Serie A`}
        subtitle="Chi schierare, ruolo per ruolo, con le probabilità del nostro modello: titolarità, gol, assist, porta inviolata e bonus atteso."
        breadcrumb={[{ label: "Calcio", to: "/calcio" }, { label: "Fantacalcio" }]}
        meta={fanta.generatedAt ? <DataUpdatedNote generatedAt={fanta.generatedAt} cadence="più volte al giorno" /> : undefined}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-3 max-w-3xl text-slate-300">
          {deadline && (
            <p>
              <span className="text-white font-semibold">Formazioni entro {deadline}</span>, l'inizio della prima partita
              della giornata
              {fanta.started ? " (la giornata è già cominciata: restano le partite ancora da giocare)" : ""}. La pagina si
              aggiorna più volte al giorno con gli indisponibili e, circa un'ora prima di ogni partita, con le
              formazioni ufficiali.
            </p>
          )}
          <p>
            Il <strong className="text-white">bonus atteso</strong> è la media dei bonus e malus che il giocatore porterebbe
            in questa partita con le regole classiche: gol +3, assist +1, ammonizione −0,5; per il portiere porta
            inviolata +1, ogni gol subito −1, rigore parato +3. Tiene conto anche della probabilità che giochi poco o non
            giochi, quindi si può usare per scegliere tra due giocatori. Il voto in pagella non è stimato.
          </p>
        </div>

        <nav aria-label="Ruoli" className="flex flex-wrap items-center gap-2">
          {ROLES.map((r) => (
            <a
              key={r.key}
              href={`#${r.anchor}`}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
            >
              {r.plural}
            </a>
          ))}
          <Link
            to={chiSchierarePath}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-900 hover:bg-white"
          >
            <Scale className="w-4 h-4" aria-hidden="true" />
            Chi schierare? Confronta i giocatori
          </Link>
          <label className="ml-auto inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={onlyLikely} onChange={(e) => setOnlyLikely(e.target.checked)} />
            Solo titolari probabili
          </label>
        </nav>

        {ROLES.map((r) => (
          <RoleTable key={r.key} role={r} onlyLikely={onlyLikely} />
        ))}

        <Matches />

        {fanta.out.length > 0 && (
          <section aria-labelledby="indisponibili">
            <h2 id="indisponibili" className="text-white text-xl mb-3">
              Indisponibili della giornata
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {fanta.out.map((o) => (
                <li key={`${o.team}-${o.name}`} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300">
                  <span className="text-white">{o.name}</span> ({o.team}, {o.role}){o.reason ? ` · ${o.reason}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="text-slate-400 text-xs max-w-3xl space-y-2">
          <p>
            Come le stimiamo: la titolarità viene dalle partenze da titolare nella stagione e nelle ultime presenze (più
            peso alle recenti) e dagli indisponibili; con le formazioni ufficiali diventa certa. Gol, assist e
            ammonizioni vengono dai numeri del giocatore in stagione, rapportati ai gol e ai cartellini attesi della sua
            squadra nel pronostico della partita; la porta inviolata è la probabilità che l'avversario non segni. I ruoli
            seguono la posizione in campo dei dati ufficiali e possono differire dal listone del gioco.
          </p>
          <p>
            Stime statistiche, non certezze: il modello non conosce le scelte degli allenatori prima delle formazioni
            ufficiali.{" "}
            <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
              Come funziona il modello
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
