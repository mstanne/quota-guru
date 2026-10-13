// Editorial engine for match pages (football, NBA, tennis).
//
// Pure, deterministic JavaScript shared by the site (rendering, SSR) and by the agent
// (scripts/generate-editorial.mjs). Every sentence is built from a data value: if the value is
// missing, the sentence is left out. No predictions, no betting calls to action.
//
// Article shape:
//   { key, sport, kind: "preview" | "recap", title, sections: [{ id, title, paragraphs[], bullets[] }],
//     faq: [{ q, a }], note, fingerprint, source: "template" }
// Text fields may contain internal links written as [testo](/percorso).

const TZ = "Europe/Rome";
const DAY_MS = 86400000;
/** Previews are shown only for matches within this many days of the data snapshot. */
export const PREVIEW_WINDOW_DAYS = 14;

// ------------------------------------------------------------------------------------ text helpers

/** FNV-1a 32-bit hash (same result in Node and in the browser). */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Deterministic choice of a phrasing variant: same match → same text, different matches → variety. */
const pick = (key, options) => options[parseInt(hash(key), 36) % options.length];

const num = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const dec = (x, d = 1) => x.toFixed(d).replace(".", ",");
/** "al 4° posto", "all'8° posto", "all'11° posto". */
const al = (n) => (n === 8 || n === 11 || (n >= 80 && n < 90) ? `all'${n}°` : `al ${n}°`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const joinIt = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`);

const fmtDay = (iso) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
const fmtDate = (iso) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, day: "numeric", month: "long" }).format(new Date(iso));
const fmtTime = (iso) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const fmtMonthYear = (iso) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: TZ, month: "long", year: "numeric" }).format(new Date(iso));

const previewNote = (generatedAt) => `Testi aggiornati al ${fmtDate(generatedAt)}. Non costituisce un pronostico.`;
const recapNote = (generatedAt) => `Testi aggiornati al ${fmtDate(generatedAt)}.`;

// ------------------------------------------------------------------------------------ Italian articles

/** Names as they are written in Italian texts (the data uses English short names). */
const DISPLAY = {
  "Como 1907": "Como",
  "Venezia FC": "Venezia",
  "Man City": "Manchester City",
  "Man United": "Manchester United",
  Atleti: "Atlético Madrid",
  "Barça": "Barcellona",
  Bayern: "Bayern Monaco",
  PSG: "Paris Saint-Germain",
  Shaktar: "Shakhtar",
  "Sl. Bratislava": "Slovan Bratislava",
  "PAE AEK": "AEK Atene",
  "Brighton Hove": "Brighton",
  Nottingham: "Nottingham Forest",
};
const FEMININE = new Set([
  "Juventus", "Roma", "Lazio", "Fiorentina", "Atalanta", "Udinese", "Inter", "Sampdoria",
  "Cremonese", "Salernitana", "Reggiana", "Ternana", "Triestina", "Spal",
]);

export const teamName = (t) => DISPLAY[t.shortName] ?? t.shortName ?? t.name;

/** Definite article of a club: la Juventus, l'Inter, lo Sporting, il Milan. */
function article(n) {
  const c0 = n.charAt(0).toLowerCase();
  const c1 = n.charAt(1).toLowerCase();
  if ("aeiouàèéìòù".includes(c0) || c0 === "h") return "l'";
  if (FEMININE.has(n)) return "la ";
  if (c0 === "z" || c0 === "x" || (c0 === "s" && !"aeiou".includes(c1)) || ["gn", "ps", "pn"].includes(n.slice(0, 2).toLowerCase()))
    return "lo ";
  return "il ";
}
const PREP = {
  di: { "il ": "del ", "lo ": "dello ", "la ": "della ", "l'": "dell'" },
  a: { "il ": "al ", "lo ": "allo ", "la ": "alla ", "l'": "all'" },
  da: { "il ": "dal ", "lo ": "dallo ", "la ": "dalla ", "l'": "dall'" },
  per: { "il ": "per il ", "lo ": "per lo ", "la ": "per la ", "l'": "per l'" },
};
const the = (n, upper = false) => (upper ? cap(article(n) + n) : article(n) + n);
const prep = (p, n) => PREP[p][article(n)] + n;

/** NBA teams are plural: i Celtics, gli Hawks, gli Spurs. */
function nbaArt(n) {
  const c0 = n.charAt(0).toLowerCase();
  const c1 = n.charAt(1).toLowerCase();
  if ("aeiouh".includes(c0) || (c0 === "s" && !"aeiou".includes(c1)) || c0 === "z") return "gli ";
  return "i ";
}
const NBA_PREP = {
  di: { "i ": "dei ", "gli ": "degli " },
  a: { "i ": "ai ", "gli ": "agli " },
  da: { "i ": "dai ", "gli ": "dagli " },
  per: { "i ": "per i ", "gli ": "per gli " },
};
const nbaName = (t) => t.shortName || t.name;
const nThe = (n, upper = false) => (upper ? cap(nbaArt(n) + n) : nbaArt(n) + n);
const nPrep = (p, n) => NBA_PREP[p][nbaArt(n)] + n;

// ------------------------------------------------------------------------------------ article helpers

function finalize(article) {
  article.sections = article.sections.filter((s) => s.paragraphs.length || s.bullets.length);
  const { key, sections, faq, title } = article;
  article.fingerprint = hash(JSON.stringify({ key, title, sections, faq }));
  article.source = "template";
  return article;
}
const section = (id, title, paragraphs = [], bullets = []) => ({ id, title, paragraphs, bullets });

// ------------------------------------------------------------------------------------ football

const isFinished = (m) => m.status === "FINISHED" || m.status === "AWARDED";
const isUpcoming = (m) => m.status === "SCHEDULED" || m.status === "TIMED";

function roundText(comp, m) {
  const stages = {
    PLAYOFFS: "playoff",
    LAST_16: "ottavi di finale",
    QUARTER_FINALS: "quarti di finale",
    SEMI_FINALS: "semifinali",
    FINAL: "finale",
  };
  if (m.stage === "LEAGUE_STAGE" && m.matchday) return `la ${m.matchday}ª giornata della fase a campionato di ${comp.name}`;
  if (stages[m.stage]) return `${m.stage === "FINAL" ? "la" : "i"} ${stages[m.stage]} di ${comp.name}`;
  if (m.matchday) return `la ${m.matchday}ª giornata di ${comp.name}`;
  return comp.name;
}

function teamResult(m, teamId) {
  const ft = m.score.fullTime;
  const home = m.homeTeam.id === teamId;
  const gf = home ? ft.home : ft.away;
  const ga = home ? ft.away : ft.home;
  return { gf, ga, r: gf > ga ? "V" : gf === ga ? "N" : "P", home };
}

function teamGames(comp, teamId, before) {
  return comp.matches
    .filter((m) => isFinished(m) && m.utcDate < before && (m.homeTeam.id === teamId || m.awayTeam.id === teamId))
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .map((m) => teamResult(m, teamId));
}

const tableOf = (comp) => comp.standings?.[0]?.table ?? [];
const rowOf = (comp, teamId) => tableOf(comp).find((r) => r.team.id === teamId);

function tally(seq) {
  const v = seq.filter((x) => x === "V").length;
  const n = seq.filter((x) => x === "N").length;
  const p = seq.filter((x) => x === "P").length;
  return joinIt([v && num(v, "vittoria", "vittorie"), n && num(n, "pareggio", "pareggi"), p && num(p, "sconfitta", "sconfitte")].filter(Boolean));
}

function momentParagraph(comp, match, team, home) {
  const games = teamGames(comp, team.id, match.utcDate);
  if (!games.length) return null;
  const T = teamName(team);
  const last5 = games.slice(-5);
  const seq = last5.map((g) => g.r);
  const gf = last5.reduce((s, g) => s + g.gf, 0);
  const ga = last5.reduce((s, g) => s + g.ga, 0);
  let s;
  if (last5.length === 1) {
    const g = last5[0];
    s = `${the(T, true)} ha giocato finora una sola partita di ${comp.name}, ${{ V: "vinta", N: "pareggiata", P: "persa" }[g.r]} ${g.gf}-${g.ga}.`;
  } else {
    s =
      `Nelle ultime ${last5.length} partite di ${comp.name} ${the(T)} ha raccolto ${tally(seq)} ` +
      `(sequenza ${seq.join("-")}), con ${num(gf, "gol fatto", "gol fatti")} e ${num(ga, "subito", "subiti")}.`;
  }
  const all = games.map((g) => g.r);
  const last = all.at(-1);
  let run = 0;
  for (let i = all.length - 1; i >= 0 && all[i] === last; i--) run++;
  let unbeaten = 0;
  for (let i = all.length - 1; i >= 0 && all[i] !== "P"; i--) unbeaten++;
  if (last === "V" && run >= 3) s += ` È reduce da ${run} vittorie consecutive.`;
  else if (unbeaten >= 4) s += ` Non perde da ${unbeaten} partite.`;
  else if (last === "P" && run >= 2) s += ` Ha perso le ultime ${run}.`;
  const venue = games.filter((g) => g.home === home);
  if (venue.length >= 2) {
    const w = venue.filter((g) => g.r === "V").length;
    const d = venue.filter((g) => g.r === "N").length;
    const l = venue.filter((g) => g.r === "P").length;
    const parts = [w && num(w, "vittoria", "vittorie"), d && num(d, "pareggio", "pareggi"), l && num(l, "sconfitta", "sconfitte")].filter(Boolean);
    const where = home ? "In casa" : "In trasferta";
    if (w === venue.length) s += ` ${where} ha vinto tutte le ${venue.length} partite giocate.`;
    else if (l === venue.length) s += ` ${where} ha perso tutte le ${venue.length} partite giocate.`;
    else {
      s += ` ${where} il bilancio stagionale è di ${joinIt(parts)}`;
      s += !w ? ", ancora senza vittorie." : !l ? ", senza sconfitte." : ".";
    }
  }
  return s;
}

/**
 * Preview of an upcoming match (null when the match is not upcoming or too far in the future).
 * @param {{ comp: object, match: object, h2h?: object, generatedAt: string }} input
 */
export function footballPreview({ comp, match: m, h2h, generatedAt }) {
  if (!isUpcoming(m)) return null;
  if (new Date(m.utcDate) - new Date(generatedAt) > PREVIEW_WINDOW_DAYS * DAY_MS) return null;
  const H = teamName(m.homeTeam);
  const A = teamName(m.awayTeam);
  const key = `fb:${m.id}`;
  const day = fmtDay(m.utcDate);
  const hour = fmtTime(m.utcDate);
  const rnd = roundText(comp, m);
  const rh = rowOf(comp, m.homeTeam.id);
  const ra = rowOf(comp, m.awayTeam.id);

  let lead = pick(key, [
    `${H} e ${A} si affrontano ${day} alle ${hour} per ${rnd}.`,
    `${cap(day)} alle ${hour} ${the(H)} ospita ${the(A)} per ${rnd}.`,
    `Appuntamento ${day} alle ${hour}: ${the(H)} riceve ${the(A)} per ${rnd}.`,
  ]);
  if (rh && ra && rh.playedGames && ra.playedGames) {
    const near = Math.abs(rh.position - ra.position) <= 2 && Math.min(rh.position, ra.position) <= 4;
    if (near)
      lead += ` È uno scontro di alta classifica: ${the(H)} è ${al(rh.position)} posto con ${num(rh.points, "punto", "punti")}, ${the(A)} ${al(ra.position)} con ${ra.points}.`;
    else if (rh.points === ra.points) lead += ` Le due squadre sono appaiate a ${num(rh.points, "punto", "punti")}.`;
    else
      lead += ` In classifica ${the(H)} è ${al(rh.position)} posto con ${num(rh.points, "punto", "punti")}, ${the(A)} ${al(ra.position)} con ${ra.points}.`;
  }

  const moment = [momentParagraph(comp, m, m.homeTeam, true), momentParagraph(comp, m, m.awayTeam, false)].filter(Boolean);

  const bullets = [];
  if (rh && ra && Math.min(rh.playedGames, ra.playedGames) >= 3) {
    bullets.push(`Media gol segnati: ${H} ${dec(rh.goalsFor / rh.playedGames)}, ${A} ${dec(ra.goalsFor / ra.playedGames)} a partita.`);
    bullets.push(`Gol subiti finora: ${H} ${rh.goalsAgainst}, ${A} ${ra.goalsAgainst}.`);
    const table = tableOf(comp);
    const maxGf = Math.max(...table.map((r) => r.goalsFor));
    const minGa = Math.min(...table.map((r) => r.goalsAgainst));
    for (const [r, T] of [[rh, H], [ra, A]]) {
      if (r.goalsFor === maxGf && table.filter((x) => x.goalsFor === maxGf).length === 1) bullets.push(`${the(T, true)} ha il miglior attacco del torneo.`);
      if (r.goalsAgainst === minGa && table.filter((x) => x.goalsAgainst === minGa).length === 1) bullets.push(`${the(T, true)} ha la miglior difesa del torneo.`);
    }
  }
  for (const [team, T] of [[m.homeTeam, H], [m.awayTeam, A]]) {
    const last5 = teamGames(comp, team.id, m.utcDate).slice(-5);
    if (last5.length < 3) continue;
    const over = last5.filter((g) => g.gf + g.ga >= 3).length;
    const clean = last5.filter((g) => g.ga === 0).length;
    const of = (k) => (k === last5.length ? `tutte le ultime ${k}` : `${k} delle ultime ${last5.length}`);
    if (over >= 3) bullets.push(`In ${of(over)} partite ${prep("di", T)} si sono segnati almeno tre gol.`);
    if (clean >= 3) bullets.push(`${the(T, true)} non ha subito gol in ${of(clean)}.`);
  }

  const h2hParas = [];
  if (h2h?.matches?.length) {
    const hm = h2h.matches;
    let wh = 0;
    let wa = 0;
    let draws = 0;
    for (const x of hm) {
      const ft = x.score.fullTime;
      if (ft.home === ft.away) draws++;
      else ((ft.home > ft.away ? x.homeTeam : x.awayTeam).id === m.homeTeam.id ? wh++ : wa++);
    }
    const last = [...hm].sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0];
    const goals = hm.reduce((s, x) => s + x.score.fullTime.home + x.score.fullTime.away, 0);
    h2hParas.push(
      `Negli ultimi ${hm.length} confronti diretti il bilancio è di ${num(wh, "vittoria", "vittorie")} ${prep("per", H)}, ` +
        `${num(wa, "vittoria", "vittorie")} ${prep("per", A)} e ${draws ? num(draws, "pareggio", "pareggi") : "nessun pareggio"}, ` +
        `con ${goals} gol complessivi (media di ${dec(goals / hm.length)} a partita). ` +
        `L'ultimo incrocio, a ${fmtMonthYear(last.utcDate)} in ${last.competition}, è finito ` +
        `${teamName(last.homeTeam)} ${last.score.fullTime.home}-${last.score.fullTime.away} ${teamName(last.awayTeam)}.`,
    );
  }

  return finalize({
    key,
    sport: "calcio",
    kind: "preview",
    title: `${H} – ${A}: anteprima`,
    sections: [
      section("presentazione", "La partita", [lead]),
      section("momento", "Il momento delle due squadre", moment),
      section("numeri", "I numeri chiave", [], bullets),
      section("precedenti", "I precedenti", h2hParas),
    ],
    faq: [
      { q: `Quando si gioca ${H} – ${A}?`, a: `${cap(day)} alle ${hour}, ora italiana.` },
      {
        q: "Dove vedo classifica e risultati?",
        a: `Nella pagina [${comp.name}](/calcio/${comp.slug}) e nella [classifica aggiornata](/calcio/${comp.slug}/classifica).`,
      },
      {
        q: "Come si leggono le quote di questa partita?",
        a: "Lo spiegano le guide [come leggere le quote](/guide/come-leggere-le-quote) e [i mercati del calcio](/guide/mercati-del-calcio).",
      },
    ],
    note: previewNote(generatedAt),
  });
}

