// Longer generated texts of the football pages: extra sections of the match previews, the text of the competition
// pages, the opening of the "Pronostici di oggi/domani" pages. Same rules as the editorial engine (engine.mjs): every
// sentence is built from a data value and is left out when the value is missing, no betting calls to action. The
// match-preview sections are added after the AI rewrite (src/lib/editorial/index.ts), so they never change the
// fingerprint the rewrites are tied to.
import type { Article, ArticleSection } from "./engine.mjs";
import { al, cap, dec, fmtDay, fmtMonthYear, joinIt, num, pick, prep, teamName, the } from "./engine.mjs";
import {
  cornersCardsPath,
  goalStatsPath,
  isFinished,
  isUpcoming,
  leadersPath,
  mainTable,
  matchdayPath,
  matchHref,
  recentForm,
  standingsPath,
  type Competition,
  type Match,
} from "../footballCore";
import { featuredMatchday, matchdayDates, matchdayLabel } from "../matchdaysCore";
import { topOutcome, type Prediction } from "../predictionsCore";
import type { CompetitionData } from "../footballData";
import type { GoalResult } from "../goalStats.mjs";

const METHOD = "/metodologia";
const TRACK = "/bilancio-pronostici";
const pc = (x: number) => `${Math.round(x * 100)}%`;
const share = (k: number, n: number) => (n ? pc(k / n) : "0%");
/** Article before a percentage: "il 64%", "l'82%", "dell'11%" (from the number as it is read). */
const vowelPct = (t: string) => /^(8|11|8\d)%$/.test(t);
const ART: Record<string, [string, string]> = {
  il: ["il ", "l'"],
  del: ["del ", "dell'"],
  nel: ["nel ", "nell'"],
  al: ["al ", "all'"],
};
const withArt = (a: keyof typeof ART, t: string) => ART[a][vowelPct(t) ? 1 : 0] + t;
const sec = (id: string, title: string, paragraphs: string[] = [], bullets: string[] = []): ArticleSection => ({
  id,
  title,
  paragraphs: paragraphs.filter(Boolean),
  bullets: bullets.filter(Boolean),
});
const keep = (list: ArticleSection[]) => list.filter((s) => s.paragraphs.length || s.bullets.length);
const name = (t: { shortName?: string; name: string }) => teamName(t);
const link = (text: string, path: string) => `[${text}](${path})`;

/** Wins, draws and losses of a team in `results`, only at home or only away. */
function record(results: GoalResult[], teamId: number, venue: "home" | "away") {
  let w = 0;
  let d = 0;
  let l = 0;
  let gf = 0;
  let ga = 0;
  for (const r of results) {
    if (r.hg == null || r.ag == null || r[venue] !== teamId) continue;
    const f = venue === "home" ? r.hg : r.ag;
    const a = venue === "home" ? r.ag : r.hg;
    gf += f;
    ga += a;
    if (f > a) w++;
    else if (f === a) d++;
    else l++;
  }
  return { n: w + d + l, w, d, l, gf, ga };
}

/** Share of home wins, draws and away wins in `results`. */
function outcomeShares(results: GoalResult[]) {
  const done = results.filter((r) => r.hg != null && r.ag != null);
  const n = done.length;
  const h = done.filter((r) => r.hg > r.ag).length;
  const d = done.filter((r) => r.hg === r.ag).length;
  return { n, h, d, a: n - h - d };
}

// ------------------------------------------------------------------------------------ match previews

