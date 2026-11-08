// Broadcasters' schedule of the site (src/data/tv-schedule.json), kept by the daily agent
// (scripts/offers-agent/ISTRUZIONI.md, "Palinsesto TV").
//
//   node scripts/tv-schedule.mjs list [--days 2]   matches of the next days (from today, Rome time) with their key,
//                                                   what the rights deals say and what the schedule says now.
//                                                   Data: the `dati` branch (git fetch origin dati) when present,
//                                                   so the list is fresh even when main is a few days behind.
//   node scripts/tv-schedule.mjs check             validates the file (run in `npm run build`); --strict also
//                                                   fails on entries older than 3 days (used by the agent).
//
// Exit code 1 when the file has errors.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHANNELS, footballBroadcast, nbaBroadcast } from "../src/lib/broadcast.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(root, "src", "data", "tv-schedule.json");
const args = process.argv.slice(2);
const cmd = args[0] ?? "list";
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const romeDay = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date(iso));
const romeTime = (iso) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
// same slugs as src/lib/footballCore.ts (matchPath) and src/lib/nbaPaths.ts (gamePath)
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const matchKey = (c, m) =>
  `/calcio/${c.slug}/${slugify(m.homeTeam.shortName)}-${slugify(m.awayTeam.shortName)}-${romeDay(m.utcDate)}`;
const gameKey = (g) =>
  `/basket/nba/${slugify(g.home.shortName || g.home.name)}-${slugify(g.away.shortName || g.away.name)}-${romeDay(g.utcDate)}`;

const schedule = () => JSON.parse(fs.readFileSync(FILE, "utf8"));

function readData(rel) {
  try {
    return { data: JSON.parse(execFileSync("git", ["show", `origin/dati:${rel}`], { cwd: root, maxBuffer: 1 << 28 })), from: "ramo dati" };
  } catch {
    return { data: JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")), from: "file locale (può essere vecchio)" };
  }
}

function list() {
  const days = Number(opt("days", "2"));
  const today = romeDay(new Date().toISOString());
  const last = romeDay(new Date(Date.now() + (days - 1) * 86400000).toISOString());
  const inWindow = (iso) => romeDay(iso) >= today && romeDay(iso) <= last;
  const tv = schedule();
  const { data: football, from } = readData("src/data/football.json");
  console.log(`Partite dal ${today} al ${last} (dati: ${from}, aggiornati al ${football.generatedAt})\n`);
  for (const c of football.competitions) {
    const rows = c.matches.filter((m) => inWindow(m.utcDate) && !["POSTPONED", "CANCELLED"].includes(m.status));
    if (!rows.length) continue;
    console.log(`## ${c.name}`);
    for (const m of rows) {
      const round = c.matches.filter((x) => x.matchday != null && x.matchday === m.matchday && x.stage === m.stage).map((x) => x.utcDate);
      const rule = footballBroadcast(c.slug, m.utcDate, round);
      const key = matchKey(c, m);
      const now = tv.football[key];
      console.log(
        `- ${romeDay(m.utcDate)} ${romeTime(m.utcDate)} ${m.homeTeam.shortName} – ${m.awayTeam.shortName}\n` +
          `  chiave: ${key}\n` +
          `  accordi: ${rule ? rule.channels + (rule.note ? ` (DA VERIFICARE: ${rule.note})` : "") : "nessun accordo noto"}\n` +
          `  palinsesto: ${now ? `${now.channels} (controllato il ${now.verifiedAt})` : "—"}`,
      );
    }
    console.log("");
  }
  const { data: basket } = readData("src/data/basket.json");
  const games = (basket.games ?? basket.nba?.games ?? []).filter((g) => inWindow(g.utcDate));
  if (games.length) {
    console.log("## NBA");
    for (const g of games) {
      const key = gameKey(g);
      const now = tv.nba[key];
      console.log(
        `- ${romeDay(g.utcDate)} ${romeTime(g.utcDate)} ${g.home.shortName || g.home.name} – ${g.away.shortName || g.away.name}\n` +
          `  chiave: ${key}\n  accordi: ${nbaBroadcast().channels} (DA VERIFICARE: ${nbaBroadcast().note})\n` +
          `  palinsesto: ${now ? `${now.channels} (controllato il ${now.verifiedAt})` : "—"}`,
      );
    }
  }
}

function check() {
  const strict = args.includes("--strict");
  const errors = [];
  const warnings = [];
  let tv;
  try {
    tv = schedule();
  } catch (e) {
    console.error(`tv-schedule.json non leggibile: ${e.message}`);
    process.exit(1);
  }
  const today = romeDay(new Date().toISOString());
  const ageDays = (d) => (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${d}T12:00:00Z`)) / 86400000;
  for (const [sport, prefix] of [
    ["football", /^\/calcio\/[a-z0-9-]+\/[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/],
    ["nba", /^\/basket\/nba\/[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/],
  ]) {
    if (!tv[sport] || typeof tv[sport] !== "object") {
      errors.push(`manca la sezione "${sport}"`);
      continue;
    }
    for (const [key, e] of Object.entries(tv[sport])) {
      const where = `${sport} ${key}`;
      if (!prefix.test(key)) errors.push(`${where}: chiave non valida (usa la "chiave" di tv-schedule.mjs list)`);
      if (typeof e.channels !== "string" || !e.channels.trim()) errors.push(`${where}: channels mancante`);
      else {
        const names = e.channels.split(/,| e /).map((s) => s.replace(/\(.*?\)/g, "").trim()).filter(Boolean);
        for (const n of names)
          if (!CHANNELS.includes(n)) errors.push(`${where}: canale "${n}" non nell'elenco (src/lib/broadcast.ts CHANNELS)`);
      }
      if (typeof e.source !== "string" || !/^https:\/\//.test(e.source)) errors.push(`${where}: source deve essere un link https`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.verifiedAt ?? "")) errors.push(`${where}: verifiedAt deve essere AAAA-MM-GG`);
      else if (ageDays(e.verifiedAt) < -1) errors.push(`${where}: verifiedAt nel futuro`);
      const day = key.slice(-10);
      if (ageDays(day) > 3) (strict ? errors : warnings).push(`${where}: partita di più di 3 giorni fa, da togliere`);
    }
  }
  for (const w of warnings) console.warn(`avviso: ${w}`);
  for (const e of errors) console.error(`errore: ${e}`);
  console.log(`Palinsesto TV: ${Object.keys(tv.football ?? {}).length + Object.keys(tv.nba ?? {}).length} partite, ${errors.length} errori, ${warnings.length} avvisi`);
  if (errors.length) process.exit(1);
}

if (cmd === "list") list();
else if (cmd === "check") check();
else {
  console.error("Uso: node scripts/tv-schedule.mjs list [--days 2] | check [--strict]");
  process.exit(1);
}
