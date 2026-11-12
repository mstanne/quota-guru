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
//   - GET /live: score, status and minute of every match under way or just finished, compact (one record), for the
//     match lists of the site (src/lib/liveScores.ts), cached 15 seconds at the edge like /match.
//   - GET /formazioni: the official line-ups already out for the matches not started yet, read by the Telegram channel
//     (scripts/telegram, rubric "formazioni"). When new line-ups come out the worker starts telegram.yml at once.
//
// Configuration: wrangler.toml; secret API_FOOTBALL_KEY (set by .github/workflows/live-worker.yml).
// API_BASE: address API-Football is reached through instead of v3.football.api-sports.io: our relay server with a
// dedicated IP (workers/live/server; API-Football limits the shared outbound IPs of Cloudflare Workers), or a test
// server in local tests. PROXY_SECRET: password the relay server expects.
import { footballDetails } from "../../../scripts/lib/match-details.mjs";
import { COMPETITIONS } from "../../../scripts/lib/leagues.mjs";

// lower divisions (`info`, shown only for information) stay out: up to ~100 more matches on a Saturday would eat the
// day's requests of the competitions with predictions; their scores come from the 15-minute runs (live-scores.yml)
const LIVE = COMPETITIONS.filter((c) => !c.info);
const LEAGUES = new Set(LIVE.map((c) => c.api));
const SLUG = Object.fromEntries(LIVE.map((c) => [c.api, c.slug]));
const BEFORE_MS = 75 * 60e3; // official line-ups come about an hour before kick-off
const AFTER_MS = 3.5 * 3600e3; // longest match (extra time, penalties, delays)
const KEEP_FINISHED_MS = 20 * 60e3; // a finished match stays available for a while
const SCHEDULE_EVERY_MS = 2 * 3600e3;
const CHUNK = 10;
const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "PST"]);
const PLAYING = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);

// API-Football's front door rejects requests that come in quick succession from Cloudflare (answer "Too many
// requests" without the usual limit headers, even far below the 300 a minute of the plan): the worker sends one
// request at a time, GAP_MS apart, and after a refusal waits PAUSE_MS.
const SCHEDULE_STEP = 1; // calendar requests per minute (the calendar is rebuilt over about 15 minutes)
const GAP_MS = 4000; // pause between two requests
const PAUSE_MS = 3 * 60e3; // pause after a refusal

class RateLimit extends Error {}

const day = (ms) => new Date(ms).toISOString().slice(0, 10);
/** Both official line-ups published (eleven starters each). */
const hasLineups = (e) => e.lineups?.home?.starters?.length === 11 && e.lineups?.away?.starters?.length === 11;

/** One fixture of /fixtures?ids= in the form served to the site. */
/** Compact record of a match for GET /live: fixture id, status, minute, goals, penalties. */
export const scoreOf = (e) => ({
  id: e.id,
  s: e.status.short,
  min: e.status.elapsed,
  ext: e.status.extra,
  h: e.score.home,
  a: e.score.away,
  ph: e.score.penalty?.home ?? null,
  pa: e.score.penalty?.away ?? null,
  at: e.updatedAt,
});