function absentsSection(m: Match): ArticleSection | null {
  const inj = m.injuries;
  if (!inj) return null;
  const H = name(m.homeTeam);
  const A = name(m.awayTeam);
  const paras: string[] = [];
  for (const [list, T] of [
    [inj.home, H],
    [inj.away, A],
  ] as const) {
    if (!list.length) continue;
    const out = list.filter((p) => !p.doubtful);
    const doubt = list.filter((p) => p.doubtful);
    const fmt = (ps: typeof list) =>
      joinIt(ps.slice(0, 6).map((p) => `${p.name} (${p.reason})`)) + (ps.length > 6 ? ` e altri ${ps.length - 6}` : "");
    const parts: string[] = [];
    if (out.length) parts.push(`${out.length === 1 ? "è fuori" : "sono fuori"} ${fmt(out)}`);
    if (doubt.length) parts.push(`${doubt.length === 1 ? "è in dubbio" : "sono in dubbio"} ${fmt(doubt)}`);
    paras.push(`${cap(prep("per", T))} ${parts.join(", mentre ")}.`);
  }
  if (!paras.length)
    paras.push(
      `Al momento nessuna delle due squadre ha giocatori infortunati o squalificati segnalati dalla fonte dei dati.`,
    );
  else if (paras.length === 1)
    paras.push(
      `${cap(the(inj.home.length ? A : H))} non ha indisponibili segnalati. Le formazioni ufficiali escono circa un'ora prima del calcio d'inizio.`,
    );
  else
    paras.push("Le formazioni ufficiali escono circa un'ora prima del calcio d'inizio e possono cambiare il quadro.");
  return sec("assenze", "Gli indisponibili", paras);
}

function venueSection(data: CompetitionData, m: Match): ArticleSection | null {
  const before = data.season.results.filter((r) => r.date < m.utcDate);
  const H = name(m.homeTeam);
  const A = name(m.awayTeam);
  const rh = record(before, m.homeTeam.id, "home");
  const ra = record(before, m.awayTeam.id, "away");
  if (rh.n < 2 && ra.n < 2) return null;
  const paras: string[] = [];
  // goals only: wins and losses at home and away are already in the "momento" section of the template
  const perGame = (r: ReturnType<typeof record>) =>
    `segna in media ${dec(r.gf / r.n)} gol e ne subisce ${dec(r.ga / r.n)} (${num(r.n, "partita", "partite")})`;
  if (rh.n >= 2 && ra.n >= 2)
    paras.push(`Sul proprio campo ${the(H)} ${perGame(rh)}; lontano da casa ${the(A)} ${perGame(ra)}.`);
  else if (rh.n >= 2) paras.push(`Sul proprio campo ${the(H)} ${perGame(rh)}.`);
  else paras.push(`Lontano da casa ${the(A)} ${perGame(ra)}.`);
  const sh = data.goalStats(m.homeTeam.id, m.utcDate).home;
  const sa = data.goalStats(m.awayTeam.id, m.utcDate).away;
  if (sh.n >= 3 && sa.n >= 3)
    paras.push(
      `Nelle partite casalinghe ${prep("di", H)} si sono visti almeno tre gol ${num(sh.over[1], "volta", "volte")} su ${sh.n} ed entrambe le squadre hanno segnato ${num(sh.btts, "volta", "volte")}; nelle trasferte ${prep("di", A)} i numeri sono ${sa.over[1]} su ${sa.n} e ${sa.btts} su ${sa.n}.`,
    );
  const o = outcomeShares(before);
  if (o.n >= 20)
    paras.push(
      `Come riferimento, in questa stagione di ${data.competition.name} le squadre di casa hanno vinto ${withArt("il", share(o.h, o.n))} delle partite, i pareggi sono stati ${withArt("il", share(o.d, o.n))} e le vittorie in trasferta ${withArt("il", share(o.a, o.n))} (${o.n} partite).`,
    );
  return sec("casa-trasferta", "In casa e in trasferta", paras);
}

function cornersSection(data: CompetitionData, m: Match): ArticleSection | null {
  const ms = data.matchStats;
  if (!ms) return null;
  const th = ms.teams[String(m.homeTeam.id)];
  const ta = ms.teams[String(m.awayTeam.id)];
  if (!th || !ta || th.n < 3 || ta.n < 3) return null;
  const H = name(m.homeTeam);
  const A = name(m.awayTeam);
  const L = ms.league;
  const perGame = (x: number, n: number) => dec(x / n);
  const cards = (t: typeof th) => perGame(t.yf + t.rf, t.n);
  const paras = [
    `${cap(the(H))} batte in media ${perGame(th.cf, th.n)} calci d'angolo a partita e ne concede ${perGame(th.ca, th.n)}; ${the(A)} ne batte ${perGame(ta.cf, ta.n)} e ne concede ${perGame(ta.ca, ta.n)}. Nel torneo la media è di ${perGame(L.cf + L.ca, L.n)} corner complessivi a partita.`,
    `Sul fronte disciplinare ${the(H)} riceve ${cards(th)} cartellini a partita e ${the(A)} ${cards(ta)}, contro una media di ${perGame(L.yf + L.ya + L.rf + L.ra, L.n)} cartellini per partita in tutto il torneo. Le classifiche complete sono nelle ${link("statistiche su corner e cartellini", cornersCardsPath(data.competition))}.`,
  ];
  return sec("corner-cartellini", "Corner e cartellini", paras);
}

