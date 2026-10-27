// Editorial agent for match pages (football + NBA; tennis is ready in the engine but has no data feed yet).
//
// What it does, on every data refresh (GitHub Actions, after the data download):
//   1. builds the template texts for every match from the downloaded data (src/lib/editorial/engine.mjs)
//      and checks them (banned expressions, missing values, markup);
//   2. OPTIONAL – only if ANTHROPIC_API_KEY is set: asks Claude to rewrite the template texts in more
//      natural Italian, using only the facts they contain. Each rewrite is checked automatically
//      (numbers and links must come from the template, same structure, no banned expressions, length);
//      rejected rewrites are discarded and the template text stays online;
//   3. writes the accepted rewrites to src/data/editorial-ai.json (the site shows a rewrite only while
//      it matches the current template; otherwise the template text is used).
//
// Without the key the agent only checks the templates and writes an empty rewrites file:
// the site works exactly the same, with the template texts.
//
// Environment (all optional):
//   ANTHROPIC_API_KEY     Claude API key (GitHub secret; a service account key scoped to a workspace is best).
//                         Sent only in the "Authorization: Bearer" header, never logged.
//   ANTHROPIC_WORKSPACE_ID workspace id (wrkspc_…), needed only when the key is not scoped to a workspace.
//   EDITORIAL_AI          "off" to disable the rewrite even if the key is set.
//   EDITORIAL_AI_MODEL    model id (default below).
//   EDITORIAL_AI_EFFORT   reasoning effort for the 5.x models: low (default), medium, high.
//   EDITORIAL_AI_MAX      max NEW rewrites per run (default 40) – caps cost and run time.
//   ANTHROPIC_API_URL     API endpoint (default https://api.anthropic.com/v1/messages; used by tests).
//
// Files: reads src/data/football.json and basket.json; writes src/data/editorial-ai.json;
// keeps a cache of rewrites in .cache/editorial-ai.json (git-ignored, restored by actions/cache) so
// unchanged texts are not rewritten (and paid for) again.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkArticle, footballArticle, nbaArticle, withRewrite } from "../src/lib/editorial/engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(root, "src", "data");
const OUT = path.join(DATA, "editorial-ai.json");
const CACHE = path.join(root, ".cache", "editorial-ai.json");
const DEFAULT_MODEL = "claude-haiku-5-5";
// a rewrite with strict rules needs little reasoning: "low" keeps it fast and cheap (EDITORIAL_AI_EFFORT to change it)
const EFFORT = process.env.EDITORIAL_AI_EFFORT?.trim() || "low";
const EFFORT_MODELS = /^claude-(haiku|sonnet|opus)-5|^claude-(fable|mythos)/;
const WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
const RECAP_AI_DAYS = 3; // recaps are rewritten only for matches of the last few days

function loadDotEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};

/** Atomic write: temp file in the same folder, then rename. */
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 1) + "\n");
  fs.renameSync(tmp, file);
}

// ------------------------------------------------------------------------------------ articles

function buildArticles() {
  const fb = readJson(path.join(DATA, "football.json"), null);
  const bk = readJson(path.join(DATA, "basket.json"), null);
  const list = [];
  if (fb) {
    fb.competitions.forEach((comp, ci) => {
      for (const match of comp.matches) {
        const art = footballArticle({ comp, match, h2h: fb.headToHead?.[String(match.id)], generatedAt: fb.generatedAt });
        if (art) list.push({ art, date: match.utcDate, priority: ci, generatedAt: fb.generatedAt });
      }
    });
  }
  if (bk) {
    for (const game of bk.nba.games) {
      const art = nbaArticle({ game, games: bk.nba.games, season: bk.nba.season, generatedAt: bk.generatedAt });
      if (art) list.push({ art, date: game.utcDate, priority: 50, generatedAt: bk.generatedAt });
    }
  }
  return list;
}

/** Texts worth rewriting first: previews by kick-off, then recent recaps; main competitions first. */
function aiCandidates(list) {
  return list
    .filter(({ art, date, generatedAt }) =>
      art.kind === "preview" ? true : new Date(generatedAt) - new Date(date) <= RECAP_AI_DAYS * 86400000,
    )
    .sort((a, b) => (a.art.kind === b.art.kind ? 0 : a.art.kind === "preview" ? -1 : 1) || a.priority - b.priority || a.date.localeCompare(b.date));
}