/** Recap of a finished match. */
export function footballRecap({ comp, match: m, generatedAt }) {
  if (!isFinished(m) || m.score.fullTime.home == null) return null;
  const H = teamName(m.homeTeam);
  const A = teamName(m.awayTeam);
  const key = `fb:${m.id}`;
  const { home: hg, away: ag } = m.score.fullTime;
  const ht = m.score.halfTime;
  const hasHt = ht && ht.home != null;
  const diff = hg - ag;
  let lead;
  let htSaid = false;
  if (diff === 0) {
    if (hg === 0) lead = pick(key, [`Finisce senza gol tra ${the(H)} e ${the(A)}.`, `Reti inviolate tra ${the(H)} e ${the(A)}: 0-0.`]);
    else if (hasHt && ht.home !== ht.away) {
      const [leader, chaser] = ht.home > ht.away ? [H, A] : [A, H];
      lead = `Finisce ${hg}-${ag}: ${the(leader)}, avanti all'intervallo ${ht.home}-${ht.away}, si fa raggiungere nella ripresa ${prep("da", chaser)}.`;
      htSaid = true;
    } else lead = `${the(H, true)} e ${the(A)} si dividono la posta con un ${hg}-${ag}.`;
  } else {
    const [win, lose] = diff > 0 ? [H, A] : [A, H];
    const where = diff > 0 ? "in casa" : "in trasferta";
    const htd = hasHt ? ht.home - ht.away : 0;
    if (htd !== 0 && htd > 0 !== diff > 0) {
      lead = `Rimonta ${prep("di", win)}: sotto all'intervallo, vince ${where} ${hg}-${ag} contro ${the(lose)}.`;
    } else if (Math.abs(diff) >= 3) lead = `Vittoria larga ${prep("di", win)}, che supera ${the(lose)} ${where} ${hg}-${ag}.`;
    else if (Math.abs(diff) === 1)
      lead = pick(key, [
        `${the(win, true)} vince di misura ${where} contro ${the(lose)}: ${hg}-${ag}.`,
        `Successo di misura ${prep("di", win)} ${where}: ${hg}-${ag} contro ${the(lose)}.`,
      ]);
    else lead = `${the(win, true)} batte ${the(lose)} ${where} ${hg}-${ag}.`;
  }
  lead += ` La partita, valida per ${roundText(comp, m)}, si è giocata ${fmtDay(m.utcDate)}`;
  lead += hasHt && !htSaid ? `; il primo tempo si era chiuso ${ht.home}-${ht.away}.` : ".";

  const rh = rowOf(comp, m.homeTeam.id);
  const ra = rowOf(comp, m.awayTeam.id);
  const table = [];
  if (rh && ra)
    table.push(
      `Con le partite giocate finora ${the(H)} è ${al(rh.position)} posto con ${num(rh.points, "punto", "punti")} ` +
        `e ${the(A)} ${al(ra.position)} con ${ra.points}. [Classifica completa](/calcio/${comp.slug}/classifica).`,
    );

  const next = [];
  for (const t of [m.homeTeam, m.awayTeam]) {
    const x = comp.matches
      .filter((y) => isUpcoming(y) && y.utcDate > m.utcDate && (y.homeTeam.id === t.id || y.awayTeam.id === t.id))
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
    if (!x) continue;
    const atHome = x.homeTeam.id === t.id;
    const opp = atHome ? x.awayTeam : x.homeTeam;
    next.push(
      `${the(teamName(t), true)} tornerà in campo ${fmtDay(x.utcDate)} alle ${fmtTime(x.utcDate)} ${atHome ? "in casa contro" : "in trasferta contro"} ${the(teamName(opp))}.`,
    );
  }

  return finalize({
    key,
    sport: "calcio",
    kind: "recap",
    title: `${H} ${hg}-${ag} ${A}: com'è andata`,
    sections: [
      section("resoconto", "La partita", [lead]),
      section("classifica", "La classifica", table),
      section("prossimi", "I prossimi impegni", next.length ? [next.join(" ")] : []),
    ],
    faq: [
      { q: `Com'è finita ${H} – ${A}?`, a: hasHt ? `${hg}-${ag} (${ht.home}-${ht.away} all'intervallo).` : `${hg}-${ag}.` },
      { q: "Dove trovo gli altri risultati?", a: `Nella pagina [${comp.name}](/calcio/${comp.slug}).` },
    ],
    note: recapNote(generatedAt),
  });
}

