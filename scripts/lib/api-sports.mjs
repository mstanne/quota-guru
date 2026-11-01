// Shared client for the API-Sports APIs (one key, one quota per sport): API-Football (v3.football.api-sports.io)
// and API-NBA (v2.nba.api-sports.io). Used by scripts/fetch-football.mjs, fetch-basket-data.mjs and
// fetch-live-scores.mjs.
//
// The key (API_FOOTBALL_KEY) is read only from the environment (GitHub secret or a git-ignored .env file), sent in
// the "x-apisports-key" header and never written to disk or logs.
// API_SPORTS_TEST_URL: local test server standing in for the API (tests only).
// API_SPORTS_GAP_MS: minimum pause between requests (default 250 ms, well under the Pro limit of 300 per minute).
import fs from "node:fs";
import path from "node:path";

export const HOSTS = { football: "v3.football.api-sports.io", nba: "v2.nba.api-sports.io" };

export class PlanError extends Error {}
export class BudgetError extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function loadDotEnv(root) {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/**
 * One client per sport. `get(path)` returns `response` (array); `all(path)` follows `paging` up to `maxPages`.
 * Stops (BudgetError) when fewer than `reserve` requests are left today, so manual checks always have room.
 */
export function apiSports(sport, key, { reserve = 50, gapMs = Number(process.env.API_SPORTS_GAP_MS ?? 250) } = {}) {
  const host = HOSTS[sport];
  let last = 0;
  let remaining = Infinity;
  let used = 0;
  async function request(pathAndQuery, attempt = 1) {
    if (remaining <= reserve) throw new BudgetError("richieste del giorno esaurite");
    const wait = last + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const base = process.env.API_SPORTS_TEST_URL ? `${process.env.API_SPORTS_TEST_URL}/${host}` : `https://${host}`;
    const res = await fetch(`${base}${pathAndQuery}`, { headers: { "x-apisports-key": key } });
    used++;
    const header = res.headers.get("x-ratelimit-requests-remaining");
    const left = header == null || header === "" ? NaN : Number(header);
    if (Number.isFinite(left)) remaining = left;
    if (res.status === 429 && attempt <= 2) {
      await sleep(10_000); // per-minute limit: wait and retry
      return request(pathAndQuery, attempt + 1);
    }
    if (res.status === 429) throw new BudgetError("limite di richieste raggiunto");
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${pathAndQuery}`);
    const json = await res.json();
    const errors = json.errors && !Array.isArray(json.errors) ? json.errors : {};
    const msg = Object.values(errors).join(" ");
    if (errors.plan) throw new PlanError(errors.plan);
    if (errors.requests || errors.rateLimit) throw new BudgetError(msg);
    if (errors.token) throw new Error(`chiave non valida: ${errors.token}`);
    if (msg) throw new Error(msg);
    return json;
  }
  return {
    get: async (p) => (await request(p)).response ?? [],
    async all(p, maxPages = 10) {
      const out = [];
      for (let page = 1, total = 1; page <= total && page <= maxPages; page++) {
        const json = await request(`${p}${p.includes("?") ? "&" : "?"}page=${page}`);
        out.push(...(json.response ?? []));
        total = json.paging?.total ?? 1;
      }
      return out;
    },
    stats: () => ({ requests: used, remainingToday: Number.isFinite(remaining) ? remaining : null }),
  };
}