function modelSection(m: Match, p: Prediction): ArticleSection {
  const H = name(m.homeTeam);
  const A = name(m.awayTeam);
  const key = `x:${m.id}`;
  const [p1, px, p2] = p.p;
  const top = topOutcome(p);
  const topP = p.p[top];
  const fav = top === 0 ? H : top === 2 ? A : null;
  let read: string;
  if (!fav) read = `Il pareggio è l'esito singolo più probabile, segno di una partita molto equilibrata.`;
  else if (topP >= 0.6) read = `Il favore del pronostico va nettamente ${prep("a", fav)}.`;
  else if (topP >= 0.45) read = `Il favore del pronostico va ${prep("a", fav)}, ma non in modo schiacciante.`;
  else read = `Il vantaggio ${prep("di", fav)} è minimo: nessun esito supera il 45% ed è una partita aperta.`;
  const goals = p.xg[0] + p.xg[1];
  const over = p.over["2.5"];
  const goalsRead =
    over >= 0.6
      ? "una partita da molti gol"
      : over <= 0.4
        ? "una partita con pochi gol"
        : "una partita senza una tendenza netta sul numero di gol";
  const [sh, sa, sp] = p.scores[0] ?? [];
  const paras = [
    pick(key, [
      `Il modello statistico di QuotaGuru stima ${dec(p.xg[0], 2)} gol attesi per ${the(H)} e ${dec(p.xg[1], 2)} per ${the(A)}. Ne derivano queste probabilità: ${pc(p1)} per la vittoria ${prep("di", H)}, ${pc(px)} per il pareggio e ${pc(p2)} per il successo ${prep("di", A)}. ${read}`,
      `Secondo il modello, ${the(H)} dovrebbe produrre ${dec(p.xg[0], 2)} gol attesi e ${the(A)} ${dec(p.xg[1], 2)}. Tradotto in probabilità: ${pc(p1)} per l'1, ${pc(px)} per la X e ${pc(p2)} per il 2. ${read}`,
    ]),
    `Con ${dec(goals, 2)} gol attesi in totale, la probabilità di vedere almeno tre gol è ${withArt("del", pc(over))} e quella che segnino entrambe le squadre ${withArt("del", pc(p.btts))}: il modello si aspetta ${goalsRead}.` +
      (sp != null
        ? ` Il risultato esatto più probabile è ${sh}-${sa}, con ${withArt("il", pc(sp))}: anche il più probabile resta poco frequente.`
        : ""),
    (p.confidence === "bassa"
      ? "Attenzione: il modello ha pochi dati su almeno una delle due squadre, quindi queste stime sono meno affidabili del solito. "
      : "") +
      `Il modello non conosce le assenze e le scelte di formazione: come funziona è spiegato nella ${link("metodologia", METHOD)}, e quante volte ci ha preso è nel ${link("bilancio dei pronostici", TRACK)}.`,
  ];
  return sec("modello", "Cosa dice il modello", paras);
}

function h2hBullets(
  m: Match,
  h2h?: {
    matches?: {
      utcDate: string;
      competition: string;
      homeTeam: { shortName?: string; name: string };
      awayTeam: { shortName?: string; name: string };
      score: { fullTime: { home: number | null; away: number | null } };
    }[];
  },
) {
  const list = [...(h2h?.matches ?? [])]
    .filter((x) => x.score.fullTime.home != null)
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 5);
  if (list.length < 2) return [];
  return list.map(
    (x) =>
      `${cap(fmtMonthYear(x.utcDate))}, ${x.competition}: ${name(x.homeTeam)} ${x.score.fullTime.home}-${x.score.fullTime.away} ${name(x.awayTeam)}`,
  );
}

/**
 * The match preview with the extra sections (absences, home and away records, corners and cards, the model's
 * reading, the list of the latest head-to-heads). Recaps are returned unchanged.
 */