/** Preview or recap, depending on the match status. */
export const footballArticle = (input) => footballRecap(input) ?? footballPreview(input);

// ------------------------------------------------------------------------------------ NBA

const involves = (g, id) => g.home.id === id || g.away.id === id;

function nbaRecord(games, teamId, before) {
  const done = games
    .filter((g) => g.status === "final" && g.utcDate < before && involves(g, teamId) && g.score.home != null)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  const rows = done.map((g) => {
    const home = g.home.id === teamId;
    const pf = home ? g.score.home : g.score.away;
    const pa = home ? g.score.away : g.score.home;
    return { home, pf, pa, w: pf > pa };
  });
  return rows;
}

export function nbaPreview({ game: g, games, season, generatedAt }) {
  if (g.status !== "scheduled") return null;
  if (new Date(g.utcDate) - new Date(generatedAt) > PREVIEW_WINDOW_DAYS * DAY_MS) return null;
  const H = nbaName(g.home);
  const A = nbaName(g.away);
  const key = `nba:${g.id}`;
  const day = fmtDay(g.utcDate);
  const hour = fmtTime(g.utcDate);
  const seasonText = `${season}-${String(season + 1).slice(2)}`;
  const phase = g.postseason ? "dei playoff NBA" : `della regular season NBA ${seasonText}`;
  const recH = nbaRecord(games, g.home.id, g.utcDate);
  const recA = nbaRecord(games, g.away.id, g.utcDate);

  let lead = pick(key, [
    `${nThe(A, true)} fanno visita ${nPrep("a", H)} ${day} alle ${hour}, ora italiana, in una partita ${phase}.`,
    `${cap(day)} alle ${hour}, ora italiana, ${nThe(H)} ospitano ${nThe(A)} in una partita ${phase}.`,
  ]);
  if (!recH.length && !recA.length) lead += " Per entrambe è la prima partita della stagione.";

  const moment = [];
  for (const [rec, T, home] of [[recH, H, true], [recA, A, false]]) {
    if (!rec.length) continue;
    const w = rec.filter((r) => r.w).length;
    const last = rec.slice(-5);
    const lw = last.filter((r) => r.w).length;
    let s = `${nThe(T, true)} hanno un record di ${w}-${rec.length - w} in stagione`;
    if (rec.length > last.length) s += ` e hanno vinto ${lw} delle ultime ${last.length}`;
    s += `, con una media di ${dec(rec.reduce((x, r) => x + r.pf, 0) / rec.length)} punti segnati e ${dec(rec.reduce((x, r) => x + r.pa, 0) / rec.length)} subiti.`;
    const venue = rec.filter((r) => r.home === home);
    if (venue.length >= 2) {
      const vw = venue.filter((r) => r.w).length;
      s += ` ${home ? "In casa" : "In trasferta"} il bilancio è ${vw}-${venue.length - vw}.`;
    }
    moment.push(s);
  }

  const bullets = [];
  const start = new Date(g.utcDate);
  for (const t of [g.home, g.away]) {
    const T = nbaName(t);
    const b2b = games.some((x) => x.id !== g.id && involves(x, t.id) && start - new Date(x.utcDate) > 0 && start - new Date(x.utcDate) <= 30 * 3600 * 1000);
    if (b2b) bullets.push(`${nThe(T, true)} giocano la seconda partita in due giorni (back-to-back).`);
    const n7 = games.filter((x) => involves(x, t.id) && new Date(x.utcDate) - start >= 0 && new Date(x.utcDate) - start <= 7 * DAY_MS).length;
    bullets.push(`Nei 7 giorni a partire da questa partita ${nThe(T)} hanno in calendario ${num(n7, "gara", "gare")}.`);
  }

  return finalize({
    key,
    sport: "basket",
    kind: "preview",
    title: `${g.home.name} – ${g.away.name}: anteprima`,
    sections: [
      section("presentazione", "La partita", [lead]),
      section("momento", "Il momento delle due squadre", moment),
      section("calendario", "Il calendario", [], bullets),
    ],
    faq: [
      { q: `A che ora si gioca ${g.home.name} – ${g.away.name} in Italia?`, a: `${cap(day)} alle ${hour}.` },
      { q: "Come funzionano totali e handicap nel basket?", a: "Vedi la guida [basket: Over/Under e handicap](/guide/basket-over-under-handicap)." },
      { q: "Come è organizzata la stagione NBA?", a: "Vedi [regular season, play-in e playoff](/guide/nba-stagione-play-in-playoff)." },
    ],
    note: previewNote(generatedAt),
  });
}

