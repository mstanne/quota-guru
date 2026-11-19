// External dataset of the published predictions (docs/dataset-pronostici.md): GitHub repository
// quota-guru-pronostici (each release archived by Zenodo with a DOI), Kaggle and Hugging Face.
//
// Built from the PUBLIC copy of the archive (`archivio-pronostici` branch of this repository, written by
// scripts/archive-predictions.mjs), never from the private one. Only closed months, so a version never changes.
// Every column is written here by name: no id, logo or response structure of the data provider, and no provider
// named as source. Teams are plain names, the score is two numbers (src/lib/archiveLicense.mjs).
//
//   node scripts/export-dataset.mjs --archive <copy of archivio-pronostici> --out <folder> [--until AAAA-MM]
//
// --until: last month included (default: the month before the current one, Rome time).
// Writes in <folder>: data/calcio.csv, data/nba.csv, data/calcio.json, data/nba.json, README.md (also the Hugging
// Face dataset card), LICENSE.md, CITATION.cff, .zenodo.json, dataset-metadata.json (Kaggle).
import fs from "node:fs";
import path from "node:path";
import { PREDICTIONS_LICENSE } from "../src/lib/archiveLicense.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const archive = arg("archive");
const out = arg("out");
if (!archive || !out) {
  console.error("uso: node scripts/export-dataset.mjs --archive <cartella> --out <cartella> [--until AAAA-MM]");
  process.exit(2);
}
const SITE = "https://www.quotaguru.it";
const TITLE = "Quota Guru: archivio dei pronostici";
const ROME = "Europe/Rome";
const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: ROME }).format(new Date(iso));

const thisMonth = romeDay(new Date().toISOString()).slice(0, 7);
const prevMonth = (m) => {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
};
const until = arg("until") ?? prevMonth(thisMonth);
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
if (!/^\d{4}-\d{2}$/.test(until)) fail(`--until ${until}: serve AAAA-MM`);
if (until >= thisMonth) fail(`--until ${until}: solo mesi già chiusi (prima di ${thisMonth})`);

// ------------------------------------------------------------------------------------------------ rows
function load(sport) {
  const dir = path.join(archive, sport);
  if (!fs.existsSync(dir)) return [];
  const all = [];
  for (const f of fs.readdirSync(dir).filter((n) => /^\d{4}-\d{2}\.json$/.test(n))) {
    const list = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!Array.isArray(list)) throw new Error(`${sport}/${f}: non è la copia pubblica (serve un elenco, senza id)`);
    all.push(...list);
  }
  // the month of the match in Rome, as on the site
  return all
    .filter((e) => romeDay(e.kickoff).slice(0, 7) <= until)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.url.localeCompare(b.url));
}
const teams = (label) => {
  const [home, away] = label.split(" – ");
  if (!home || !away) throw new Error(`partita senza le due squadre: ${label}`);
  return { home: home.trim(), away: away.trim() };
};
const r3 = (x) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : "");
const SIGNS_1X2 = ["1", "X", "2"];
const SIGNS_12 = ["1", "2"];
const common = (e, signs) => {
  const t = teams(e.label);
  const done = e.result && Number.isInteger(e.result.home);
  return {
    date: romeDay(e.kickoff),
    kickoff_utc: e.kickoff.replace(/\.\d{3}Z$/, "Z"),
    competition: e.where,
    home_team: t.home,
    away_team: t.away,
    first_published_utc: e.firstPublished,
    published_utc: e.published,
    versions: e.versions,
    pick: signs[e.pick.index],
    pick_probability: r3(e.pick.prob),
    _done: done,
    _t: t,
  };
};
const tail = (e, row, signs, scoreCols) => {
  const done = row._done;
  delete row._done;
  delete row._t;
  return {
    ...row,
    [scoreCols[0]]: done ? e.result.home : "",
    [scoreCols[1]]: done ? e.result.away : "",
    outcome: done ? signs[e.result.index] : "",
    pick_correct: done ? e.hit === true : "",
    url: e.url,
  };
};
const football = load("calcio").map((e) => {
  const p = e.prediction ?? {};
  const row = common(e, SIGNS_1X2);
  const top = p.scores?.[0];
  return tail(
    e,
    {
      ...row,
      national_teams: e.national === true,
      prob_home: r3(p.p?.[0]),
      prob_draw: r3(p.p?.[1]),
      prob_away: r3(p.p?.[2]),
      prob_over_1_5: r3(p.over?.["1.5"]),
      prob_over_2_5: r3(p.over?.["2.5"]),
      prob_over_3_5: r3(p.over?.["3.5"]),
      prob_btts: r3(p.btts),
      expected_goals_home: p.xg?.[0] ?? "",
      expected_goals_away: p.xg?.[1] ?? "",
      most_likely_score: top ? `${top[0]}-${top[1]}` : "",
      confidence: p.confidence ?? "",
    },
    SIGNS_1X2,
    ["home_goals", "away_goals"],
  );
});
const nba = load("nba").map((e) => {
  const p = e.prediction ?? {};
  const row = common(e, SIGNS_12);
  return tail(
    e,
    {
      ...row,
      prob_home: r3(p.p?.[0]),
      prob_away: r3(p.p?.[1]),
      expected_points_home: p.pts?.[0] ?? "",
      expected_points_away: p.pts?.[1] ?? "",
      expected_total: p.total ?? "",
      expected_margin: p.margin ?? "",
      confidence: p.confidence ?? "",
    },
    SIGNS_12,
    ["home_points", "away_points"],
  );
});