export function extendPreview(
  art: Article | null,
  {
    data,
    match,
    prediction,
    h2h,
  }: { data: CompetitionData; match: Match; prediction?: Prediction; h2h?: Parameters<typeof h2hBullets>[1] },
): Article | null {
  if (!art || art.kind !== "preview" || !isUpcoming(match)) return art;
  const extra = keep(
    [
      absentsSection(match),
      venueSection(data, match),
      cornersSection(data, match),
      prediction && !prediction.pre ? modelSection(match, prediction) : null,
    ].filter((s): s is ArticleSection => !!s),
  );
  const bullets = h2hBullets(match, h2h);
  const sections = art.sections.map((s) =>
    s.id === "precedenti" && bullets.length ? { ...s, bullets: [...s.bullets, ...bullets] } : s,
  );
  const at = sections.findIndex((s) => s.id === "precedenti");
  if (at < 0) sections.push(...extra);
  else sections.splice(at, 0, ...extra);
  return { ...art, sections };
}

// ------------------------------------------------------------------------------------ competition pages

type Row = { m: Match; p: Prediction };

function roundSection(c: Competition, data: CompetitionData): { section: ArticleSection; rows: Row[] } | null {
  const round = featuredMatchday(c);
  if (!round) return null;
  const label = matchdayLabel(round);
  const played = round.matches.filter(isFinished).length;
  const open = round.matches.filter(isUpcoming);
  const rows = open.map((m) => ({ m, p: data.prediction(m.id) })).filter((r): r is Row => !!r.p && !r.p.pre);
  const paras = [
    `La ${link(label, matchdayPath(c, round))} di ${c.name} ${played === round.matches.length ? "si è giocata" : "si gioca"} ${matchdayDates(round)} e comprende ${num(round.matches.length, "partita", "partite")}` +
      (played === round.matches.length
        ? ", tutte già giocate: i risultati sono nella pagina della giornata."
        : played
          ? `, ${played === 1 ? "una delle quali è già stata giocata" : `${played} delle quali già giocate`}.`
          : ".") +
      (rows.length
        ? ` Per ${rows.length === open.length ? "tutte le partite ancora da giocare" : `${num(rows.length, "partita", "partite")} su ${open.length}`} trovi qui sotto le probabilità del modello statistico per l'esito finale, l'Under/Over e il Goal/No goal.`
        : ""),
  ];
  return { section: sec("giornata", `La ${label}`, paras), rows };
}

function roundModelSection(c: Competition, rows: Row[]): ArticleSection | null {
  if (rows.length < 3) return null;
  const nm = (r: Row) => link(`${name(r.m.homeTeam)} – ${name(r.m.awayTeam)}`, matchHref(c, r.m));
  const topP = (r: Row) => Math.max(...r.p.p);
  const goals = (r: Row) => r.p.xg[0] + r.p.xg[1];
  const by = (f: (r: Row) => number) => [...rows].sort((a, b) => f(b) - f(a));
  const clear = by(topP)[0];
  const tight = by((r) => -topP(r))[0];
  const most = by(goals)[0];
  const fewest = by((r) => -goals(r))[0];
  const btts = by((r) => r.p.btts)[0];
  const favName = (r: Row) => {
    const t = topOutcome(r.p);
    return t === 1 ? null : name(t === 0 ? r.m.homeTeam : r.m.awayTeam);
  };
  const paras: string[] = [];
  const f = favName(clear);
  if (f)
    paras.push(
      `Il pronostico più netto della giornata è ${nm(clear)}: il modello assegna ${withArt("il", pc(topP(clear)))} alla vittoria ${prep("di", f)}.`,
    );
  if (tight !== clear) {
    const [a, b, d] = tight.p.p;
    paras.push(
      `La partita più equilibrata è invece ${nm(tight)}, dove nessun esito supera ${withArt("il", pc(topP(tight)))} (${pc(a)} l'1, ${pc(b)} la X, ${pc(d)} il 2).`,
    );
  }
  const g: string[] = [];
  g.push(
    `Il match con più gol attesi è ${nm(most)}, con ${dec(goals(most), 1)} gol stimati e ${withArt("il", pc(most.p.over["2.5"]))} di probabilità di vederne almeno tre`,
  );
  if (fewest !== most) g.push(`quello più chiuso sulla carta è ${nm(fewest)}, con ${dec(goals(fewest), 1)} gol attesi`);
  paras.push(`${g.join("; ")}.`);
  if (btts !== most)
    paras.push(`La partita in cui è più probabile che segnino entrambe le squadre è ${nm(btts)} (${pc(btts.p.btts)}).`);
  const avg = rows.reduce((s, r) => s + goals(r), 0) / rows.length;
  const draws = rows.filter((r) => topOutcome(r.p) === 1).length;
  paras.push(
    `In media il modello si aspetta ${dec(avg, 1)} gol a partita in questo turno` +
      (draws ? ` e in ${num(draws, "partita", "partite")} indica il pareggio come esito più probabile.` : "."),
  );
  return sec("modello-giornata", "Cosa dice il modello", paras);
}

