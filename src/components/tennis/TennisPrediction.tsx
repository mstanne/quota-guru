// Tennis predictions: result panel (win probability, set scores, total sets) and the head-to-head calculator
// on the tennis page. Model: src/lib/tennis/model.mjs; ratings: src/data/tennis-ratings.json.
import { useId, useMemo, useState } from "react";
import { Link } from "../../lib/links";
import { ChartColumn, Info } from "lucide-react";
import { paths } from "../../routes";
import { tourData, tourLabel, tours, type Tour } from "../../lib/tennis";
import { hasSurfaceRatings, ratingSource, tennisPrediction, type MatchPrediction, type Surface } from "../../lib/tennisPredict";
import { pct } from "../../lib/predictionsCore";
import { FairOddsStrip } from "../predictions/PredictionUi";

const SURFACE_LABEL: Record<Surface, string> = { Hard: "Cemento", Clay: "Terra battuta", Grass: "Erba" };

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-800 last:border-0">
      <dt className="text-slate-400 text-sm">{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-predict font-semibold" : "text-white"}`}>{value}</dd>
    </div>
  );
}

/** Probabilities for A vs B: winner bar, exact set scores, total sets and set handicap. */
export function TennisPredictionResult({
  prediction,
  a,
  b,
}: {
  prediction: MatchPrediction;
  a: string;
  b: string;
}) {
  const p = prediction;
  const top = p.p[0] >= p.p[1] ? 0 : 1;
  const bestScore = p.scores.reduce((m, x) => (x.p > m.p ? x : m), p.scores[0]);
  const setKeys = Object.keys(p.sets).sort();
  const maxSets = setKeys[setKeys.length - 1];
  const longLabel = p.bestOf === 5 ? "5 set" : "3 set";
  return (
    <div>
      <div role="img" aria-label={`Probabilità di vittoria stimate: ${a} ${pct(p.p[0])}, ${b} ${pct(p.p[1])}`}>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800 gap-0.5" aria-hidden="true">
          {p.p.map((v, i) => (
            <span key={i} className={i === top ? "bg-predict" : "bg-slate-500"} style={{ width: `${v * 100}%` }} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3" aria-hidden="true">
          {[a, b].map((name, i) => (
            <div key={i} className={i === 0 ? "text-left" : "text-right"}>
              <span className={`block tabular-nums text-2xl ${i === top ? "text-predict font-semibold" : "text-white"}`}>
                {pct(p.p[i])}
              </span>
              <span className="block text-slate-400 text-sm truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>
      <FairOddsStrip
        items={[
          { label: a, p: p.p[0] },
          { label: b, p: p.p[1] },
        ]}
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-white text-base mb-1">Risultato in set</h3>
          <dl>
            {p.scores.map((x) => (
              <Row
                key={`${x.a}-${x.b}`}
                label={`${x.a > x.b ? a : b} ${Math.max(x.a, x.b)}-${Math.min(x.a, x.b)}`}
                value={pct(x.p)}
                strong={x === bestScore}
              />
            ))}
          </dl>
        </div>
        <div>
          <h3 className="text-white text-base mb-1">Numero di set</h3>
          <dl>
            {setKeys.map((k) => (
              <Row key={k} label={`${k} set`} value={pct(p.sets[k])} />
            ))}
            <Row label={`Si arriva al ${maxSets}º set`} value={pct(p.sets[maxSets])} />
            <Row label={`${a} vince con 2+ set di scarto`} value={pct(p.handicap.a)} />
            <Row label={`${b} vince con 2+ set di scarto`} value={pct(p.handicap.b)} />
          </dl>
          <p className="mt-2 text-slate-400 text-xs">Partita al meglio dei {longLabel}.</p>
        </div>
      </div>
    </div>
  );
}

export function TennisModelNote() {
  return (
    <p className="mt-5 flex items-start gap-2 text-slate-400 text-xs">
      <Info className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
      <span>
        {ratingSource === "elo"
          ? "Stime da un rating Elo per superficie calcolato sui risultati delle partite."
          : "Stime calcolate dai punti delle classifiche ATP e WTA: non tengono conto di superficie, forma recente, infortuni e precedenti."}{" "}
        Non sono quote né consigli di gioco.{" "}
        <Link to={`${paths.metodologia}#pronostici-tennis`} className="text-action-text hover:text-action-text-hover">
          Come funziona il modello
        </Link>
        .
      </span>
    </p>
  );
}

const select =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-action";

/** Head-to-head calculator: pick two top-100 players, surface and format. */
export function TennisPredictor() {
  const id = useId();
  const [tour, setTour] = useState<Tour>("atp");
  const rankings = tourData(tour).rankings;
  const [picks, setPicks] = useState<Record<Tour, [number, number]>>(() => ({
    atp: [tourData("atp").rankings[0]?.player.id ?? 0, tourData("atp").rankings[1]?.player.id ?? 0],
    wta: [tourData("wta").rankings[0]?.player.id ?? 0, tourData("wta").rankings[1]?.player.id ?? 0],
  }));
  const [surface, setSurface] = useState<Surface>("Hard");
  const [bestOf, setBestOf] = useState<3 | 5>(3);
  const [a, b] = picks[tour];
  const format = tour === "wta" ? 3 : bestOf;
  const surfaceMatters = hasSurfaceRatings(tour);
  const prediction = useMemo(
    () => tennisPrediction(tour, a, b, { surface: surfaceMatters ? surface : null, bestOf: format }),
    [tour, a, b, surface, surfaceMatters, format],
  );
  const name = (pid: number) => rankings.find((r) => r.player.id === pid)?.player.name ?? "";
  const setPick = (i: 0 | 1, v: number) =>
    setPicks((p) => ({ ...p, [tour]: (i === 0 ? [v, p[tour][1]] : [p[tour][0], v]) as [number, number] }));

  if (rankings.length < 2) return null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 mb-8" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-white text-xl mb-1">
        <ChartColumn className="w-5 h-5 text-slate-300" aria-hidden="true" />
        Pronostico testa a testa
      </h2>
      <p className="text-slate-400 text-sm mb-5">
        Scegli due giocatori della top 100 e il formato: il modello stima chi vince e con quale punteggio in set.
      </p>

      <div className="flex flex-wrap gap-1 p-1 mb-4 rounded-lg bg-slate-950 border border-slate-800 w-fit" role="group" aria-label="Circuito">
        {tours.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tour === t}
            onClick={() => setTour(t)}
            className={`px-3 py-1.5 rounded-md text-sm cursor-pointer ${tour === t ? "bg-selected text-selected-foreground" : "text-slate-300 hover:text-white"}`}
          >
            {tourLabel(t)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] mb-6">
        {([0, 1] as const).map((i) => (
          <label key={i} className="block">
            <span className="block text-slate-400 text-sm mb-1">Giocatore {i + 1}</span>
            <select className={select} value={picks[tour][i]} onChange={(e) => setPick(i, Number(e.target.value))}>
              {rankings.map((r) => (
                <option key={r.player.id} value={r.player.id} disabled={r.player.id === picks[tour][1 - i]}>
                  {r.rank}. {r.player.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        {surfaceMatters && (
          <label className="block">
            <span className="block text-slate-400 text-sm mb-1">Superficie</span>
            <select className={select} value={surface} onChange={(e) => setSurface(e.target.value as Surface)}>
              {(Object.keys(SURFACE_LABEL) as Surface[]).map((s) => (
                <option key={s} value={s}>
                  {SURFACE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="block text-slate-400 text-sm mb-1">Formato</span>
          <select
            className={select}
            value={format}
            disabled={tour === "wta"}
            onChange={(e) => setBestOf(Number(e.target.value) as 3 | 5)}
          >
            <option value={3}>Al meglio dei 3 set</option>
            <option value={5}>Al meglio dei 5 set</option>
          </select>
        </label>
      </div>

      {prediction && <TennisPredictionResult prediction={prediction} a={name(a)} b={name(b)} />}
      <TennisModelNote />
    </section>
  );
}
