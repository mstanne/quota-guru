// One or two sentences at the top of a match page that answer the main question on their own
// (when it is played, how it ended, what the model expects), so that search engines and AI assistants
// can quote them as they are. Built only from the data already on the page; no betting language.
import { formatDay, formatTime, roundLabel, type Match } from "../../lib/footballCore";
import { pct, pickHit, pickLabel, type Prediction } from "../../lib/predictionsCore";
import type { BasketPrediction } from "../../lib/basketPredict";

const fmtProb = (x: number) => pct(x);

/** The pick inside a sentence: "l'1 (vittoria Napoli)", "il pareggio", "il 2 (vittoria Lazio)", "Napoli o pareggio". */
function pickInSentence(p: Prediction, home: string, away: string) {
  if (p.pick === "X") return "il pareggio";
  if (p.pick === "1") return `l'1 (vittoria ${home})`;
  if (p.pick === "2") return `il 2 (vittoria ${away})`;
  return pickLabel(p, home, away);
}

/** Probability of the model's pick (single outcome or double chance). */
function pickProbability(p: Prediction) {
  switch (p.pick) {
    case "1":
      return p.p[0];
    case "X":
      return p.p[1];
    case "2":
      return p.p[2];
    case "1X":
      return p.dc[0];
    case "X2":
      return p.dc[2];
  }
}

export function footballSummary(
  match: Match,
  competitionName: string,
  prediction: Prediction | undefined,
  state: { finished: boolean; live: boolean },
): string | null {
  const home = match.homeTeam.shortName;
  const away = match.awayTeam.shortName;
  const round = roundLabel(match);
  const where = round ? `${competitionName}, ${round}` : competitionName;
  const ft = match.score.fullTime;

  if (state.live) return null;
  if (state.finished && ft.home !== null && ft.away !== null) {
    const result = `${home}–${away} è finita ${ft.home}-${ft.away} (${where}, ${formatDay(match.utcDate)}).`;
    if (!prediction?.pre) return result;
    const hit = pickHit(prediction, ft.home, ft.away);
    return (
      `${result} Prima del calcio d'inizio il modello statistico di QuotaGuru indicava come esito più probabile ` +
      `${pickInSentence(prediction, home, away)}, ` +
      `con il ${fmtProb(pickProbability(prediction))}: pronostico ${hit ? "corretto" : "non corretto"}.`
    );
  }
  if (state.finished) return null;

  const when = `${home}–${away} (${where}) si gioca ${formatDay(match.utcDate)} alle ${formatTime(match.utcDate)}.`;
  if (!prediction) return when;
  const [p1, px, p2] = prediction.p;
  const xg = prediction.xg.map((g) => g.toFixed(2).replace(".", ","));
  return (
    `${when} Per il modello statistico di QuotaGuru l'esito più probabile è ` +
    `${pickInSentence(prediction, home, away)}: ` +
    `${home} ${fmtProb(p1)}, pareggio ${fmtProb(px)}, ${away} ${fmtProb(p2)}; gol attesi ${xg[0]} a ${xg[1]}.`
  );
}

export function basketSummary(
  game: { utcDate: string; home: { name: string }; away: { name: string }; score: { home: number | null; away: number | null } },
  prediction: BasketPrediction | undefined,
  state: { finished: boolean; live: boolean },
): string | null {
  const home = game.home.name;
  const away = game.away.name;
  const { home: sh, away: sa } = game.score;
  if (state.live) return null;
  if (state.finished && sh !== null && sa !== null) {
    const result = `${home}–${away} è finita ${sh}-${sa} (NBA, ${formatDay(game.utcDate)}).`;
    if (!prediction?.pre) return result;
    const fav = prediction.fav === 0 ? home : away;
    const hit = (sh > sa ? 0 : 1) === prediction.fav;
    return (
      `${result} Prima della palla a due il modello statistico di QuotaGuru dava favoriti i ${fav} ` +
      `(${fmtProb(prediction.p[prediction.fav])}): pronostico ${hit ? "corretto" : "non corretto"}.`
    );
  }
  if (state.finished) return null;
  const when = `${home}–${away} (NBA) si gioca ${formatDay(game.utcDate)} alle ${formatTime(game.utcDate)}, ora italiana.`;
  if (!prediction) return when;
  const fav = prediction.fav === 0 ? home : away;
  const pts = prediction.pts.map((x) => Math.round(x));
  return (
    `${when} Per il modello statistico di QuotaGuru sono favoriti i ${fav}, con il ${fmtProb(prediction.p[prediction.fav])} ` +
    `di probabilità di vittoria; punteggio atteso ${pts[0]}-${pts[1]}.`
  );
}

/** The summary paragraph, shown under the teams in the page header. */
export function MatchSummary({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p data-summary="" className="max-w-3xl mx-auto mt-6 text-center text-slate-300 leading-relaxed">
      {text}
    </p>
  );
}
