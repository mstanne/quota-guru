// Downloads tennis data from the BALLDONTLIE API (free tier) and writes src/data/tennis.json.
//   - ATP and WTA rankings (top 100)
//   - ATP and WTA tournament calendar of the current season (and of the next one from October)
// Matches, head-to-head and statistics require a paid plan and are not downloaded.
//
// Usage:  BALLDONTLIE_API_KEY=<key> node scripts/fetch-tennis-data.mjs
// The key is sent in the "Authorization" header, read only from the environment (GitHub secret or a
// git-ignored .env file) and never written to disk or logs. Without a key the existing snapshot is kept.
// If one tour fails (e.g. not included in the plan), its previous data is kept.
// Free plan: 5 requests/minute → requests are spaced ~13 s apart.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.balldontlie.io";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "tennis.json");
const CACHE_DIR = path.join(root, ".cache", "balldontlie");
const CACHE_TTL_MS = Number(process.env.TENNIS_CACHE_MINUTES ?? 60) * 60000;
const MIN_GAP_MS = 13000;
const TOP = 100;

function loadDotEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
const cacheFile = (p) => path.join(CACHE_DIR, p.replace(/[^a-zA-Z0-9]+/g, "_") + ".json");

async function api(p, key, attempt = 1) {
  const cached = cacheFile(p);
  if (CACHE_TTL_MS > 0 && fs.existsSync(cached) && Date.now() - fs.statSync(cached).mtimeMs < CACHE_TTL_MS) {
    return JSON.parse(fs.readFileSync(cached, "utf8"));
  }
  const wait = last + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(API + p, { headers: { Authorization: key } });
  if (res.status === 429 && attempt <= 3) {
    console.warn("  rate limit raggiunto, attendo 60 s...");
    await sleep(60000);
    return api(p, key, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${p}`);
  const json = await res.json();
  if (CACHE_TTL_MS > 0) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cached, JSON.stringify(json));
  }
  return json;
}

async function all(p, key, maxItems = Infinity) {
  const out = [];
  let cursor = null;
  for (let page = 0; page < 10 && out.length < maxItems; page++) {
    const sep = p.includes("?") ? "&" : "?";
    const r = await api(`${p}${sep}per_page=100${cursor ? `&cursor=${cursor}` : ""}`, key);
    out.push(...(r.data ?? []));
    cursor = r.meta?.next_cursor;
    if (!cursor || !r.data?.length) break;
  }
  return out.slice(0, maxItems);
}

// IOC country codes (used in tennis) → ISO codes, for Italian country names.
const IOC = {
  ITA: "IT", ESP: "ES", GER: "DE", SUI: "CH", SRB: "RS", RUS: "RU", USA: "US", GBR: "GB", FRA: "FR", AUS: "AU",
  CAN: "CA", ARG: "AR", BRA: "BR", CHI: "CL", NED: "NL", BEL: "BE", AUT: "AT", CZE: "CZ", POL: "PL", CRO: "HR",
  DEN: "DK", NOR: "NO", SWE: "SE", FIN: "FI", GRE: "GR", BUL: "BG", POR: "PT", HUN: "HU", KAZ: "KZ", JPN: "JP",
  CHN: "CN", KOR: "KR", TPE: "TW", IND: "IN", RSA: "ZA", BLR: "BY", UKR: "UA", ROU: "RO", SVK: "SK", SLO: "SI",
  BIH: "BA", MNE: "ME", MKD: "MK", GEO: "GE", ARM: "AM", LAT: "LV", LTU: "LT", EST: "EE", COL: "CO", PER: "PE",
  URU: "UY", PAR: "PY", ECU: "EC", BOL: "BO", MEX: "MX", NZL: "NZ", TUN: "TN", EGY: "EG", MAR: "MA", ISR: "IL",
  TUR: "TR", MDA: "MD", LUX: "LU", MON: "MC", IRL: "IE", PHI: "PH", THA: "TH", INA: "ID", VIE: "VN", HKG: "HK",
  CYP: "CY", LBN: "LB", QAT: "QA", UAE: "AE", KSA: "SA", DOM: "DO", PUR: "PR", VEN: "VE", CUB: "CU", JAM: "JM",
  BAR: "BB", ESA: "SV", GUA: "GT", CRC: "CR", PAN: "PA", ALG: "DZ", NGR: "NG", KEN: "KE", ZIM: "ZW", UZB: "UZ",
  ISL: "IS", MLT: "MT", AND: "AD", SMR: "SM", LIE: "LI", ALB: "AL", KOS: "XK", AZE: "AZ", PAK: "PK", SRI: "LK",
};
const regionNames = new Intl.DisplayNames(["it"], { type: "region" });
const COUNTRY_OVERRIDE = { CZE: "Repubblica Ceca", TPE: "Taipei Cinese" };
function countryIt(code, fallback) {
  if (COUNTRY_OVERRIDE[code]) return COUNTRY_OVERRIDE[code];
  const iso = IOC[code];
  if (!iso) return fallback || code || null;
  try {
    return regionNames.of(iso) || fallback;
  } catch {
    return fallback;
  }
}

const player = (p) => ({
  id: p.id,
  name: p.full_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
  country: countryIt(p.country_code, p.country),
  countryCode: p.country_code ?? null,
  age: p.age ?? null,
  heightCm: p.height_cm ?? null,
  plays: p.plays ?? null,
  turnedPro: p.turned_pro ?? null,
});

/** "WUHAN" → "Wuhan", "RIO DE JANEIRO 125" → "Rio de Janeiro 125"; mixed-case names are left as they are. */
const SMALL = new Set(["de", "da", "del", "di", "la", "le", "les", "el", "y", "e", "do", "dos", "das", "van", "von"]);
function tidy(s) {
  if (!s || s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[-'(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())))
    .join(" ");
}
/** Italian names of the cities that have one. */
const CITY_IT = {
  Turin: "Torino", Rome: "Roma", Milan: "Milano", Florence: "Firenze", Naples: "Napoli", Paris: "Parigi",
  Basel: "Basilea", Munich: "Monaco di Baviera", London: "Londra", Beijing: "Pechino", Geneva: "Ginevra",
  Barcelona: "Barcellona", Hamburg: "Amburgo", Stockholm: "Stoccolma", Brussels: "Bruxelles", Lyon: "Lione",
  Marseille: "Marsiglia", Lisbon: "Lisbona", Antwerp: "Anversa", Stuttgart: "Stoccarda", Bucharest: "Bucarest",
  Belgrade: "Belgrado", Athens: "Atene", Moscow: "Mosca", Prague: "Praga", Warsaw: "Varsavia", Seville: "Siviglia",
  Cologne: "Colonia", Vienna: "Vienna", "Mallorca": "Maiorca", Strasbourg: "Strasburgo", Cluj: "Cluj-Napoca",
  "Sao Paulo": "San Paolo", "Multiple Locations": "Varie sedi", Montreal: "Montréal", Gstaad: "Gstaad", Kitzbuhel: "Kitzbühel",
};
const cityIt = (s) => s.split(/\s*\+\s*/).map((c) => CITY_IT[c] ?? c).join(" + ");
/** "SAMSUN, TUR" → "Samsun (Turchia)", "Turin" → "Torino". */
function tidyLocation(s) {
  if (!s) return null;
  const m = s.match(/^(.*),\s*([A-Z]{3})$/);
  return m ? `${cityIt(tidy(m[1]))} (${countryIt(m[2], m[2])})` : cityIt(tidy(s));
}

const tournament = (t) => ({
  id: t.id,
  name: tidy(t.name),
  location: tidyLocation(t.location),
  surface: t.surface ?? null,
  category: t.category ?? null,
  season: t.season ?? null,
  start: t.start_date ?? null,
  end: t.end_date ?? null,
  prizeMoney: t.prize_money ?? null,
  prizeCurrency: t.prize_currency ?? null,
  drawSize: t.draw_size ?? null,
});

async function tour(prefix, key, seasons) {
  console.log(`${prefix.toUpperCase()}: classifica (prime ${TOP})`);
  const rows = await all(`/${prefix}/v1/rankings`, key, TOP);
  const rankings = rows
    .filter((r) => r.player && r.rank)
    .map((r) => ({ rank: r.rank, points: r.points ?? null, movement: r.movement ?? 0, player: player(r.player) }))
    .sort((a, b) => a.rank - b.rank);
  const rankingDate = rows.find((r) => r.ranking_date)?.ranking_date ?? null;
  const tournaments = [];
  for (const season of seasons) {
    console.log(`${prefix.toUpperCase()}: tornei ${season}`);
    tournaments.push(...(await all(`/${prefix}/v1/tournaments?season=${season}`, key)).map(tournament));
  }
  tournaments.sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999") || a.name.localeCompare(b.name));
  return { rankingDate, rankings, tournaments };
}

async function main() {
  loadDotEnv();
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) {
    console.warn("BALLDONTLIE_API_KEY non impostata: mantengo il file dati esistente (src/data/tennis.json).");
    return;
  }
  const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const now = new Date();
  const year = now.getUTCFullYear();
  const seasons = now.getUTCMonth() >= 9 ? [year, year + 1] : [year];
  const snapshot = { generatedAt: now.toISOString(), source: "balldontlie.io" };
  let ok = 0;
  for (const prefix of ["atp", "wta"]) {
    try {
      snapshot[prefix] = await tour(prefix, key, seasons);
      ok++;
    } catch (err) {
      console.warn(`  ${prefix.toUpperCase()} non disponibile (${err.message}): mantengo i dati precedenti.`);
      snapshot[prefix] = previous[prefix] ?? { rankingDate: null, rankings: [], tournaments: [] };
    }
  }
  if (!ok) throw new Error("nessun circuito scaricato");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT + ".tmp", JSON.stringify(snapshot) + "\n");
  fs.renameSync(OUT + ".tmp", OUT);
  console.log(
    `Salvato src/data/tennis.json: ATP ${snapshot.atp.rankings.length} giocatori e ${snapshot.atp.tournaments.length} tornei, ` +
      `WTA ${snapshot.wta.rankings.length} giocatrici e ${snapshot.wta.tournaments.length} tornei.`,
  );
}

main().catch((err) => {
  console.error("Download dati tennis non riuscito:", err.message);
  process.exit(1);
});
