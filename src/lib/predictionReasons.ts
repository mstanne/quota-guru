// "Perché questo pronostico": 2-3 short, data-based points next to each prediction.
// Every sentence is built from a value the model or the data snapshot actually has; when a value is missing the
// point is left out. The points describe the inputs (goals, table, form), never injuries or other things the
// model does not know, and never tell the reader to bet.
import { recentForm, standingOf, type Competition, type Match } from "./footballCore";
import type { Prediction } from "./predictionsCore";

const n1 = (x: number) => x.toFixed(1).replace(".", ",");
const n2 = (x: number) => x.toFixed(2).replace(".", ",");

/** "3V 1N 1P (10 punti)" from the last results of a team. */
function formText(c: Competition, teamId: number) {
  const f = recentForm(c, teamId, 5);
  if (f.length < 3) return null;
  const v = f.filter((x) => x.result === "V").length;
  const d = f.filter((x) => x.result === "N").length;
  const l = f.length - v - d;
  const parts = [v && `${v}V`, d && `${d}N`, l && `${l}P`].filter(Boolean).join(" ");
  return { text: `${parts} (${v * 3 + d} punti)`, points: v * 3 + d, games: f.length };
}

export function footballReasons(p: Prediction, c: Competition, m: Match): string[] {
  const home = m.homeTeam.shortName;
  const away = m.awayTeam.shortName;
  const out: string[] = [];

  // 1. expected goals: the core of the Poisson model
  const [xh, xa] = p.xg;
  const gap = xh - xa;
  out.push(
    Math.abs(gap) < 0.25
      ? `Gol attesi quasi alla pari (${home} ${n2(xh)}, ${away} ${n2(xa)}): per il modello è una partita equilibrata.`
      : `Gol attesi: ${home} ${n2(xh)}, ${away} ${n2(xa)}. Il modello vede avanti ${gap > 0 ? home : away}, in base ai gol fatti e subiti di recente.`,
  );

  // 2. the table: attack of the favourite vs defence of the other side (or positions when the pick is a draw)
  const sh = standingOf(c, m.homeTeam.id);
  const sa = standingOf(c, m.awayTeam.id);
  if (sh && sa && sh.playedGames >= 3 && sa.playedGames >= 3) {
    const favHome = p.p[0] >= p.p[2];
    const [fav, other] = favHome ? [sh, sa] : [sa, sh];
    const pg = (x: number, g: number) => n1(x / g);
    if (p.pick === "X" || Math.abs(sh.position - sa.position) <= 2) {
      out.push(
        `In classifica sono vicine: ${home} ${sh.position}ª con ${sh.points} punti, ${away} ${sa.position}ª con ${sa.points}.`,
      );
    } else {
      out.push(
        `${fav.team.shortName} (${fav.position}ª) segna ${pg(fav.goalsFor, fav.playedGames)} gol a partita in ${c.name}; ${other.team.shortName} (${other.position}ª) ne subisce ${pg(other.goalsAgainst, other.playedGames)}.`,
      );
    }
  } else {
    // cups and early season: total goals instead of the table
    const total = xh + xa;
    out.push(
      `Totale gol atteso ${n1(total)}: ${p.over["2.5"] >= 0.5 ? "più probabile una partita con almeno 3 gol" : "più probabile una partita con meno di 3 gol"} (Over 2,5 al ${Math.round(p.over["2.5"] * 100)}%).`,
    );
  }

  // 3. recent form in this competition
  const fh = formText(c, m.homeTeam.id);
  const fa = formText(c, m.awayTeam.id);
  if (fh && fa) out.push(`Ultime partite in ${c.name}: ${home} ${fh.text}, ${away} ${fa.text}.`);

  return out.slice(0, 3);
}

// ---------------------------------------------------------------------------------------------- NBA

export interface NbaReasonInput {
  home: string;
  away: string;
  /** Expected points [home, away] and favourite (0 = home). */
  pts: [number, number];
  fav: 0 | 1;
  /** Second night of a back-to-back [home, away]. */
  b2b: [number, number];
  /** Wins and games among the last games of each team, null if too few. */
  record: [{ won: number; games: number } | null, { won: number; games: number } | null];
}

export function nbaReasons(x: NbaReasonInput): string[] {
  const names = [x.home, x.away];
  const out: string[] = [];
  const margin = Math.abs(x.pts[0] - x.pts[1]);
  out.push(
    margin < 2
      ? `Punteggio atteso quasi pari (${Math.round(x.pts[0])}-${Math.round(x.pts[1])}): il modello non vede una favorita netta.`
      : `Punteggio atteso ${Math.round(x.pts[0])}-${Math.round(x.pts[1])}: ${names[x.fav]} avanti di ${n1(margin)} punti, in base a punti segnati e concessi di recente.`,
  );
  const [rh, ra] = x.record;
  if (rh && ra)
    out.push(
      `Bilancio nelle ultime partite: ${x.home} ${rh.won}-${rh.games - rh.won}, ${x.away} ${ra.won}-${ra.games - ra.won}.`,
    );
  const tired = names.filter((_, i) => x.b2b[i]);
  if (tired.length)
    out.push(
      `${tired.join(" e ")} ${tired.length > 1 ? "giocano" : "gioca"} la seconda partita in due giorni: il modello toglie qualche punto.`,
    );
  else out.push(`${x.home} gioca in casa: il modello aggiunge il fattore campo medio della NBA.`);
  return out.slice(0, 3);
}