export function liveEntry(f, now) {
  const sideOf = (id) => (id === f.teams?.home?.id ? "home" : id === f.teams?.away?.id ? "away" : null);
  // `players`: every player's row, only for the archive and the player pages (not served live)
  const { fixture, savedAt, venue, city, referee, players, ...details } = footballDetails(
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

  /** API key, plus the password of our relay server when API_BASE points to it (workers/live/server). */
  apiHeaders() {
    const h = { "x-apisports-key": this.env.API_FOOTBALL_KEY ?? "" };
    if (this.env.PROXY_SECRET) h["x-proxy-secret"] = this.env.PROXY_SECRET;
    return h;
  }

  async api(path) {
    const used = await this.countRequest();
    if (used === null) throw new Error("tetto giornaliero di richieste raggiunto");
    const base = this.env.API_BASE || "https://v3.football.api-sports.io";
    // API-Football sits behind Cloudflare too: without no-store, an error answer (e.g. a per-minute limit hit while
    // the site's jobs were running) can stay in Cloudflare's cache and come back for every later identical request.
    const res = await fetch(base + path, { headers: this.apiHeaders(), cache: "no-store" });
    // limits reported by API-Football, shown in /stato (per minute and per day)
    const h = (k) => res.headers.get(k);
    await this.storage.put("apiInfo", {
      at: new Date().toISOString(),
      path: path.split("?")[0],
      status: res.status,
      minuteLimit: h("x-ratelimit-limit"),
      minuteRemaining: h("x-ratelimit-remaining"),
      dayLimit: h("x-ratelimit-requests-limit"),
      dayRemaining: h("x-ratelimit-requests-remaining"),
    });
    if (res.status === 429) throw new RateLimit(`HTTP 429 su ${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${path}`);
    const json = await res.json();
    const errors = json.errors && !Array.isArray(json.errors) ? json.errors : null;
    if (errors && Object.keys(errors).length) {
      const msg = Object.values(errors).join(" ");
      if (errors.rateLimit || errors.requests) throw new RateLimit(msg);
      throw new Error(msg);
    }
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
    this.scheduleUsed = false;
    let b = await this.storage.get("build"); // calendar being rebuilt, SCHEDULE_STEP requests per minute
    if (!b && (!s || now - s.at > SCHEDULE_EVERY_MS)) {
      b = { todo: [...[...LEAGUES].map(String), "live"], found: [] };
    }
    if (b) {
      const step = b.todo.slice(0, SCHEDULE_STEP);
      for (const item of step) {
        const path = item === "live" ? `/fixtures?live=${[...LEAGUES].join("-")}` : `/fixtures?next=20&league=${item}`;
        for (const f of await this.api(path))
          if (LEAGUES.has(f.league?.id)) b.found.push({ id: f.fixture.id, kickoff: Date.parse(f.fixture.date), status: f.fixture.status?.short });
        this.scheduleUsed = true;
        b.todo.shift(); // progress is kept even if a later request of this step fails
        await this.storage.put("build", b);
      }
      if (!b.todo.length) {
        const byId = new Map((s?.list ?? []).filter((m) => now <= m.kickoff + AFTER_MS).map((m) => [m.id, m]));
        for (const m of b.found) byId.set(m.id, m);
        // only what can enter the window in the next 2 days
        s = { at: now, list: [...byId.values()].filter((m) => m.kickoff <= now + 2 * 86400e3) };
        await this.storage.put("schedule", s);
        await this.storage.delete("build");
      }
    }
    return s?.list ?? [];
  }

  /** Every minute: the matches in the window go in a queue, processed CHUNK at a time (see alarm). */
  async refresh() {
    const now = Date.now();
    if (!this.env.API_FOOTBALL_KEY) return { ok: false, message: "API_FOOTBALL_KEY mancante" };
    const pause = await this.storage.get("pauseUntil");
    if (pause && now < pause) return { ok: false, at: new Date(now).toISOString(), message: `in pausa fino alle ${new Date(pause).toISOString()} (limite al minuto)` };
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
    const scores = (await this.storage.get("scores")) ?? {};
    for (const id of Object.keys(scores)) if (!keep.has(`m:${id}`)) delete scores[id];
    await this.storage.put("scores", scores);
    await this.storage.put("queue", window.map((m) => m.id));
    const result = { ok: true, at: new Date(now).toISOString(), matches: window.length };
    await this.storage.put("last", result);
    // the match data in its own invocation, GAP_MS after a calendar request of this minute
    if (window.length) await this.storage.setAlarm(Date.now() + (this.scheduleUsed ? GAP_MS : 0));
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
    const seen = (await this.storage.get("lineupsSeen")) ?? {}; // fixture id → time its line-ups were first seen
    const scores = (await this.storage.get("scores")) ?? {}; // fixture id → compact score (GET /live)
    let newLineups = false;
    for (const f of await this.api(`/fixtures?ids=${chunk.join("-")}`)) {
      const e = liveEntry(f, now);
      await this.storage.put(`m:${e.id}`, JSON.stringify(e));
      scores[e.id] = scoreOf(e);
      const m = s?.list.find((x) => x.id === e.id);
      if (m) m.status = e.status.short;
      if (FINAL.has(e.status.short)) done[e.id] ??= now;
      if (hasLineups(e) && e.status.short === "NS" && !seen[e.id]) {
        seen[e.id] = now;
        newLineups = true;
      }
    }
    for (const id of Object.keys(seen)) if (now - seen[id] > 12 * 3600e3) delete seen[id];
    await this.storage.put("lineupsSeen", seen);
    await this.storage.put("scores", scores);
    await this.storage.put("done", done);
    if (s) await this.storage.put("schedule", s);
    if (queue.length > CHUNK) await this.storage.setAlarm(Date.now() + GAP_MS);
    // new official line-ups: the Telegram channel posts them now, not at its next 20-minute run
    if (newLineups) await dispatchWorkflow(this.env, "telegram.yml", { rubrica: "formazioni", prova: "false" });
  }

  /** Line-ups of the matches not started yet (GET /formazioni), compact: names only. */
  async lineups() {
    const out = [];
    for (const body of (await this.storage.list({ prefix: "m:" })).values()) {
      const e = JSON.parse(body);
      if (e.status?.short !== "NS" || !hasLineups(e)) continue;
      const side = (l) => ({ formation: l.formation, coach: l.coach, starters: l.starters.map((p) => p.name) });
      out.push({ id: e.id, league: e.league, kickoff: e.kickoff, teams: e.teams, lineups: { home: side(e.lineups.home), away: side(e.lineups.away) } });
    }
    return out.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }

  /** Records an error; on the API's per-minute limit, stops asking for PAUSE_MS. */
  async failed(err) {
    const result = { ok: false, at: new Date().toISOString(), message: String(err.message).slice(0, 200) };
    if (err instanceof RateLimit) await this.storage.put("pauseUntil", Date.now() + PAUSE_MS);
    await this.storage.put("last", result);
    return result;
  }

  async alarm() {
    try {
      await this.processChunk();
    } catch (err) {
      await this.failed(err);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/refresh") {
      try {
        return Response.json(await this.refresh());
      } catch (err) {
        return Response.json(await this.failed(err), { status: 500 });
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
    if (url.pathname === "/live") {
      // only what the lists show: matches under way or finished (not the ones waiting for kick-off)
      const scores = (await this.storage.get("scores")) ?? {};
      const matches = Object.values(scores).filter((x) => x.s !== "NS" && x.s !== "TBD");
      return Response.json({ at: new Date().toISOString(), matches });
    }
    if (url.pathname === "/formazioni") return Response.json({ at: new Date().toISOString(), matches: await this.lineups() });
    if (url.pathname === "/prova") {
      // check from Cloudflare: /status of API-Football (account, plan, requests of the day; not counted in the quota)
      const base = this.env.API_BASE || "https://v3.football.api-sports.io";
      const res = await fetch(`${base}/status`, { headers: this.apiHeaders(), cache: "no-store" });
      const headers = Object.fromEntries([...res.headers].filter(([k]) => /ratelimit|cf-ray|server/i.test(k)));
      const body = await res.json().catch(() => null);
      return Response.json({ status: res.status, headers, errors: body?.errors ?? null, subscription: body?.response?.subscription ?? null, requests: body?.response?.requests ?? null });
    }
    if (url.pathname === "/stato") {
      const schedule = (await this.storage.get("schedule")) ?? { list: [] };
      const build = await this.storage.get("build");
      const pause = await this.storage.get("pauseUntil");
      return Response.json({
        last: (await this.storage.get("last")) ?? null,
        requests: (await this.storage.get("requests")) ?? null,
        todayMatches: schedule.list.length,
        scheduleAt: schedule.at ? new Date(schedule.at).toISOString() : null,
        scheduleBuilding: build ? `${build.todo.length} richieste mancanti` : null,
        pausedUntil: pause && Date.now() < pause ? new Date(pause).toISOString() : null,
        api: (await this.storage.get("apiInfo")) ?? null,
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
    if (/^\/match\/\d+$/.test(url.pathname) || url.pathname === "/live") {
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
    if (url.pathname === "/formazioni") return hub(env).fetch("https://hub/formazioni");
    if (url.pathname === "/prova") return hub(env).fetch("https://hub/prova");
    return new Response("QuotaGuru live", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(hub(env).fetch("https://hub/refresh"));
    const job = githubJob(new Date(event.scheduledTime));
    // the Telegram rubrics are sent for real: a dispatch without inputs would take the manual default (dry run)
    if (job) ctx.waitUntil(dispatchWorkflow(env, job, job === "telegram.yml" ? { prova: "false" } : undefined));
  },
};

// ---------- reliable timer for the GitHub workflows ----------
// GitHub runs scheduled workflows "best effort": under load it delays or skips them (on 2 Nov 2026 the
// 15-minute live-scores.yml started twice in a whole day). This worker's per-minute cron is reliable, so it
// starts the workflows itself through workflow_dispatch. Their own `schedule:` stays as a fallback.
// Needs the GH_DISPATCH_TOKEN secret (fine-grained token, this repository only, "Actions: Read and write");
// without it nothing happens.

/** Which workflow to start at this minute (UTC), or null. Same times as the crons in the workflow files. */
export function githubJob(d) {
  const m = d.getUTCMinutes();
  const h = d.getUTCHours();
  if (m === 37 && h === 5 && d.getUTCDay() === 1) return "analytics.yml"; // weekly statistics, Monday
  if (m === 17 && h % 3 === 0) return "deploy.yml"; // full refresh every 3 hours (it also updates the scores)
  if (m % 15 === 0) return "live-scores.yml"; // quick scores and standings
  if (m % 20 === 7 && h >= 6 && h <= 22) return "telegram.yml"; // Telegram channel rubrics (scripts/telegram)
  return null;
}

async function dispatchWorkflow(env, workflow, inputs) {
  if (!env.GH_DISPATCH_TOKEN || !env.GH_REPO) return;
  const res = await fetch(`https://api.github.com/repos/${env.GH_REPO}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      "user-agent": "quotaguru-live",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main", ...(inputs ? { inputs } : {}) }),
  });
  if (!res.ok) console.log(`workflow_dispatch ${workflow}: HTTP ${res.status} ${await res.text()}`);
}