export function nbaRecap({ game: g, generatedAt }) {
  if (g.status !== "final" || g.score.home == null) return null;
  const H = nbaName(g.home);
  const A = nbaName(g.away);
  const key = `nba:${g.id}`;
  const { home: hs, away: as } = g.score;
  const [win, lose] = hs > as ? [H, A] : [A, H];
  const per = g.periods;
  const ot = per ? per.home.length - 4 : 0;
  let lead = `${nThe(win, true)} battono ${nThe(lose)} ${Math.max(hs, as)}-${Math.min(hs, as)}`;
  lead += ot === 1 ? " dopo un tempo supplementare." : ot > 1 ? ` dopo ${ot} tempi supplementari.` : ".";
  lead += ` La partita si è giocata ${fmtDay(g.utcDate)}.`;
  const story = [];
  const bullets = [`Punti totali: ${hs + as}.`];
  if (per && per.home.length >= 4) {
    const hh = per.home[0] + per.home[1];
    const ha = per.away[0] + per.away[1];
    if (hh === ha) story.push(`All'intervallo il punteggio era in parità, ${hh}-${ha}.`);
    else {
      const ahead = hh > ha ? H : A;
      let s = `All'intervallo conducevano ${nThe(ahead)} ${Math.max(hh, ha)}-${Math.min(hh, ha)}`;
      s += ahead !== win ? `: ${nThe(win)} hanno rimontato ${Math.abs(hh - ha)} punti di svantaggio nella ripresa.` : ".";
      story.push(s);
    }
    let big = 0;
    for (let i = 1; i < per.home.length; i++) if (Math.abs(per.home[i] - per.away[i]) > Math.abs(per.home[big] - per.away[big])) big = i;
    const qd = per.home[big] - per.away[big];
    if (qd !== 0) {
      const label = big < 4 ? `nel ${big + 1}º quarto` : `nel ${big - 3}º supplementare`;
      story.push(`Il parziale più netto è arrivato ${label}, vinto ${nPrep("da", qd > 0 ? H : A)} ${Math.max(per.home[big], per.away[big])}-${Math.min(per.home[big], per.away[big])}.`);
    }
    bullets.push(`Parziali (${H}–${A}): ${per.home.map((h, i) => `${h}-${per.away[i]}`).join(", ")}.`);
  }
  return finalize({
    key,
    sport: "basket",
    kind: "recap",
    title: `${g.home.name} ${hs}-${as} ${g.away.name}: com'è andata`,
    sections: [section("resoconto", "La partita", [lead, ...story]), section("numeri", "I numeri", [], bullets)],
    faq: [
      { q: `Com'è finita ${g.home.name} – ${g.away.name}?`, a: `${hs}-${as} per ${nThe(win)}.` },
      { q: "Dove trovo le altre partite NBA?", a: "Nella pagina [Basket](/basket/nba)." },
    ],
    note: recapNote(generatedAt),
  });
}

