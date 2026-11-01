// QuotaGuru live data: a Cloudflare Worker that keeps the live data of the matches being played (score, minute,
// events, official line-ups, statistics, ratings) and serves it to the match pages of the site, which refresh it
// every 30 seconds (src/components/calcio/LiveMatch.tsx).
//
// How it works
//   - Every minute (cron) the worker asks the LiveHub Durable Object to refresh. The hub knows the next matches of
//     the site's competitions (/fixtures?league=…&next=…, plus the ones under way, refreshed every 2 hours) and,
//     only while some match is around kick-off or under way (from 75 minutes before to its end), downloads them by
//     id, 10 per request (/fixtures?ids=: line-ups, events, statistics and player ratings included). Each block of
//     10 runs in its own invocation (Durable Object alarm), so every run stays within the CPU time of the free plan.
//     No match, no request.
//   - The site reads GET /match/<API-Football fixture id> (JSON, CORS for the site only, cached 15 seconds at the
//     edge). The API key never leaves the worker.
//   - At most MAX_DAILY_REQUESTS requests a day (default 3000 of the 7500 of the Pro plan); GET /stato shows how many.
//
// Configuration: wrangler.toml; secret API_FOOTBALL_KEY (set by .github/workflows/live-worker.yml).
// API_BASE: test server standing in for API-Football (local tests only).
import { footballDetails } from "../../../scripts/lib/match-details.mjs";
import { COMPETITIONS } from "../../../scripts/lib/leagues.mjs";

const LEAGUES = new Set(COMPETITIONS.map((c) => c.api));
const SLUG = Object.fromEntries(COMPETITIONS.map((c) => [c.api, c.slug]));
const BEFORE_MS = 75 * 60e3; // official line-ups come about an hour before kick-off
const AFTER_MS = 3.5 * 3600e3; // longest match (extra time, penalties, delays)
const KEEP_FINISHED_MS = 20 * 60e3; // a finished match stays available for a while
const SCHEDULE_EVERY_MS = 2 * 3600e3;
const CHUNK = 10;
const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "PST"]);
const PLAYING = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);

const day = (ms) => new Date(ms).toISOString().slice(0, 10);

/** One fixture of /fixtures?ids= in the form served to the site. */
export function liveEntry(f, now) {
  const sideOf = (id) => (id === f.teams?.home?.id ? "home" : id === f.teams?.away?.id ? "away" : null);
  const { fixture, savedAt, venue, city, referee, ...details } = footballDetails(
    f,
    f.events ?? [],
    f.lineups ?? [],
    f.statistics ?? [],
    f.players ?? [],
    sideOf,
  );
  const st = f.fixture?.status ?? {};
  return {
    id: f.fixture?.id,
    league: SLUG[f.league?.id] ?? null,
    kickoff: f.fixture?.date,
    status: { short: st.short ?? "NS", long: st.long ?? "", elapsed: st.elapsed ?? null, extra: st.extra ?? null },
    score: {
      home: f.goals?.home ?? null,
      away: f.goals?.away ?? null,
      halftime: f.score?.halftime ?? null,
      penalty: f.score?.penalty ?? null,
    },
    teams: { home: f.teams?.home?.name ?? "", away: f.teams?.away?.name ?? "" },
    ...details,
    updatedAt: new Date(now).toISOString(),
  };
}