// ------------------------------------------------------------------------------------ Claude

const SYSTEM = `Sei un redattore sportivo di QuotaGuru, sito informativo italiano che confronta le quote degli operatori autorizzati.
Riscrivi i testi che ricevi in un italiano naturale e scorrevole, mantenendo esattamente le stesse informazioni.

Regole vincolanti:
1. Usa solo i fatti presenti nel testo ricevuto: non aggiungere nomi, numeri, date, giocatori, allenatori, infortuni, stadi, curiosità o giudizi.
2. Ogni numero che scrivi deve comparire identico nel testo ricevuto (stesso formato: 1,5 – 20:45 – 7ª).
3. Mantieni tutti i link nel formato [testo](/percorso) con gli stessi percorsi; puoi cambiare solo il testo del link.
4. Nessun pronostico, nessun invito a scommettere o a giocare, nessun linguaggio promozionale (ad esempio "bonus", "gratis", "vinci", "sicuro", "imperdibile").
5. Tono neutro e informativo, frasi chiare, lunghezza simile all'originale.
6. Niente markdown (grassetti, titoli, elenchi) né HTML.

Rispondi solo con JSON valido di questa forma:
{"sections":[{"id":"...","paragraphs":["..."],"bullets":["..."]}],"faq":[{"q":"...","a":"..."}]}
Mantieni gli stessi id di sezione, lo stesso numero di paragrafi e di voci di elenco per ogni sezione e lo stesso numero di domande.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiUrl() {
  const url = new URL(process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages");
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("ANTHROPIC_API_URL deve usare https");
  return url.toString();
}

class FatalApiError extends Error {}

async function askClaude(art, { key, model, url }, attempt = 1) {
  const payload = {
    title: art.title,
    sections: art.sections.map(({ id, title, paragraphs, bullets }) => ({ id, title, paragraphs, bullets })),
    faq: art.faq,
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "anthropic-version": "2023-06-01",
        ...(WORKSPACE ? { "anthropic-workspace-id": WORKSPACE } : {}),
      },
      body: JSON.stringify({
        model,
        // the 5.x models think before answering and the thinking counts toward max_tokens
        max_tokens: 4000,
        // no temperature: the 5.x models reject it; effort only on the models that support it
        ...(EFFORT_MODELS.test(model) ? { output_config: { effort: EFFORT } } : {}),
        system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
    });
  } catch (err) {
    if (attempt < 3) return sleep(2000 * attempt).then(() => askClaude(art, { key, model, url }, attempt + 1));
    throw new Error(`rete: ${err.name === "AbortError" ? "timeout" : err.message}`);
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 || res.status === 403) throw new FatalApiError(`chiave non valida o non autorizzata (HTTP ${res.status})`);
  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    await sleep(Number(res.headers.get("retry-after")) * 1000 || 5000 * attempt);
    return askClaude(art, { key, model, url }, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const text = (body.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

/** Validates the structure of Claude's answer and returns a rewrite, or a list of problems. */
function toRewrite(art, answer) {
  const problems = [];
  if (!answer || !Array.isArray(answer.sections)) return { problems: ["risposta senza sezioni"] };
  const sections = [];
  for (const s of art.sections) {
    const r = answer.sections.find((x) => x?.id === s.id);
    if (!r) {
      problems.push(`sezione mancante: ${s.id}`);
      continue;
    }
    const paragraphs = Array.isArray(r.paragraphs) ? r.paragraphs : [];
    const bullets = Array.isArray(r.bullets) ? r.bullets : [];
    if (paragraphs.length !== s.paragraphs.length || bullets.length !== s.bullets.length) problems.push(`struttura diversa nella sezione ${s.id}`);
    sections.push({ id: s.id, paragraphs, bullets });
  }
  const faq = Array.isArray(answer.faq) ? answer.faq.filter((f) => typeof f?.q === "string" && typeof f?.a === "string") : [];
  if (faq.length !== art.faq.length) problems.push("numero di domande diverso");
  const rewrite = { fingerprint: art.fingerprint, sections, faq };
  const rewritten = withRewrite(art, rewrite);
  problems.push(...checkArticle(rewritten, art));
  return problems.length ? { problems } : { rewrite };
}

// ------------------------------------------------------------------------------------ main

async function main() {
  loadDotEnv();
  const list = buildArticles();
  const byKind = list.reduce((acc, { art }) => ((acc[`${art.sport} ${art.kind}`] = (acc[`${art.sport} ${art.kind}`] ?? 0) + 1), acc), {});
  console.log(`Testi a modelli: ${list.length}`, byKind);

  // 1. template self-check
  let templateIssues = 0;
  for (const { art } of list) {
    const problems = checkArticle(art);
    if (problems.length) {
      templateIssues++;
      console.warn(`  [modello] ${art.key}: ${problems.join("; ")}`);
    }
  }
  console.log(templateIssues ? `Controllo modelli: ${templateIssues} testi con problemi (vedi sopra).` : "Controllo modelli: nessun problema.");

  // 2. optional rewrite
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  const enabled = key && process.env.EDITORIAL_AI !== "off";
  const model = process.env.EDITORIAL_AI_MODEL?.trim() || DEFAULT_MODEL;
  const max = Math.max(0, Number(process.env.EDITORIAL_AI_MAX ?? 40) || 0);
  const cache = readJson(CACHE, {});
  const stats = { reused: 0, new: 0, rejected: 0, errors: 0, skipped: 0 };
  const items = {};

  if (!enabled) {
    console.log(key ? "Riscrittura con Claude disattivata (EDITORIAL_AI=off): restano i testi a modelli." : "Claude non collegato (ANTHROPIC_API_KEY non impostata): restano i testi a modelli.");
  } else {
    const opts = { key, model, url: apiUrl() };
    let budget = max;
    let stop = false;
    for (const { art } of aiCandidates(list)) {
      const hit = cache[art.key];
      if (hit && hit.fingerprint === art.fingerprint) {
        if (hit.rejected) stats.rejected++;
        else {
          items[art.key] = { fingerprint: hit.fingerprint, sections: hit.sections, faq: hit.faq };
          stats.reused++;
        }
        continue;
      }
      if (stop || budget <= 0) {
        stats.skipped++;
        continue;
      }
      budget--;
      try {
        const { rewrite, problems } = toRewrite(art, await askClaude(art, opts));
        if (rewrite) {
          items[art.key] = rewrite;
          cache[art.key] = { ...rewrite, model, at: new Date().toISOString() };
          stats.new++;
        } else {
          cache[art.key] = { fingerprint: art.fingerprint, rejected: true, problems, model, at: new Date().toISOString() };
          stats.rejected++;
          console.warn(`  [scartato] ${art.key}: ${problems.slice(0, 3).join("; ")}`);
        }
      } catch (err) {
        stats.errors++;
        console.warn(`  [errore] ${art.key}: ${err.message}`);
        if (err instanceof FatalApiError) stop = true;
      }
    }
    // keep the cache small: only texts that still exist
    const live = new Set(list.map(({ art }) => art.key));
    for (const k of Object.keys(cache)) if (!live.has(k)) delete cache[k];
    writeJson(CACHE, cache);
    console.log(
      `Claude (${model}): ${stats.new} nuovi, ${stats.reused} riutilizzati, ${stats.rejected} scartati dai controlli, ` +
        `${stats.errors} errori, ${stats.skipped} rimandati al prossimo giro (limite ${max} per esecuzione).`,
    );
  }

  writeJson(OUT, { generatedAt: enabled ? new Date().toISOString() : null, model: enabled ? model : null, items });
  console.log(`Salvato src/data/editorial-ai.json: ${Object.keys(items).length} testi riscritti.`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      "### Contenuti editoriali",
      "",
      `- Testi a modelli: ${list.length} (problemi: ${templateIssues})`,
      enabled
        ? `- Claude (${model}): ${stats.new} nuovi, ${stats.reused} riutilizzati, ${stats.rejected} scartati, ${stats.errors} errori, ${stats.skipped} rimandati`
        : "- Claude non collegato: pubblicati i testi a modelli",
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  }
}

main().catch((err) => {
  console.error("Agente editoriale non riuscito:", err.message);
  process.exit(1);
});
