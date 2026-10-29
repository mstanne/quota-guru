// Validates src/data/offers.json before every build (and after every run of the offers agent).
//
//   node scripts/check-offers.mjs            -> errors only on approved offers block the build
//   node scripts/check-offers.mjs --strict   -> drafts are checked as if they were approved
//   node scripts/check-offers.mjs --json     -> machine-readable report (used by the offers agent)
//
// Exit code 1 when an approved offer (or any offer with --strict) has errors.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src", "data", "offers.json");
const strict = process.argv.includes("--strict");
const asJson = process.argv.includes("--json");

const PRODUCTS = ["sport", "casino", "lotterie", "poker", "bingo", "ippica", "virtual"];
const KINDS = ["bonus-deposito", "senza-deposito", "rimborso", "bonus-real"];
const STATUSES = ["bozza", "approvata", "ritirata"];
const MAX_VERIFICATION_AGE_DAYS = 14; // keep in sync with src/data/offers.ts

// Official domains per operator: source and terms links must point there.
const DOMAINS = {
  eurobet: ["eurobet.it"],
  planetwin365: ["planetwin365.it"],
  goldbet: ["goldbet.it"],
  snai: ["snai.it"],
  betsson: ["betsson.it"],
  bwin: ["bwin.it"],
  sisal: ["sisal.it"],
  codere: ["codere.it"],
  "888": ["888casino.it", "888sport.it"],
  admiralbet: ["admiralbet.it"],
  leovegas: ["leovegas.it"],
  lottomatica: ["lottomatica.it"],
};

// Promotional wording that must not appear in text written for the site (D.L. 87/2018, art. 9;
// AGCOM guidelines: no emphasis, no invitation to play). Matched case-insensitively on whole words.
const BANNED = [
  "gratis", "gratuito", "gratuita", "regalo", "regala", "omaggio", "subito", "imperdibile", "esclusiv[oa]",
  "approfitta", "affrettati", "non perdere", "vinci", "vincere", "migliore", "migliori", "top", "incredibile",
  "fantastic[oa]", "registrati", "iscriviti", "scommetti", "gioca ora", "richiedi", "ottieni", "riscatta",
  "senza rischi", "garantit[oa]", "sicur[oa] di vincere",
];
const bannedRe = new RegExp(`(?<![\\p{L}])(${BANNED.join("|")})(?![\\p{L}])`, "giu");
const PLACEHOLDER = /^\[[^\]]+\]$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const today = new Date();
const daysSince = (iso) => (today.getTime() - new Date(`${iso}T00:00:00+01:00`).getTime()) / 86400000;
const isPositive = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
const isNullOrPositive = (n) => n === null || isPositive(n);

const data = JSON.parse(fs.readFileSync(file, "utf8"));
const report = [];