function roundListSection(c: Competition, rows: Row[]): ArticleSection | null {
  if (!rows.length) return null;
  const bullets = rows.map(
    ({ m, p }) =>
      `${link(`${name(m.homeTeam)} – ${name(m.awayTeam)}`, matchHref(c, m))}, ${fmtDay(m.utcDate)}: 1 ${pc(p.p[0])}, X ${pc(p.p[1])}, 2 ${pc(p.p[2])}; ${dec(p.xg[0] + p.xg[1])} gol attesi, almeno tre gol ${withArt("al", pc(p.over["2.5"]))}.`,
  );
  return sec("partite-giornata", "Le partite in sintesi", [], bullets);
}

function tableSection(c: Competition): ArticleSection | null {
  const table = mainTable(c);
  // one table only: in a competition with groups the first group says nothing about the others
  if (c.standings.length > 1 || table.length < 6 || !table[0].playedGames) return null;
  const [first, second] = table;
  const L = name(first.team);
  const gap = first.points - second.points;
  const paras: string[] = [];
  paras.push(
    `Dopo ${num(first.playedGames, "giornata", "giornate")} in testa c'è ${the(L)} con ${num(first.points, "punto", "punti")}` +
      (gap === 0
        ? `, a pari punti con ${the(name(second.team))}.`
        : `, ${num(gap, "punto", "punti")} davanti ${prep("a", name(second.team))}.`) +
      (gap === 0
        ? ` Seguono ${joinIt(table.slice(2, 4).map((r) => `${the(name(r.team))} (${r.points})`))}.`
        : ` Completano le prime quattro posizioni ${joinIt(table.slice(1, 4).map((r) => `${the(name(r.team))} (${r.points})`))}.`),
  );
  const bottom = table.slice(-3);
  paras.push(
    `In fondo alla classifica ci sono ${joinIt(bottom.map((r) => `${the(name(r.team))} (${r.points})`))}; ${the(name(table[table.length - 4].team))}, ${al(table.length - 3)} posto, ha ${table[table.length - 4].points} punti.`,
  );
  const bestAtt = [...table].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDef = [...table].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
  paras.push(
    `Il miglior attacco è quello ${prep("di", name(bestAtt.team))} con ${num(bestAtt.goalsFor, "gol", "gol")} segnati, la miglior difesa quella ${prep("di", name(bestDef.team))} con ${num(bestDef.goalsAgainst, "gol", "gol")} subiti.`,
  );
  // form: points in the last five matches
  const form = table
    .map((r) => {
      const f = recentForm(c, r.team.id, 5);
      return { r, f, pts: f.reduce((s, x) => s + (x.result === "V" ? 3 : x.result === "N" ? 1 : 0), 0) };
    })
    .filter((x) => x.f.length === 5)
    .sort((a, b) => b.pts - a.pts);
  if (form.length >= 6) {
    const hot = form[0];
    const cold = form[form.length - 1];
    paras.push(
      `Nelle ultime cinque partite la squadra più in forma è ${the(name(hot.r.team))} con ${num(hot.pts, "punto", "punti")}, quella più in difficoltà ${the(name(cold.r.team))} con ${num(cold.pts, "punto", "punti")}. La ${link("classifica completa", standingsPath(c))} ha anche la forma di ogni squadra.`,
    );
  } else paras.push(`La ${link("classifica completa", standingsPath(c))} ha anche la forma di ogni squadra.`);
  return sec("classifica", "La classifica", paras);
}

