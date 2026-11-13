// /pronostici/multiple – the multiples of the day (src/lib/multiplePage.ts): a double and three accumulators at fair
// odds near 2, 5 and 10, built only from the model's probabilities, each with the chance that it comes in and, later,
// how it went. Informative, like the tris: no operator odds, no link to any operator.
import { Check, Clock, Layers, ListPlus, X } from "lucide-react";
import { useBetSlip } from "../../context/BetSlipContext";
import { Link } from "../../lib/links";
import { paths } from "../../routes";
import { formatDay, formatShortDate, formatTime, formatUpdated, romeDay } from "../../lib/footballCore";
import { pct } from "../../lib/predictionsCore";
import { oneIn, slipFairOdds } from "../../lib/slip";
import { usePageMeta } from "../../lib/pageMeta";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import {
  MULTIPLE_KINDS,
  latestMultiples,
  multipleData,
  multipleLead,
  multipleMeta,
  pastMultiples,
  type Multipla,
  type MultiplePick,
} from "../../lib/multiplePage";

const STATUS: Record<Multipla["status"], string> = {
  "in-attesa": "Da giocare",
  "in-corso": "In corso",
  concluso: "Conclusa",
};
const day = (d: string) => formatDay(`${d}T12:00:00Z`);

function PickRow({ p }: { p: MultiplePick }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 shrink-0 min-w-9 h-7 px-1.5 rounded-md flex items-center justify-center text-xs font-semibold tabular-nums ${
          p.hit === true
            ? "bg-best text-best-foreground"
            : p.hit === false
              ? "bg-slate-700 text-slate-200"
              : "bg-slate-800 border border-slate-700 text-white"
        }`}
        aria-hidden="true"
      >
        {p.sign}
      </span>
      <span className="flex-1 min-w-0">
        <Link to={p.path} className="text-white font-medium hover:underline">
          {p.label}
        </Link>
        <span className="block text-slate-400 text-sm">
          <time dateTime={p.kickoff}>{formatTime(p.kickoff)}</time> · {p.where}
        </span>
        <span className="block text-slate-300 text-sm">
          {p.outcome} · <span className="tabular-nums">{pct(p.p)}</span>
        </span>
      </span>
      <span className="shrink-0 text-right text-sm">
        {p.result ? (
          <span className="inline-flex items-center gap-1.5 text-white tabular-nums">
            {p.result}
            {p.hit ? (
              <Check className="w-4 h-4 text-best" aria-label="esito verificato" />
            ) : (
              <X className="w-4 h-4 text-slate-400" aria-label="esito non verificato" />
            )}
          </span>
        ) : p.void ? (
          <span className="text-slate-400">rinviata</span>
        ) : (
          <span className="text-slate-500">–</span>
        )}
      </span>
    </li>
  );
}

/** Puts every pick still to start in the slip, with the probabilities of the model now in the multiple. */
function AddToSlip({ m }: { m: Multipla }) {
  const { addSelection, openBetSlip } = useBetSlip();
  const add = () => {
    const now = Date.now();
    for (const p of m.picks.filter((x) => Date.parse(x.kickoff) > now)) {
      const [home, away] = p.label.split(" – ");
      addSelection(
        {
          id: `football-${p.id}-pred-${p.key}`,
          matchId: `football-${p.id}`,
          competition: p.where,
          homeTeam: home,
          awayTeam: away,
          date: romeDay(p.kickoff),
          time: formatTime(p.kickoff),
          betType: p.key,
          betTypeLabel: `${p.sign} – ${p.outcome}`,
          probability: p.p,
          ...(p.lam ? { lam: p.lam } : {}),
        },
        { open: false },
      );
    }
    openBetSlip();
  };
  return (
    <button
      type="button"
      onClick={add}
      className="inline-flex items-center gap-2 rounded-md border border-action/60 px-3 py-1.5 text-sm text-white hover:bg-action hover:text-action-foreground"
    >
      <ListPlus className="w-4 h-4" aria-hidden="true" />
      Metti in schedina
    </button>
  );
}

function MultiplaCard({ m, how }: { m: Multipla; how?: string }) {
  const played = m.picks.filter((p) => p.hit !== null).length;
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5" aria-labelledby={`m-${m.id}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`m-${m.id}`} className="text-white text-lg">
          {m.title}
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-slate-700 text-slate-300">
          {m.status !== "concluso" && <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
          {m.outcome === "vinta" ? "Andata a segno" : m.outcome === "persa" ? "Non andata a segno" : STATUS[m.status]}
        </span>
      </header>
      {how && <p className="text-slate-400 text-sm mt-1">{how}</p>}
      <ul className="divide-y divide-slate-800 mt-1">
        {m.picks.map((p) => (
          <PickRow key={p.id} p={p} />
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-slate-300 text-sm">Probabilità che entrino tutti i {m.picks.length} esiti</div>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-xl font-semibold tabular-nums">{pct(m.all)}</span>
              {m.all < 0.5 && <span className="text-slate-400 text-sm">{oneIn(m.all)}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs">Quota equa</div>
            <div className="text-white text-lg tabular-nums">{slipFairOdds(m.all)}</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-action" style={{ width: `${Math.max(1, Math.round(m.all * 100))}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {played > 0 ? (
            <p className="text-slate-300 text-sm">
              {m.status === "concluso" ? "Com'è andata" : "Finora"}:{" "}
              <strong className="text-white font-medium">
                {m.hits} su {played}
              </strong>
            </p>
          ) : (
            <span />
          )}
          {m.status === "in-attesa" && <AddToSlip m={m} />}
        </div>
      </div>
    </article>
  );
}

function PastList({ list }: { list: Multipla[] }) {
  if (!list.length) return null;
  return (
    <section aria-labelledby="precedenti">
      <h2 id="precedenti" className="text-white text-2xl mb-3">
        Le multiple dei giorni scorsi
      </h2>
      <ul className="divide-y divide-slate-800 text-sm rounded-xl border border-slate-800 bg-slate-900 px-4">
        {list.map((m) => (
          <li key={`${m.id}-${m.day}`} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-white">
                <time dateTime={m.day}>{formatShortDate(`${m.day}T12:00:00Z`)}</time> ·{" "}
                {MULTIPLE_KINDS.find((k) => k.id === m.id)?.name ?? m.title}
              </span>
              <span className="text-slate-300 tabular-nums text-right">
                {m.outcome === "vinta" ? "a segno ✓" : m.outcome === "persa" ? `${m.hits} su ${m.picks.length} ✗` : STATUS[m.status]}{" "}
                · attesa al {pct(m.all)}
              </span>
            </div>
            <p className="text-slate-400">
              {m.picks.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && " · "}
                  <Link to={p.path} className="hover:text-white hover:underline">
                    {p.label}
                  </Link>{" "}
                  {p.sign}
                  {p.hit === true ? " ✓" : p.hit === false ? " ✗" : ""}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MultiplePage() {
  usePageMeta(multipleMeta());
  const lead = multipleLead();
  const latest = latestMultiples();
  const past = pastMultiples(latest.day).slice(0, 60);
  const stats = multipleData.stats;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Layers}
        title="Le multiple del giorno"
        subtitle="Ogni giorno una doppia e tre multiple a quota equa 2, 5 e 10, costruite solo con le probabilità del modello statistico: quanto è probabile che entrino e, dopo, com'è andata."
        breadcrumb={[{ label: "Pronostici", to: paths.pronostici }, { label: "Multiple" }]}
        meta={
          <MetaItems
            items={[
              ...(multipleData.generatedAt ? [`Aggiornato al ${formatUpdated(multipleData.generatedAt)}`] : []),
              "Stime statistiche, non consigli di gioco",
            ]}
          />
        }
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-10">
        {lead && <p className="text-slate-200 text-lg leading-relaxed">{lead}</p>}

        <section aria-labelledby="oggi">
          <h2 id="oggi" className="text-white text-2xl mb-1">
            {latest.day ? `Le multiple di ${day(latest.day)}` : "Le multiple di oggi"}
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Scelte la mattina tra le partite del giorno e poi non più cambiate, con le probabilità di quel momento.
          </p>
          {latest.list.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {latest.list.map((m) => (
                <MultiplaCard key={m.id} m={m} how={MULTIPLE_KINDS.find((k) => k.id === m.id)?.how} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300 text-sm">
              Le prime multiple escono con il prossimo aggiornamento del mattino.
            </p>
          )}
        </section>

        <section aria-labelledby="perche" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="perche" className="text-white text-lg mb-2">
            Come leggerle
          </h2>
          <p className="text-slate-300 text-sm mb-2">
            Ogni esito qui sopra ha buone probabilità da solo, ma per vincere una multipla devono entrare tutti: le
            probabilità si moltiplicano. Tre esiti all'80% entrano insieme circa una volta su due; cinque esiti al 63%
            circa una volta su dieci. La quota equa è 1 ÷ questa probabilità, il prezzo della multipla senza il margine
            dell'operatore: le quote reali sono più basse.
          </p>
          <p className="text-slate-400 text-sm">
            Pubblichiamo com'è andata ogni multipla, anche quelle perse, per vedere sui risultati veri se le probabilità
            del modello sono realistiche.
          </p>
        </section>

        {MULTIPLE_KINDS.some((k) => stats[k.id]?.n) && (
          <section aria-labelledby="bilancio">
            <h2 id="bilancio" className="text-white text-2xl mb-3">
              Bilancio
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MULTIPLE_KINDS.map((k) => {
                const s = stats[k.id] ?? { n: 0, won: 0, expected: 0 };
                return (
                  <div key={k.id} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                    <dt className="text-slate-400 text-xs">{k.name}</dt>
                    <dd className="text-white tabular-nums">
                      {s.won} su {s.n}
                      <span className="block text-slate-400 text-xs">attese circa {Math.round(s.expected)}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        <PastList list={past} />

        <section aria-labelledby="come" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 id="come" className="text-white text-lg mb-2">
            Come vengono scelte
          </h2>
          <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1.5">
            <li>
              Si parte dalle partite di calcio del giorno con un pronostico di affidabilità alta o media (amichevoli
              escluse). Per ogni partita si considerano 1X2, doppia chance, Under/Over 1,5, 2,5 e 3,5 e Goal/No goal.
            </li>
            <li>
              Per ogni multipla si prende da ogni partita l'esito con la probabilità più vicina a quella giusta per
              arrivare alla quota in pochi esiti, preferendo le partite con più dati. Una partita entra in una sola
              multipla finché ce ne sono abbastanza.
            </li>
            <li>
              La probabilità della multipla è il prodotto delle probabilità: partite diverse sono considerate
              indipendenti.
            </li>
            <li>
              Le multiple vengono registrate al primo aggiornamento del giorno nell'archivio dei pronostici e non vengono
              più cambiate.
            </li>
          </ul>
          <p className="mt-3 text-slate-400 text-sm">
            Il modello non conosce infortuni, squalifiche e turnover. Gioca solo se maggiorenne e con importi che puoi
            permetterti di perdere.{" "}
            <Link to={paths.metodologia} className="text-action-text hover:text-action-text-hover">
              Come calcoliamo le probabilità
            </Link>{" "}
            ·{" "}
            <Link to="/pronostici/tris" className="text-action-text hover:text-action-text-hover">
              Il tris
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
