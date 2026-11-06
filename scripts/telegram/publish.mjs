// Publishes the rubrics of the QuotaGuru Telegram channel (plan: scripts/telegram/README.md).
//
// Run by .github/workflows/telegram.yml every 20 minutes during the day (started on time by the live worker, which also
// starts it as soon as new official line-ups come out): each run sends the rubrics whose slot (Rome
// time, scripts/telegram/rubriche.mjs) has come in the last WINDOW minutes and that the register does not list as sent
// yet, so a late or repeated run never posts twice and summer/winter time needs no change to the schedule.
//
// Usage:
//   node scripts/telegram/publish.mjs                         rubrics due now
//   node scripts/telegram/publish.mjs --rubrica partite-oggi --force   one rubric now, whatever the time
//   node scripts/telegram/publish.mjs --dry-run [--all]       print the posts instead of sending them
//                                                             (--all: every rubric, due or not)
//   --now 2026-11-07T08:40:00Z                                pretend it is that time (tests)
//
// Environment:
//   TELEGRAM_BOT_TOKEN       token of the bot (admin of both channels)
//   TELEGRAM_MODE            "live" posts to TELEGRAM_CHAT_ID; anything else (default) to TELEGRAM_TEST_CHAT_ID
//   TELEGRAM_CHAT_ID         public channel, e.g. @quotaguru
//   TELEGRAM_TEST_CHAT_ID    private test channel (numeric id, e.g. -1001234567890)
//   GH_TOKEN, GITHUB_REPOSITORY   read the data branches and write the register (branch telegram-registro)
//   LIVE_URL                 address of the live worker (workers/live): official line-ups, rubric "formazioni"
//   TG_DATA_DIR, TG_ARCHIVE_DIR, TG_REGISTER_FILE, TG_LIVE_FILE   local copies instead of the branches (tests)
import { RUBRICHE } from "./rubriche.mjs";
import { complianceProblems, loadData, loadRegister, rome, romeInstant, sendTelegram } from "./lib.mjs";

const WINDOW = 100; // minutes after the slot in which a late run still sends the rubric

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const nowMs = value("now") ? Date.parse(value("now")) : Date.now();
const now = rome(nowMs);
const today = now.day;
const dryRun = flag("dry-run");
const mode = process.env.TELEGRAM_MODE === "live" ? "live" : "test";
const chatId = mode === "live" ? process.env.TELEGRAM_CHAT_ID : process.env.TELEGRAM_TEST_CHAT_ID;
const only = value("rubrica");

if (only && !RUBRICHE.some((r) => r.id === only)) {
  console.error(`Rubrica sconosciuta: ${only}. Disponibili: ${RUBRICHE.map((r) => r.id).join(", ")}`);
  process.exit(1);
}

const keyOf = (r) => `${mode}:${r.id}:${today}`;
let register = null;
// event rubrics (official line-ups) have no slot: every run checks them, when their data source is configured
const eventReady = () => !!(process.env.LIVE_URL || process.env.TG_LIVE_FILE);
const isDue = (r) => {
  if (r.event) return (!only || only === r.id) && eventReady();
  if (only) return r.id === only && (flag("force") || dueByClock(r));
  if (flag("all")) return true;
  return dueByClock(r);
};
function dueByClock(r) {
  if (!r.days.includes(now.weekday)) return false;
  const slot = romeInstant(today, r.time);
  return nowMs >= slot && nowMs < slot + WINDOW * 60000;
}

const candidates = RUBRICHE.filter(isDue);
console.log(
  `${today} ${now.time} (Roma), modalità ${mode}${dryRun ? ", prova a secco" : ""}: ${candidates.length ? candidates.map((r) => r.id).join(", ") : "nessuna rubrica in programma"}`,
);
if (!candidates.length) process.exit(0);

if (!dryRun && !chatId) {
  console.error(`Manca ${mode === "live" ? "TELEGRAM_CHAT_ID" : "TELEGRAM_TEST_CHAT_ID"}: niente da inviare.`);
  process.exit(1);
}

register = await loadRegister();
register.data.sent ??= {};
// the register keeps 60 days: enough to stop any repeat, small enough to stay one short file
for (const [k, v] of Object.entries(register.data.sent))
  if (nowMs - Date.parse(v.at) > 60 * 86400000) delete register.data.sent[k];
const data = await loadData(nowMs, { live: candidates.some((r) => r.event) });
let failed = 0;

for (const r of candidates) {
  // a slot rubric goes out once a day (--force sends it again); an event post once ever, whatever the flags
  if (!r.event && !dryRun && !flag("force") && register.data.sent[keyOf(r)]) {
    console.log(`· ${r.id}: già inviata oggi`);
    continue;
  }
  let built;
  try {
    built = r.build({ data, today, nowMs, register, mode });
  } catch (e) {
    console.error(`✗ ${r.id}: errore nel costruire il post: ${e.stack ?? e}`);
    failed++;
    continue;
  }
  const posts = (Array.isArray(built) ? built : built ? [built] : [])
    .map((b) => (typeof b === "string" ? { text: b } : b))
    .map((b) => ({ ...b, key: r.event ? `${mode}:${r.id}:${b.key}` : keyOf(r) }))
    .filter((b) => dryRun || !r.event || !register.data.sent[b.key]);
  if (!posts.length) {
    console.log(`· ${r.id}: niente da pubblicare ora (nessuna partita, dati non pronti o già inviata), saltata`);
    continue;
  }
  for (const p of posts) {
    const problems = complianceProblems(p.text);
    if (p.text.length > 4096) problems.push(`testo troppo lungo (${p.text.length} caratteri, massimo 4096)`);
    if (problems.length) {
      console.error(`✗ ${r.id}: post bloccato dal filtro di conformità:\n  - ${problems.join("\n  - ")}\n${p.text}`);
      failed++;
      continue;
    }
    if (dryRun) {
      console.log(`\n===== ${r.id} (${r.name}) =====\n${p.text}\n`);
      continue;
    }
    try {
      const messageId = await sendTelegram(chatId, p.text);
      register.data.sent[p.key] = { at: new Date().toISOString(), messageId };
      p.after?.();
      await register.save(`${p.key.slice(mode.length + 1)} (${mode})`);
      console.log(`✓ ${r.id}: inviata (messaggio ${messageId})`);
    } catch (e) {
      console.error(`✗ ${r.id}: ${e.message ?? e}`);
      failed++;
    }
  }
}

if (failed) process.exit(1);