for (const o of data.offers ?? []) {
  const errors = [];
  const warnings = [];
  const textFields = [];

  const req = (cond, msg) => cond || errors.push(msg);

  req(typeof o.id === "string" && /^[a-z0-9-]+$/.test(o.id), "id mancante o non valido (solo minuscole, numeri e trattini)");
  req(typeof o.operatorId === "string" && o.operatorId.length > 0, "operatorId mancante");
  req(typeof o.operatorName === "string" && o.operatorName.length > 0, "operatorName mancante");
  req(STATUSES.includes(o.status), `status non valido: ${o.status}`);
  req(Array.isArray(o.sections) && o.sections.length > 0 && o.sections.every((s) => PRODUCTS.includes(s)), "sections non valide");
  req(typeof o.title === "string" && o.title.length > 0, "title mancante");
  req(isNullOrPositive(o.advertisedTotal), "advertisedTotal deve essere un numero positivo o null");
  req(isNullOrPositive(o.minDeposit), "minDeposit deve essere un numero positivo o null");
  req(isNullOrPositive(o.depositWithinDays), "depositWithinDays deve essere un numero positivo o null");
  req(o.validFrom === null || ISO_DATE.test(o.validFrom), "validFrom non è una data AAAA-MM-GG");
  req(o.validUntil === null || ISO_DATE.test(o.validUntil), "validUntil non è una data AAAA-MM-GG");
  req(ISO_DATE.test(o.verifiedAt ?? ""), "verifiedAt mancante o non valida");
  req(Array.isArray(o.requirements), "requirements deve essere una lista");
  req(Array.isArray(o.excludedPaymentMethods), "excludedPaymentMethods deve essere una lista");
  req(Array.isArray(o.issues), "issues deve essere una lista");
  req(typeof o.description === "string" && o.description.length >= 20, "description mancante o troppo corta");
  if (typeof o.description === "string" && o.description.length > 320) warnings.push("description più lunga di 320 caratteri");

  for (const key of ["sourceUrl", "termsUrl"]) {
    let url;
    try {
      url = new URL(o[key]);
    } catch {
      errors.push(`${key} non è un URL valido`);
      continue;
    }
    if (url.protocol !== "https:") errors.push(`${key} deve essere https`);
    const allowed = DOMAINS[o.operatorId];
    if (!allowed) warnings.push(`operatore ${o.operatorId} senza domini ufficiali in DOMAINS: aggiungili allo script`);
    else if (!allowed.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`)))
      errors.push(`${key} non è sul dominio ufficiale dell'operatore (${allowed.join(", ")})`);
  }

  if (o.validUntil && ISO_DATE.test(o.validUntil) && daysSince(o.validUntil) > 1)
    (o.status === "approvata" ? errors : warnings).push(`offerta scaduta il ${o.validUntil}: va ritirata o aggiornata`);
  else if (o.validUntil && ISO_DATE.test(o.validUntil) && daysSince(o.validUntil) > -3)
    warnings.push(`l'offerta scade il ${o.validUntil}`);
  if (ISO_DATE.test(o.verifiedAt ?? "") && daysSince(o.verifiedAt) > MAX_VERIFICATION_AGE_DAYS)
    (o.status === "approvata" ? errors : warnings).push(
      `ultima verifica il ${o.verifiedAt}: più di ${MAX_VERIFICATION_AGE_DAYS} giorni, l'offerta non viene mostrata`,
    );
  if (o.status === "approvata" && o.issues?.length)
    errors.push(`offerta approvata con ${o.issues.length} incoerenze aperte in "issues": risolvile o svuota la lista`);

  const comps = Array.isArray(o.components) ? o.components : [];
  req(comps.length > 0, "nessun componente");
  const ids = new Set();
  for (const c of comps) {
    const where = `componente ${c.id ?? "?"}`;
    if (ids.has(c.id)) errors.push(`${where}: id duplicato`);
    ids.add(c.id);
    req(PRODUCTS.includes(c.product), `${where}: product non valido (${c.product})`);
    req(KINDS.includes(c.kind), `${where}: kind non valido (${c.kind})`);
    req(isPositive(c.maxAmount), `${where}: maxAmount deve essere un numero positivo`);
    req(c.percent === null || (typeof c.percent === "number" && c.percent > 0 && c.percent <= 100), `${where}: percent tra 1 e 100 o null`);
    for (const k of ["maxConvertible", "wagering", "wageringDays", "validityDays", "minEvents", "minOddsPerEvent"])
      req(isNullOrPositive(c[k]), `${where}: ${k} deve essere un numero positivo o null`);
    if (c.maxConvertible !== null && isPositive(c.maxAmount) && c.maxConvertible > c.maxAmount)
      errors.push(`${where}: maxConvertible maggiore di maxAmount`);
    if (c.product === "sport" && c.kind !== "rimborso" && (c.minEvents === null || c.minOddsPerEvent === null))
      warnings.push(`${where}: bonus sport senza numero minimo di eventi o quota minima`);
    req(typeof c.usableOn === "string" && c.usableOn.length > 0, `${where}: usableOn mancante`);
    req(Array.isArray(c.notes), `${where}: notes deve essere una lista`);
    textFields.push([`${where}.usableOn`, c.usableOn], ...(c.notes ?? []).map((n, i) => [`${where}.notes[${i}]`, n]));
  }
  for (const s of o.sections ?? [])
    if (!comps.some((c) => c.product === s)) errors.push(`la sezione "${s}" non ha nessun componente di quel prodotto`);

  const sum = comps.reduce((t, c) => t + (isPositive(c.maxAmount) ? c.maxAmount : 0), 0);
  if (isPositive(o.advertisedTotal) && Math.abs(sum - o.advertisedTotal) > 0.5)
    warnings.push(`la somma dei componenti (${sum} €) non corrisponde al totale indicato dall'operatore (${o.advertisedTotal} €)`);

  // Text written for the site: no placeholders, no promotional wording.
  textFields.push(["description", o.description], ...(o.requirements ?? []).map((r, i) => [`requirements[${i}]`, r]));
  for (const [field, value] of textFields) {
    if (typeof value !== "string") continue;
    if (PLACEHOLDER.test(value.trim())) errors.push(`${field}: segnaposto non compilato`);
    const found = [...new Set(value.match(bannedRe) ?? [])];
    if (found.length) errors.push(`${field}: linguaggio promozionale (${found.map((w) => `"${w}"`).join(", ")})`);
    if (value.includes("!")) errors.push(`${field}: punto esclamativo`);
  }

  const blocking = o.status === "approvata" || (strict && o.status === "bozza");
  report.push({ id: o.id, status: o.status, blocking, errors, warnings, openIssues: o.issues ?? [] });
}

const failed = report.filter((r) => r.blocking && r.errors.length > 0);

if (asJson) {
  console.log(JSON.stringify({ file: "src/data/offers.json", checkedAt: today.toISOString(), failed: failed.length, offers: report }, null, 2));
} else {
  for (const r of report) {
    const head = `${r.id} [${r.status}]`;
    if (!r.errors.length && !r.warnings.length && !r.openIssues.length) {
      console.log(`✓ ${head}`);
      continue;
    }
    console.log(`${r.errors.length && r.blocking ? "✗" : "•"} ${head}`);
    for (const e of r.errors) console.log(`    errore: ${e}`);
    for (const w of r.warnings) console.log(`    avviso: ${w}`);
    for (const i of r.openIssues) console.log(`    da verificare: ${i}`);
  }
  const counts = STATUSES.map((s) => `${report.filter((r) => r.status === s).length} ${s}`).join(", ");
  console.log(`offers.json: ${report.length} offerte (${counts})${failed.length ? ` — ${failed.length} con errori bloccanti` : ""}`);
}

process.exit(failed.length ? 1 : 0);