// ------------------------------------------------------------------------------------------------ files
const csvCell = (v) => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows) => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
};
const write = (f, text) => {
  const p = path.join(out, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
};
fs.rmSync(out, { recursive: true, force: true });
write("data/calcio.csv", csv(football));
write("data/nba.csv", csv(nba));
write("data/calcio.json", JSON.stringify(football, null, 1) + "\n");
write("data/nba.json", JSON.stringify(nba, null, 1) + "\n");

const all = [...football, ...nba];
const first = all.map((r) => r.date).sort()[0] ?? `${until}-01`;
const last =
  all
    .map((r) => r.date)
    .sort()
    .at(-1) ?? `${until}-01`;
const graded = (rows) => rows.filter((r) => r.pick_correct !== "");
const rate = (rows) => {
  const g = graded(rows);
  return g.length ? `${Math.round((100 * g.filter((r) => r.pick_correct).length) / g.length)}%` : "–";
};
const version = until.replace("-", ".");
const today = romeDay(new Date().toISOString());
const n = all.length;
const sizeCat = n < 1000 ? "n<1K" : n < 10000 ? "1K<n<10K" : n < 100000 ? "10K<n<100K" : "100K<n<1M";
const KEYWORDS = [
  "pronostici calcio",
  "pronostici NBA",
  "football predictions",
  "soccer",
  "basketball",
  "probabilistic forecasting",
  "sports analytics",
  "track record",
];
const DESCRIPTION =
  "Ogni pronostico pubblicato da Quota Guru (www.quotaguru.it) su calcio e NBA, salvato prima dell'inizio della " +
  "partita e mai modificato dopo: probabilità del modello, esito indicato, ore di pubblicazione, risultato finale e " +
  "se il pronostico era giusto.";

write(
  "README.md",
  `---
license: cc-by-nc-4.0
language:
- it
- en
pretty_name: "${TITLE}"
size_categories:
- ${sizeCat}
task_categories:
- tabular-classification
tags:
- sports
- football
- soccer
- basketball
- nba
- forecasting
- probabilistic-forecasting
configs:
- config_name: calcio
  data_files: data/calcio.csv
- config_name: nba
  data_files: data/nba.csv
---

# ${TITLE}

${DESCRIPTION} Bilancio aggiornato ogni giorno su [${SITE.replace("https://", "")}/bilancio-pronostici](${SITE}/bilancio-pronostici).

*Every prediction published by Quota Guru (Italian football and NBA predictions site), saved before kick-off and never
changed afterwards: model probabilities, pick, publication times, final score and whether the pick was right.*

- **Periodo:** dal ${first} al ${last} (versione ${version}, generata il ${today}).
- **Calcio:** ${football.length} partite, ${graded(football).length} con risultato, esito indicato giusto nel ${rate(football)} dei casi.
- **NBA:** ${nba.length} partite, ${graded(nba).length} con risultato, esito indicato giusto nel ${rate(nba)} dei casi.
- **Aggiornamento:** una nuova versione all'inizio di ogni mese, con il mese appena chiuso.

## Come sono fatti i pronostici

Calcio: modello di Poisson sui gol attesi di ciascuna squadra (forza in attacco e in difesa, fattore campo), da cui
derivano le probabilità di 1X2, Under/Over, Goal e del risultato esatto. NBA: modello dei punti attesi delle due
squadre. Il metodo è spiegato su [${SITE.replace("https://", "")}/metodologia](${SITE}/metodologia).

Il pronostico di una partita può cambiare finché la partita non comincia (nuove formazioni, infortuni, dati
aggiornati): \`versions\` dice quante volte è cambiato, \`published_utc\` è l'ultima versione prima del via, ed è
quella valutata. La prova delle ore di pubblicazione è la cronologia dei commit del branch
[\`archivio-pronostici\`](https://github.com/mstanne/quota-guru/tree/archivio-pronostici), aggiornato a ogni
pubblicazione.

## File

| file | contenuto |
|---|---|
| \`data/calcio.csv\`, \`data/calcio.json\` | una riga per partita di calcio (club e nazionali) |
| \`data/nba.csv\`, \`data/nba.json\` | una riga per partita NBA |

Orari in UTC (ISO 8601), \`date\` è il giorno della partita in Italia. Probabilità tra 0 e 1. Le partite rinviate o
annullate restano, con le colonne del risultato vuote.

### Colonne comuni

| colonna | significato |
|---|---|
| \`date\`, \`kickoff_utc\` | giorno (ora italiana) e ora di inizio (UTC) |
| \`competition\`, \`home_team\`, \`away_team\` | competizione e squadre |
| \`first_published_utc\`, \`published_utc\`, \`versions\` | prima pubblicazione, ultima versione prima del via, numero di versioni |
| \`pick\`, \`pick_probability\` | esito indicato come più probabile (\`1\`, \`X\`, \`2\`) e sua probabilità |
| \`outcome\`, \`pick_correct\` | esito finale e se l'esito indicato era giusto |
| \`url\` | pagina della partita su Quota Guru |

### Solo calcio

\`national_teams\` (partita tra nazionali), \`prob_home\`, \`prob_draw\`, \`prob_away\` (1X2), \`prob_over_1_5\`,
\`prob_over_2_5\`, \`prob_over_3_5\`, \`prob_btts\` (entrambe segnano), \`expected_goals_home\`, \`expected_goals_away\`,
\`most_likely_score\`, \`confidence\` (\`alta\`, \`media\`, \`bassa\`), \`home_goals\`, \`away_goals\` (90 minuti).

### Solo NBA

\`prob_home\`, \`prob_away\`, \`expected_points_home\`, \`expected_points_away\`, \`expected_total\`, \`expected_margin\`,
\`confidence\`, \`home_points\`, \`away_points\`.

## Licenza e citazione

I pronostici (probabilità, esiti indicati, bilancio) sono di Quota Guru e sono rilasciati con licenza
[Creative Commons Attribuzione - Non commerciale 4.0 (CC BY-NC 4.0)](${PREDICTIONS_LICENSE.url}): si possono
riutilizzare per scopi non commerciali citando Quota Guru con un link a ${SITE.replace("https://", "")}. Data, squadre e
risultato finale delle partite sono fatti pubblici e non sono coperti dalla licenza.

Per citare il dataset: *Quota Guru (${until.slice(0, 4)}). ${TITLE}, versione ${version}. ${SITE}/bilancio-pronostici*
(il DOI di Zenodo, quando c'è, è nella pagina della release).

I pronostici sono stime statistiche, non consigli di gioco. Il gioco è vietato ai minori e può causare dipendenza.
`,
);

write(
  "LICENSE.md",
  `# Licenza

I pronostici contenuti in questo dataset (probabilità, esiti indicati, bilancio) sono di Quota Guru
(${SITE}) e sono rilasciati con licenza Creative Commons Attribuzione - Non commerciale 4.0 Internazionale
(CC BY-NC 4.0).

Testo della licenza: ${PREDICTIONS_LICENSE.url}
Legal code: https://creativecommons.org/licenses/by-nc/4.0/legalcode

Attribuzione richiesta: "Quota Guru (${SITE.replace("https://", "")})", con un link a ${SITE}.

Data, squadre e risultato finale delle partite sono fatti pubblici e non sono coperti dalla licenza.
`,
);

write(
  "CITATION.cff",
  `cff-version: 1.2.0
message: "Se usi questi dati, cita Quota Guru con un link a ${SITE}."
type: dataset
title: "${TITLE}"
version: "${version}"
date-released: "${today}"
license: CC-BY-NC-4.0
url: "${SITE}/bilancio-pronostici"
repository-code: "https://github.com/mstanne/quota-guru-pronostici"
authors:
  - name: "Quota Guru"
    website: "${SITE}"
keywords:
${KEYWORDS.map((k) => `  - "${k}"`).join("\n")}
abstract: "${DESCRIPTION}"
`,
);

write(
  ".zenodo.json",
  JSON.stringify(
    {
      title: TITLE,
      upload_type: "dataset",
      description: `<p>${DESCRIPTION}</p><p>Bilancio aggiornato ogni giorno: <a href="${SITE}/bilancio-pronostici">${SITE}/bilancio-pronostici</a>.</p>`,
      creators: [{ name: "Quota Guru" }],
      license: "cc-by-nc-4.0",
      access_right: "open",
      language: "ita",
      keywords: KEYWORDS,
      version,
      related_identifiers: [
        { identifier: `${SITE}/bilancio-pronostici`, relation: "isDocumentedBy", resource_type: "other" },
        { identifier: `${SITE}/metodologia`, relation: "isDescribedBy", resource_type: "other" },
        { identifier: SITE, relation: "isSupplementTo", resource_type: "other" },
      ],
    },
    null,
    2,
  ) + "\n",
);

// Kaggle has no CC BY-NC 4.0 among its licence ids: "other", with the licence in the description
const kaggleUser = process.env.KAGGLE_USERNAME || "quotaguru";
write(
  "dataset-metadata.json",
  JSON.stringify(
    {
      title: "Quota Guru football and NBA predictions",
      subtitle: "Every published prediction, saved before kick-off, with results",
      id: `${kaggleUser}/quota-guru-pronostici`,
      licenses: [{ name: "other" }],
      keywords: ["football", "basketball", "sports", "time series"],
      description: fs.readFileSync(path.join(out, "README.md"), "utf8").replace(/^---[\s\S]*?---\n+/, ""),
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `Dataset fino a ${until} (versione ${version}): calcio ${football.length} partite, NBA ${nba.length} → ${out}`,
);