function seasonSection(c: Competition, data: CompetitionData): ArticleSection | null {
  const g = data.leagueGoalStats();
  if (g.n < 10) return null;
  const o = outcomeShares(data.season.results);
  const paras = [
    `Nelle ${g.n} partite giocate finora si sono segnati ${num(g.gf + g.ga, "gol", "gol")}, ${dec((g.gf + g.ga) / g.n, 2)} a partita. Almeno tre gol si sono visti ${withArt("nel", share(g.over[1], g.n))} delle partite ed entrambe le squadre sono andate a segno ${withArt("nel", share(g.btts, g.n))}; le squadre di casa hanno vinto ${withArt("il", share(o.h, o.n))} delle volte, i pareggi sono stati ${withArt("il", share(o.d, o.n))} e le vittorie in trasferta ${withArt("il", share(o.a, o.n))}. I dettagli squadra per squadra sono nelle ${link("statistiche Under/Over", goalStatsPath(c))}.`,
  ];
  const ms = data.matchStats;
  if (ms && ms.n >= 10) {
    const L = ms.league;
    paras.push(
      `Con i dati di ${ms.n} partite, la media è di ${dec((L.cf + L.ca) / L.n)} calci d'angolo e ${dec((L.yf + L.ya + L.rf + L.ra) / L.n)} cartellini a partita: le squadre che ne battono e ne ricevono di più sono nelle ${link("statistiche su corner e cartellini", cornersCardsPath(c))}.`,
    );
  }
  const top = c.leaders?.scorers?.[0];
  if (top && top.goals > 0) {
    const tied = c.leaders!.scorers.filter((s) => s.goals === top.goals).length;
    paras.push(
      tied === 1
        ? `In testa alla classifica marcatori c'è ${top.name}${top.team ? ` (${name({ ...top.team, name: top.team.shortName })})` : ""} con ${num(top.goals, "gol", "gol")}: ecco i ${link("marcatori", leadersPath(c))} completi.`
        : `${tied} giocatori guidano la classifica marcatori con ${num(top.goals, "gol", "gol")}: ecco i ${link("marcatori", leadersPath(c))} completi.`,
    );
  }
  return sec("numeri-stagione", "I numeri della stagione", paras);
}

function howToSection(c: Competition, track?: { n: number; hits: number }): ArticleSection {
  const key = `c:${c.slug}`;
  const paras = [
    pick(key, [
      "Per ogni partita il modello stima i gol attesi delle due squadre dalla forza in attacco e in difesa mostrata nelle partite recenti, con il vantaggio del fattore campo, e da lì ricava le probabilità di 1, X e 2, di Under/Over, di Goal/No goal e dei risultati esatti.",
      "Il modello parte dai gol attesi di ciascuna squadra, stimati dalla forza offensiva e difensiva delle partite recenti e dal fattore campo; da quei valori calcola le probabilità dell'esito finale, dell'Under/Over, del Goal/No goal e dei risultati esatti.",
    ]),
    "Una probabilità del 60% significa che, in tante partite simili, quell'esito si verifica circa sei volte su dieci: le altre quattro no. Per questo un pronostico può essere corretto nel ragionamento e sbagliato nel risultato, e nessuna stima va letta come una certezza.",
    track && track.n >= 10
      ? `Su questa competizione il modello ha indicato correttamente l'esito più probabile in ${track.hits} partite su ${track.n} (${share(track.hits, track.n)}); il dato complessivo e quello mese per mese sono nel ${link("bilancio dei pronostici", TRACK)}. Come vengono calcolate le stime è spiegato nella ${link("metodologia", METHOD)}.`
      : `Quante volte il modello ci prende è nel ${link("bilancio dei pronostici", TRACK)}, aggiornato a ogni partita; come vengono calcolate le stime è spiegato nella ${link("metodologia", METHOD)}.`,
  ];
  return sec("come-leggere", "Come leggere questi pronostici", paras);
}

/** Text of a competition page (/pronostici/serie-a): the featured round, the model, the table, the season. */
export function competitionText(data: CompetitionData, track?: { n: number; hits: number }): ArticleSection[] {
  const c = data.competition;
  const round = roundSection(c, data);
  return keep(
    [
      round?.section ?? null,
      round ? roundModelSection(c, round.rows) : null,
      round ? roundListSection(c, round.rows) : null,
      tableSection(c),
      seasonSection(c, data),
      howToSection(c, track),
    ].filter((s): s is ArticleSection => !!s),
  );
}