export const nbaArticle = (input) => nbaRecap(input) ?? nbaPreview(input);

// ------------------------------------------------------------------------------------ tennis
// Ready for a real tennis feed (not connected yet). Expected input:
// { match: { id, utcDate, status: "scheduled"|"final", tournament, round, surface, bestOf,
//            p1: { name, rank, last10Wins, surfaceWins, surfaceLosses }, p2: {...}, h2h: { p1Wins, p2Wins },
//            score?: { sets: [[6,4],[3,6],...] }, winner?: "p1"|"p2" }, generatedAt }

export function tennisArticle({ match: t, generatedAt }) {
  const key = `tennis:${t.id}`;
  const a = t.p1;
  const b = t.p2;
  if (t.status === "final" && t.score?.sets?.length && t.winner) {
    const [w, l] = t.winner === "p1" ? [a, b] : [b, a];
    const sets = t.score.sets.map(([x, y]) => (t.winner === "p1" ? `${x}-${y}` : `${y}-${x}`)).join(", ");
    return finalize({
      key,
      sport: "tennis",
      kind: "recap",
      title: `${a.name} – ${b.name}: com'è andata`,
      sections: [section("resoconto", "La partita", [`${w.name} supera ${l.name} ${sets} nei ${t.round} del ${t.tournament}.`])],
      faq: [{ q: `Com'è finita ${a.name} – ${b.name}?`, a: `${w.name} ha vinto ${sets}.` }],
      note: recapNote(generatedAt),
    });
  }
  const day = fmtDay(t.utcDate);
  const lead = `${a.name} e ${b.name} si affrontano ${day} nei ${t.round} del ${t.tournament}, su ${t.surface}, al meglio dei ${t.bestOf} set.`;
  const ranks = a.rank && b.rank ? ` ${a.name} è numero ${a.rank} del ranking, ${b.name} numero ${b.rank}.` : "";
  const moment = [a, b]
    .filter((p) => p.last10Wins != null)
    .map((p) => `${p.name} ha vinto ${p.last10Wins} delle ultime 10 partite; ${p.surfaceWins != null ? `sul ${t.surface} in stagione il bilancio è ${p.surfaceWins}-${p.surfaceLosses}.` : ""}`.trim());
  const h2h = t.h2h && t.h2h.p1Wins + t.h2h.p2Wins > 0
    ? [`Nei confronti diretti il bilancio è di ${t.h2h.p1Wins}-${t.h2h.p2Wins} per ${t.h2h.p1Wins >= t.h2h.p2Wins ? a.name : b.name}.`]
    : [];
  return finalize({
    key,
    sport: "tennis",
    kind: "preview",
    title: `${a.name} – ${b.name}: anteprima`,
    sections: [section("presentazione", "La partita", [lead + ranks]), section("momento", "Il momento", moment), section("precedenti", "I precedenti", h2h)],
    faq: [
      { q: "Quanti set si giocano?", a: `Al meglio dei ${t.bestOf}: vince chi ne conquista ${Math.floor(t.bestOf / 2) + 1}. Vedi [i tornei di tennis](/guide/tornei-di-tennis).` },
    ],
    note: previewNote(generatedAt),
  });
}