export class LiveHub {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.storage = ctx.storage;
  }

  async api(path) {
    const used = await this.countRequest();
    if (used === null) throw new Error("tetto giornaliero di richieste raggiunto");
    const base = this.env.API_BASE || "https://v3.football.api-sports.io";
    const res = await fetch(base + path, { headers: { "x-apisports-key": this.env.API_FOOTBALL_KEY } });
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${path}`);
    const json = await res.json();
    const errors = json.errors && !Array.isArray(json.errors) ? Object.values(json.errors).join(" ") : "";
    if (errors) throw new Error(errors);
    return json.response ?? [];
  }

  /** Counts today's requests; null when the daily cap is reached. */
  async countRequest() {
    const today = day(Date.now());
    const c = (await this.storage.get("requests")) ?? { day: today, n: 0 };
    if (c.day !== today) Object.assign(c, { day: today, n: 0 });
    if (c.n >= Number(this.env.MAX_DAILY_REQUESTS || 3000)) return null;
    c.n++;
    await this.storage.put("requests", c);
    return c.n;
  }

  /**
   * Next matches of the site's competitions, plus the ones under way (refreshed every 2 hours: 1 request per
   * competition + 1). Matches already known stay in the list until their window is over.
   */
  async schedule(now) {
    let s = await this.storage.get("schedule");
    if (!s || now - s.at > SCHEDULE_EVERY_MS) {
      const byId = new Map((s?.list ?? []).filter((m) => now <= m.kickoff + AFTER_MS).map((m) => [m.id, m]));
      const add = (f) =>
        LEAGUES.has(f.league?.id) && byId.set(f.fixture.id, { id: f.fixture.id, kickoff: Date.parse(f.fixture.date), status: f.fixture.status?.short });
      for (const id of LEAGUES) for (const f of await this.api(`/fixtures?league=${id}&next=20`)) add(f);
      for (const f of await this.api(`/fixtures?live=${[...LEAGUES].join("-")}`)) add(f);
      // only what can enter the window in the next 2 days
      const list = [...byId.values()].filter((m) => m.kickoff <= now + 2 * 86400e3);
      s = { at: now, list };
      await this.storage.put("schedule", s);
    }
    return s.list;
  }

  /** Every minute: the matches in the window go in a queue, processed CHUNK at a time (see alarm). */
  async refresh() {
    const now = Date.now();
    if (!this.env.API_FOOTBALL_KEY) return { ok: false, message: "API_FOOTBALL_KEY mancante" };
    const list = await this.schedule(now);
    const done = (await this.storage.get("done")) ?? {}; // fixture id → time it was seen finished
    const window = list.filter(
      (m) =>
        now >= m.kickoff - BEFORE_MS &&
        (now <= m.kickoff + AFTER_MS || PLAYING.has(m.status)) &&
        !(done[m.id] && now - done[m.id] > KEEP_FINISHED_MS),
    );
    for (const id of Object.keys(done)) if (now - done[id] > 6 * 3600e3) delete done[id];
    await this.storage.put("done", done);
    // drop the data of matches no longer in the schedule
    const keep = new Set(list.map((m) => `m:${m.id}`));
    for (const k of (await this.storage.list({ prefix: "m:" })).keys()) if (!keep.has(k)) await this.storage.delete(k);
    await this.storage.put("queue", window.map((m) => m.id));
    const result = { ok: true, at: new Date(now).toISOString(), matches: window.length };
    await this.storage.put("last", result);
    if (window.length) await this.processChunk();
    return result;
  }

  /** Downloads the next CHUNK matches of the queue; schedules the following block in its own invocation. */
  async processChunk() {
    const queue = (await this.storage.get("queue")) ?? [];
    if (!queue.length) return;
    const chunk = queue.slice(0, CHUNK);
    await this.storage.put("queue", queue.slice(CHUNK));
    const now = Date.now();
    const done = (await this.storage.get("done")) ?? {};
    const s = await this.storage.get("schedule");
    for (const f of await this.api(`/fixtures?ids=${chunk.join("-")}`)) {
      const e = liveEntry(f, now);
      await this.storage.put(`m:${e.id}`, JSON.stringify(e));
      const m = s?.list.find((x) => x.id === e.id);
      if (m) m.status = e.status.short;
      if (FINAL.has(e.status.short)) done[e.id] ??= now;
    }
    await this.storage.put("done", done);
    if (s) await this.storage.put("schedule", s);
    if (queue.length > CHUNK) await this.storage.setAlarm(Date.now() + 500);
  }

  async alarm() {
    try {
      await this.processChunk();
    } catch (err) {
      await this.storage.put("last", { ok: false, at: new Date().toISOString(), message: String(err.message).slice(0, 200) });
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/refresh") {
      try {
        return Response.json(await this.refresh());
      } catch (err) {
        const result = { ok: false, at: new Date().toISOString(), message: String(err.message).slice(0, 200) };
        await this.storage.put("last", result);
        return Response.json(result, { status: 500 });
      }
    }
    const m = url.pathname.match(/^\/match\/(\d+)$/);
    if (m) {
      const body = await this.storage.get(`m:${m[1]}`);
      return new Response(body ?? JSON.stringify({ id: Number(m[1]), status: { short: "NONE" } }), {
        status: body ? 200 : 404,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.pathname === "/stato") {
      const schedule = (await this.storage.get("schedule")) ?? { list: [] };
      return Response.json({
        last: (await this.storage.get("last")) ?? null,
        requests: (await this.storage.get("requests")) ?? null,
        todayMatches: schedule.list.length,
      });
    }
    return new Response("not found", { status: 404 });
  }
}

function cors(request, env, response) {
  const origin = request.headers.get("origin");
  const allowed = String(env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim());
  const h = new Headers(response.headers);
  if (origin && allowed.includes(origin)) {
    h.set("access-control-allow-origin", origin);
    h.set("vary", "origin");
  }
  return new Response(response.body, { status: response.status, headers: h });
}

const hub = (env) => env.HUB.get(env.HUB.idFromName("hub"));

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors(request, env, new Response(null, { status: 204 }));
    if (request.method !== "GET") return new Response("method not allowed", { status: 405 });
    if (/^\/match\/\d+$/.test(url.pathname)) {
      // short edge cache: many viewers of the same match cost one read every 15 seconds per data centre
      const cache = caches.default;
      const key = new Request(`${url.origin}${url.pathname}`);
      let res = await cache.match(key);
      if (!res) {
        const r = await hub(env).fetch(`https://hub${url.pathname}`);
        res = new Response(r.body, {
          status: r.status,
          headers: { "content-type": "application/json", "cache-control": "public, max-age=15" },
        });
        ctx.waitUntil(cache.put(key, res.clone()));
      }
      return cors(request, env, res);
    }
    if (url.pathname === "/stato") return cors(request, env, await hub(env).fetch("https://hub/stato"));
    return new Response("QuotaGuru live", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(hub(env).fetch("https://hub/refresh"));
  },
};