// ------------------------------------------------------------------------------------ day pages

/** Opening of /pronostici/oggi and /pronostici/domani. */
export function dayIntro({
  label,
  football,
  nba,
}: {
  label: string;
  football: { competition: Competition; match: Match; prediction?: Prediction }[];
  nba: { home: string; away: string; path: string; p: [number, number]; total: number }[];
}): string[] {
  if (!football.length && !nba.length) return [];
  const paras: string[] = [];
  const counts = new Map<string, number>();
  for (const { competition } of football) counts.set(competition.name, (counts.get(competition.name) ?? 0) + 1);
  const comps = [...counts].sort((a, b) => b[1] - a[1]);
  const what: string[] = [];
  if (football.length)
    what.push(
      `${num(football.length, "partita", "partite")} di calcio` +
        (comps.length > 1
          ? ` in ${comps.length} competizioni (${
              comps.length > 5
                ? `${comps
                    .slice(0, 5)
                    .map(([n, k]) => (comps[0][1] > 1 ? `${k} di ${n}` : n))
                    .join(", ")} e altre ${comps.length - 5}`
                : joinIt(comps.map(([n, k]) => (comps[0][1] > 1 ? `${k} di ${n}` : n)))
            })`
          : ` di ${comps[0][0]}`),
    );
  if (nba.length) what.push(`${num(nba.length, "partita", "partite")} NBA`);
  paras.push(
    `${cap(label)} il modello statistico di QuotaGuru ha calcolato le probabilità di ${joinIt(what)}. Per ogni partita trovi le probabilità di 1, X e 2, dell'Under/Over e del Goal/No goal; aprendo la partita ci sono i gol attesi, i risultati esatti più probabili e l'analisi con classifica, forma e precedenti.`,
  );
  const rows = football.flatMap(({ competition: c, match: m, prediction: p }) =>
    p && !p.pre && isUpcoming(m) ? [{ c, m, p }] : [],
  );
  if (rows.length >= 3) {
    const topP = (r: (typeof rows)[number]) => Math.max(...r.p.p);
    const goals = (r: (typeof rows)[number]) => r.p.xg[0] + r.p.xg[1];
    const nm = (r: (typeof rows)[number]) => link(`${name(r.m.homeTeam)} – ${name(r.m.awayTeam)}`, matchHref(r.c, r.m));
    const clear = [...rows].sort((a, b) => topP(b) - topP(a))[0];
    const tight = [...rows].sort((a, b) => topP(a) - topP(b))[0];
    const most = [...rows].sort((a, b) => goals(b) - goals(a))[0];
    const t = topOutcome(clear.p);
    const parts: string[] = [];
    if (t !== 1)
      parts.push(
        `il pronostico più netto è ${nm(clear)} (${pc(topP(clear))} per la vittoria ${prep("di", name(t === 0 ? clear.m.homeTeam : clear.m.awayTeam))} in ${clear.c.name})`,
      );
    if (tight !== clear)
      parts.push(`la partita più incerta è ${nm(tight)}, con nessun esito oltre ${withArt("il", pc(topP(tight)))}`);
    if (most !== clear && most !== tight)
      parts.push(`quella con più gol attesi è ${nm(most)} (${dec(goals(most), 1)})`);
    if (parts.length) paras.push(`${cap(parts.join("; "))}.`);
  }
  if (nba.length >= 2) {
    const fav = [...nba].sort((a, b) => Math.max(...b.p) - Math.max(...a.p))[0];
    const side = fav.p[0] >= fav.p[1] ? "della squadra di casa" : "della squadra in trasferta";
    const high = [...nba].sort((a, b) => b.total - a.total)[0];
    paras.push(
      `In NBA il pronostico più netto è ${link(`${fav.home} – ${fav.away}`, fav.path)}, con ${withArt("il", pc(Math.max(...fav.p)))} per la vittoria ${side}` +
        (high !== fav
          ? `; la partita con più punti attesi è ${link(`${high.home} – ${high.away}`, high.path)}, con ${Math.round(high.total)} punti stimati.`
          : "."),
    );
  }
  paras.push(
    `Le probabilità sono stime e non tengono conto di assenze dell'ultima ora: come vengono calcolate lo spiega la ${link("metodologia", METHOD)}, e quante volte il modello ci prende è nel ${link("bilancio dei pronostici", TRACK)}.`,
  );
  return paras;
}

