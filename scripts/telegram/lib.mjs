// Shared helpers of the Telegram channel publisher (scripts/telegram/publish.mjs): Rome time, formatting, data
// loading (from the `dati` and `archivio-pronostici` branches through the GitHub API, or from local folders),
// the compliance filter, the register of sent posts and the call to the Telegram Bot API.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SITE = "https://www.quotaguru.it";
export const FOOTER = "18+ | Il gioco può causare dipendenza. Aiuto gratuito e anonimo: 800 558 822";

// ---------------------------------------------------------------------------------------------- Rome time
const romeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
/** Calendar parts of an instant in Rome: { day: "2026-11-06", time: "20:45", minutes, weekday (0 = Sunday) }. */
export function rome(ms) {
  const p = Object.fromEntries(romeFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return {
    day: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
    weekday: WEEKDAYS[p.weekday],
  };
}
/** Offset of Rome from UTC (minutes) at an instant: 60 in winter, 120 in summer. */
const romeOffset = (ms) => {
  const r = rome(ms);
  const asUtc = Date.parse(`${r.day}T${r.time}:00Z`);
  return Math.round((asUtc - Math.floor(ms / 60000) * 60000) / 60000);
};
/** Instant of a Rome wall-clock time, e.g. romeInstant("2026-11-06", "09:30"). */
export function romeInstant(day, time) {
  const guess = Date.parse(`${day}T${time}:00Z`);
  const ms = guess - romeOffset(guess) * 60000;
  return ms - (romeOffset(ms) - romeOffset(guess)) * 60000;
}
/** Rome day `n` days after `day` ("2026-11-06" + 1 → "2026-11-07"). */
export const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

const DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
/** "venerdì 6 novembre" */
export function dayLabel(day) {
  const d = new Date(`${day}T12:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
/** "Sab 20:45" */
export const shortDayTime = (iso) => {
  const r = rome(Date.parse(iso));
  return `${SHORT_DAYS[r.weekday]} ${r.time}`;
};

// ---------------------------------------------------------------------------------------------- formatting
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
export const pct = (p) => `${Math.round(p * 100)}%`;
/** Site link with the UTM tags of the rubric, so GA4 counts the visits of every rubric. */
export const link = (p, campaign) =>
  `${SITE}${p.split("#")[0]}${p.includes("?") ? "&" : "?"}utm_source=telegram&utm_medium=social&utm_campaign=${campaign}${p.includes("#") ? `#${p.split("#")[1]}` : ""}`;
export const anchor = (p, text, campaign) => `<a href="${esc(link(p, campaign))}">${esc(text)}</a>`;

// ---------------------------------------------------------------------------------------------- data
const readJsonFile = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const repo = () => process.env.GITHUB_REPOSITORY || "mstanne/quota-guru";
const ghHeaders = (accept = "application/vnd.github.raw+json") => ({
  Accept: accept,
  "User-Agent": "quotaguru-telegram",
  ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}),
});
/** A file of a branch of the repository, parsed; null when it does not exist. */
async function branchJson(branch, file) {
  const res = await fetch(`https://api.github.com/repos/${repo()}/contents/${file}?ref=${branch}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${branch}/${file}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Data the rubrics read:
 *   football, basket   last data downloaded by the site (`dati` branch: src/data/football.json, basket.json)
 *   archive.calcio/nba every prediction the site published, with result and hit once graded
 *                      (`archivio-pronostici` branch, files of the previous, current and next month)
 * Local runs: TG_DATA_DIR (a folder holding src/data/…) and TG_ARCHIVE_DIR (a copy of archivio-pronostici).
 */
export async function loadData(nowMs) {
  const r = rome(nowMs);
  const months = [-1, 0, 1].map((n) => {
    const d = new Date(Date.UTC(Number(r.day.slice(0, 4)), Number(r.day.slice(5, 7)) - 1 + n, 1));
    return d.toISOString().slice(0, 7);
  });
  const dataDir = process.env.TG_DATA_DIR;
  const archDir = process.env.TG_ARCHIVE_DIR;
  const data = async (f) => (dataDir ? readJsonFile(path.join(dataDir, f)) : branchJson("dati", f));
  const arch = async (f) => {
    if (!archDir) return branchJson("archivio-pronostici", f);
    const p = path.join(archDir, f);
    return fs.existsSync(p) ? readJsonFile(p) : null;
  };
  const [football, basket, ...files] = await Promise.all([
    data("src/data/football.json"),
    data("src/data/basket.json"),
    ...months.flatMap((m) => [arch(`calcio/${m}.json`), arch(`nba/${m}.json`)]),
  ]);
  const archive = { calcio: [], nba: [] };
  files.forEach((f, i) => archive[i % 2 ? "nba" : "calcio"].push(...Object.values(f ?? {})));
  return { football, basket, archive };
}

// ---------------------------------------------------------------------------------------------- compliance
// Decreto Dignità (art. 9 DL 87/2018): no advertising of gambling, not even indirect. Every post is checked before it
// is sent: no operator names, no promotions, no calls to bet, no links outside the site. A post that fails is not sent.
const OPERATORS = [
  "eurobet",
  "goldbet",
  "planetwin",
  "planetwin365",
  "bet365",
  "betsson",
  "bwin",
  "sisal",
  "codere",
  "888",
  "admiralbet",
  "admiral",
  "leovegas",
  "lottomatica",
  "snai",
  "betfair",
  "william hill",
  "betflag",
  "netbet",
  "starcasino",
  "unibet",
  "betway",
  "better",
  "pokerstars",
];
const BANNED = [
  /\bbonus\b/i,
  /\bfree ?bet\b/i,
  /\bcashback\b/i,
  /\bcodic[ei] promo/i,
  /\bpromo\b/i,
  /quote? maggiorat/i,
  /\bgioca (ora|subito|qui)\b/i,
  /\bpunta (ora|subito|su|qui)\b/i,
  /\bscommetti (ora|subito|su|qui)\b/i,
  /\bdeposita\b/i,
  /\bregistrati\b/i,
  /\bvincita sicura\b/i,
  /\bsicur[oa] al 100\b/i,
];
function operatorNames() {
  const names = new Set(OPERATORS);
  try {
    for (const o of readJsonFile(path.join(root, "src/data/offers.json")).offers ?? [])
      names.add(o.operatorName.toLowerCase());
  } catch {
    /* the static list is enough */
  }
  return [...names];
}
/** Problems of a post (empty = it can be sent). */
export function complianceProblems(text) {
  const problems = [];
  const plain = text.replace(/<[^>]+>/g, " ");
  for (const n of operatorNames()) {
    const re = new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(plain)) problems.push(`nome di un operatore: "${n}"`);
  }
  for (const re of BANNED) if (re.test(plain)) problems.push(`parola non ammessa: ${re}`);
  for (const [, url] of text.matchAll(/href="([^"]+)"/g)) {
    if (!url.replace(/&amp;/g, "&").startsWith(`${SITE}/`)) problems.push(`link fuori dal sito: ${url}`);
  }
  for (const [url] of plain.matchAll(/https?:\/\/\S+/g)) {
    if (!url.startsWith(SITE)) problems.push(`link fuori dal sito: ${url}`);
  }
  if (!text.includes(FOOTER)) problems.push("manca la riga di gioco responsabile");
  return problems;
}

// ---------------------------------------------------------------------------------------------- register of sent posts
// Branch `telegram-registro`, file registro.json: { sent: { "<mode>:<rubric>:<day>": { at, messageId } }, academy: { <mode>: next } }.
// It stops a rubric being sent twice (a run repeated, two runs overlapping) and keeps the Academy queue position.
// Pushing to this branch does not start any workflow (deploy.yml runs on pushes to main only).
// Local runs: TG_REGISTER_FILE (default .cache/telegram-registro.json).
const REG_BRANCH = "telegram-registro";
const REG_FILE = "registro.json";
export async function loadRegister() {
  const local =
    process.env.TG_REGISTER_FILE || (!process.env.GITHUB_ACTIONS && path.join(root, ".cache/telegram-registro.json"));
  if (local) {
    const data = fs.existsSync(local) ? readJsonFile(local) : { sent: {}, academy: {} };
    return {
      data,
      save: async () => {
        fs.mkdirSync(path.dirname(local), { recursive: true });
        fs.writeFileSync(local, JSON.stringify(data, null, 1) + "\n");
      },
    };
  }
  const api = `https://api.github.com/repos/${repo()}`;
  let sha = null;
  let data = { sent: {}, academy: {} };
  const res = await fetch(`${api}/contents/${REG_FILE}?ref=${REG_BRANCH}`, {
    headers: ghHeaders("application/vnd.github+json"),
  });
  if (res.ok) {
    const j = await res.json();
    sha = j.sha;
    data = JSON.parse(Buffer.from(j.content, "base64").toString("utf8"));
  } else if (res.status !== 404) {
    throw new Error(`registro: HTTP ${res.status}`);
  }
  // first save: create the branch from main (only when something is actually sent, never in a dry run)
  const ensureBranch = async () => {
    const ref = await fetch(`${api}/git/ref/heads/${REG_BRANCH}`, {
      headers: ghHeaders("application/vnd.github+json"),
    });
    if (ref.status !== 404) return;
    const main = await (
      await fetch(`${api}/git/ref/heads/main`, { headers: ghHeaders("application/vnd.github+json") })
    ).json();
    const made = await fetch(`${api}/git/refs`, {
      method: "POST",
      headers: { ...ghHeaders("application/vnd.github+json"), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${REG_BRANCH}`, sha: main.object.sha }),
    });
    if (!made.ok) throw new Error(`creazione del branch ${REG_BRANCH}: HTTP ${made.status}`);
  };
  return {
    data,
    save: async (message) => {
      if (!sha) await ensureBranch();
      const body = {
        message,
        branch: REG_BRANCH,
        content: Buffer.from(JSON.stringify(data, null, 1) + "\n").toString("base64"),
        ...(sha ? { sha } : {}),
      };
      const put = await fetch(`${api}/contents/${REG_FILE}`, {
        method: "PUT",
        headers: { ...ghHeaders("application/vnd.github+json"), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!put.ok) throw new Error(`salvataggio del registro: HTTP ${put.status} ${await put.text()}`);
      sha = (await put.json()).content.sha;
    },
  };
}

// ---------------------------------------------------------------------------------------------- Telegram
/** Sends an HTML message to a chat; returns the message id. */
export async function sendTelegram(chatId, html) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN mancante");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.ok) throw new Error(`Telegram: ${j.description ?? `HTTP ${res.status}`}`);
  return j.result.message_id;
}