// ------------------------------------------------------------------------------------ checks

/** Expressions never allowed in editorial texts (promotional or betting calls to action). */
export const BANNED = [
  /\bscommett[aei]\b/i, /\bpunta(te)? su\b/i, /\bgioca(te)? ora\b/i, /\bvinci\b/i, /\bvincita sicura\b/i, /\bsicur[oa] al\b/i,
  /\bpronostic[oi] (sicur|vincent)/i, /\bgratis\b/i, /\bgratuit[oa]\b/i, /\bbonus\b/i, /\bimperdibile\b/i, /\bgarantit[oa]\b/i,
  /\bquota d'oro\b/i, /\bcolpo sicuro\b/i, /\braddoppia\b/i, /\bfacile\b/i, /\bsoldi\b/i,
];
const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
const NUMBER = /\d+(?:[.,]\d+)?/g;

export const textsOf = (art) => [
  art.title,
  ...art.sections.flatMap((s) => [s.title, ...s.paragraphs, ...s.bullets]),
  ...art.faq.flatMap((f) => [f.q, f.a]),
];

/** Problems of an article (empty list = ok). With `reference`, also checks that numbers and links come from it. */
export function checkArticle(art, reference) {
  const problems = [];
  const texts = textsOf(art);
  for (const t of texts) {
    if (typeof t !== "string" || !t.trim()) problems.push("testo vuoto");
    else {
      for (const re of BANNED) if (re.test(t)) problems.push(`espressione non ammessa: ${t.match(re)[0]}`);
      if (/<[a-z/][^>]*>/i.test(t)) problems.push("contiene HTML");
      if (/\*\*|__|^#/m.test(t)) problems.push("contiene formattazione markdown");
      if (/\b(undefined|null|NaN)\b/.test(t)) problems.push(`valore mancante nel testo: ${t.slice(0, 60)}`);
    }
  }
  if (reference) {
    const refText = textsOf(reference).join(" ");
    const allowedNums = new Set(refText.match(NUMBER) ?? []);
    const allowedLinks = new Set([...refText.matchAll(LINK)].map((m) => m[2]));
    for (const t of texts) {
      for (const n of t.match(NUMBER) ?? []) if (!allowedNums.has(n)) problems.push(`numero non presente nei dati: ${n}`);
      for (const m of t.matchAll(LINK)) if (!allowedLinks.has(m[2])) problems.push(`link non previsto: ${m[2]}`);
    }
    const ids = (x) => x.sections.map((s) => s.id).join(",");
    if (ids(art) !== ids(reference)) problems.push("sezioni diverse dal modello");
    const len = (x) => textsOf(x).join(" ").length;
    const ratio = len(art) / Math.max(len(reference), 1);
    if (ratio < 0.6 || ratio > 1.8) problems.push(`lunghezza anomala (${ratio.toFixed(2)}× il modello)`);
  }
  return [...new Set(problems)];
}

/**
 * Applies an AI rewrite stored by the agent, only if it was made from the current template
 * (same fingerprint) – otherwise the template text is used.
 */
export function withRewrite(art, rewrite) {
  if (!art || !rewrite || rewrite.fingerprint !== art.fingerprint) return art;
  return {
    ...art,
    sections: art.sections.map((s) => {
      const r = rewrite.sections.find((x) => x.id === s.id);
      return r ? { ...s, paragraphs: r.paragraphs ?? s.paragraphs, bullets: r.bullets ?? s.bullets } : s;
    }),
    faq: rewrite.faq?.length === art.faq.length ? rewrite.faq : art.faq,
    source: "ai",
  };
}