export { fmtDay };

/**
 * Fixed text of /calcio: what the page shows, the competitions followed, how the predictions are made and where to
 * find standings, teams and past seasons. It does not change with the matches (the list above it does every 15
 * minutes), so the page keeps a stable description of itself.
 */
export function calcioHubText(
  competitions: { code: string; slug: string; name: string; national?: boolean }[],
  featured: Set<string>,
): ArticleSection[] {
  const hub = (c: { slug: string; name: string }) => link(c.name, `/pronostici/${c.slug}`);
  const group = (codes: string[]) =>
    joinIt(
      codes
        .map((code) => competitions.find((c) => c.code === code))
        .filter((c) => !!c)
        .map(hub),
    );
  const italian = group(["SA", "SB"]);
  const foreign = group(["PL", "PD", "BL1", "FL1"]);
  const cups = group(["CL", "EL", "ECL"]);
  const national = joinIt(competitions.filter((c) => c.national && featured.has(c.code)).map(hub));
  const others = joinIt(competitions.filter((c) => !featured.has(c.code)).map(hub));
  return keep([
    sec("cosa-trovi", "Cosa trovi in questa pagina", [
      "Il calendario delle partite dei prossimi giorni, in ordine di orario e divise per giorno. Per ogni partita ancora da giocare ci sono le probabilità dei tre esiti (1, X, 2) stimate dal modello statistico di QuotaGuru, con accanto la quota equa: 1 diviso la probabilità, cioè la quota che pagherebbe esattamente quanto rischi se la stima fosse giusta. Dal filtro dei mercati si passa a Doppia chance, Under/Over 2,5, Goal/No goal, Multigol e Combo.",
      "Le partite in corso sono in cima, con il punteggio aggiornato circa ogni 15 minuti (non in tempo reale). Con il filtro Risultati si vedono le partite finite e, per ognuna, se l'esito indicato come più probabile si è verificato.",
    ]),
    sec(
      "competizioni",
      "Le competizioni seguite",
      [
        "In questa pagina le partite sono elencate per intero per le competizioni principali; ogni competizione ha poi la sua pagina con tutte le partite, le giornate e i numeri della stagione.",
      ],
      [
        italian && `Campionati italiani: ${italian}.`,
        foreign && `Campionati esteri: ${foreign}.`,
        cups && `Coppe europee: ${cups}.`,
        national && `Nazionali: ${national}, più tutte le partite delle nazionali italiane.`,
        others &&
          `Le altre competizioni (${others}) sono riassunte in fondo all'elenco, con il numero di partite e il collegamento alla loro pagina.`,
      ],
    ),
    sec("come-nascono", "Come nascono i pronostici", [
      `Le probabilità vengono da un modello statistico (Poisson, nella variante di Dixon e Coles) che stima i gol attesi di ogni squadra dalla forza in attacco e in difesa mostrata nei risultati, tenendo conto del fattore campo e dando più peso alle partite più recenti. Il metodo, le fonti dei dati e i limiti sono spiegati nella pagina ${link("metodologia", "/metodologia")}.`,
      `Ogni pronostico viene archiviato prima del calcio d'inizio e non viene più modificato: il riquadro in cima alla pagina mostra quante volte l'esito più probabile si è verificato. Per leggere una partita oltre ai numeri ci sono le guide ${link("come analizzare una partita di calcio", "/guide/analizzare-una-partita-di-calcio")} e ${link("i mercati del calcio", "/guide/mercati-del-calcio")}.`,
    ]),
    sec(
      "altre-pagine",
      "Squadre, stagioni passate e partite in TV",
      [],
      [
        `${link("Squadre di calcio", "/calcio/squadre")}: rosa, risultati e statistiche di ogni club e nazionale.`,
        `${link("Albo d'oro e stagioni passate", "/calcio/stagioni")}: classifiche e vincitori delle stagioni precedenti.`,
        `${link("Calcio in TV oggi", "/calcio-in-tv-oggi")}: su quali canali vedere le partite di oggi in Italia.`,
      ],
    ),
  ]);
}
