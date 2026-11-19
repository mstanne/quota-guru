// /fantacalcio/chi-schierare — compare two or three players of the next Serie A round (src/lib/fantacalcio.ts).
// The chosen players stay in the address (?g=<id>,<id>) so a comparison can be shared; the pre-rendered page shows
// the two attackers with the highest expected bonus.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Scale, X } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { DataUpdatedNote } from "../calcio/DataUpdatedNote";
import { NotFoundPage } from "../NotFoundPage";
import { usePageMeta } from "../../lib/pageMeta";
import {
  chiSchierareMeta,
  deadlineText,
  fanta,
  fantaPath,
  fmtBonus,
  hasFanta,
  playerById,
  playersOf,
  playsLikely,
  roleName,
  type FantaPlayer,
} from "../../lib/fantacalcio";
import { Band, Fixture, MantraRole, PlayerName, pc } from "./FantaUi";

const MAX = 3;
const label = (p: FantaPlayer) => `${p.name} (${p.team.name})`;

/** Why the first one: the expected bonus, with a warning when his place in the team is not sure. */
function verdict(list: FantaPlayer[]) {
  if (list.length < 2) return null;
  const [best, second] = [...list].sort((a, b) => b.bonus - a.bonus);
  const gap = best.bonus - second.bonus;
  const surer = [...list].sort((a, b) => b.start - a.start)[0];
  const parts = [
    gap < 0.1
      ? `${best.name} e ${second.name} sono quasi alla pari (${fmtBonus(best.bonus)} contro ${fmtBonus(second.bonus)} di bonus atteso): decide chi è più sicuro di giocare.`
      : `Schiera ${best.name}: bonus atteso ${fmtBonus(best.bonus)}, contro ${fmtBonus(second.bonus)} di ${second.name}.`,
  ];
  if (!playsLikely(best) && surer !== best)
    parts.push(`Attenzione: la titolarità di ${best.name} è ${best.band}; ${surer.name} è più sicuro di partire dall'inizio.`);
  return parts.join(" ");
}

function Card({ p, onRemove }: { p: FantaPlayer; onRemove: () => void }) {
  const gk = p.role === "P";
  const rows: [string, string][] = gk
    ? [
        ["Porta inviolata", pc(p.cleanSheet ?? 0)],
        ["Gol subiti attesi", (p.conceded ?? 0).toFixed(1).replace(".", ",")],
        ["Rigore parato", pc(p.penSaved ?? 0)],
        ["Ammonizione", pc(p.card)],
      ]
    : [
        ["Gol", pc(p.goal)],
        ["Assist", pc(p.assist)],
        ["Ammonizione", pc(p.card)],
        ["Minuti attesi", String(p.min)],
      ];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg">
            <PlayerName p={p} />
          </p>
          <p className="text-sm text-slate-400">
            {roleName(p.role)} <MantraRole p={p} className="mx-1 align-middle" /> · <Fixture p={p} />
          </p>
        </div>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-white" aria-label={`Togli ${p.name}`}>
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <Band p={p} />
      <dl className="grid grid-cols-2 gap-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-slate-400 text-xs">{k}</dt>
            <dd className="text-white text-xl tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-lg bg-slate-950/60 p-3">
        <p className="text-slate-400 text-xs">Bonus atteso</p>
        <p className={`text-2xl font-semibold tabular-nums ${p.bonus > 0 ? "text-predict" : p.bonus < 0 ? "text-rose-300" : "text-white"}`}>
          {fmtBonus(p.bonus)}
        </p>
      </div>
    </div>
  );
}

export function ChiSchierarePage() {
  const ok = hasFanta();
  usePageMeta(ok ? chiSchierareMeta() : null);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const options = useMemo(() => [...fanta.players].sort((a, b) => a.name.localeCompare(b.name)), []);
  if (!ok) return <NotFoundPage />;
  const fromUrl = (params.get("g") ?? "")
    .split(",")
    .map(Number)
    .map((id) => playerById(id))
    .filter((p): p is FantaPlayer => !!p)
    .slice(0, MAX);
  const chosen = params.has("g") ? fromUrl : playersOf("A").filter(playsLikely).slice(0, 2);
  const save = (list: FantaPlayer[]) => setParams(list.length ? { g: list.map((p) => p.id).join(",") } : { g: "" }, { replace: true });
  const add = (text: string) => {
    const p = options.find((o) => label(o) === text);
    if (!p || chosen.some((c) => c.id === p.id) || chosen.length >= MAX) return;
    save([...chosen, p]);
    setQuery("");
  };
  const v = verdict(chosen);
  const deadline = deadlineText();
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Scale}
        title="Chi schierare al Fantacalcio?"
        subtitle={`Confronta due o tre giocatori della ${fanta.matchday}ª giornata di Serie A con i numeri del nostro modello.`}
        breadcrumb={[{ label: "Calcio", to: "/calcio" }, { label: "Fantacalcio", to: fantaPath }, { label: "Chi schierare" }]}
        meta={fanta.generatedAt ? <DataUpdatedNote generatedAt={fanta.generatedAt} cadence="più volte al giorno" /> : undefined}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="max-w-3xl space-y-2">
          <label htmlFor="cerca-giocatore" className="block text-white">
            Aggiungi un giocatore {chosen.length >= MAX ? `(massimo ${MAX})` : ""}
          </label>
          <input
            id="cerca-giocatore"
            list="giocatori-fanta"
            value={query}
            disabled={chosen.length >= MAX}
            onChange={(e) => {
              setQuery(e.target.value);
              add(e.target.value);
            }}
            placeholder="Scrivi il nome, es. Lautaro"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 disabled:opacity-50"
          />
          <datalist id="giocatori-fanta">
            {options.map((p) => (
              <option key={p.id} value={label(p)} />
            ))}
          </datalist>
          {deadline && <p className="text-sm text-slate-400">Formazioni entro {deadline}.</p>}
        </div>

        {v && (
          <p className="max-w-3xl rounded-xl border border-predict/30 bg-predict/10 p-4 text-white" aria-live="polite">
            {v}
          </p>
        )}

        {chosen.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chosen.map((p) => (
              <Card key={p.id} p={p} onRemove={() => save(chosen.filter((c) => c.id !== p.id))} />
            ))}
          </div>
        ) : (
          <p className="text-slate-400">Scegli almeno due giocatori da confrontare.</p>
        )}

        <div className="text-slate-400 text-xs max-w-3xl space-y-2">
          <p>
            Bonus atteso con le regole classiche: gol +3, assist +1, ammonizione −0,5; per il portiere porta inviolata +1,
            ogni gol subito −1, rigore parato +3. Conta anche la probabilità che il giocatore non giochi o giochi poco,
            perciò si possono confrontare giocatori di ruoli e squadre diverse. Il voto in pagella non è stimato.
          </p>
          <p>
            <Link to={fantaPath} className="text-action-text hover:text-action-text-hover">
              Tutti i consigli della {fanta.matchday}ª giornata, ruolo per ruolo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
