// Finds the official YouTube highlights of finished matches and writes src/data/highlights.json
// (match id → video). The pages embed the video from YouTube (click to load, youtube-nocookie.com):
// nothing is downloaded or re-hosted.
//
// Sources: the official channels' public feeds (latest 15 uploads, no key needed). If YOUTUBE_API_KEY is set
// (free Google key, YouTube Data API v3) the latest 50 uploads are read instead, so busy nights are covered too.
// Videos already found are kept in .cache/match-details/highlights.json (restored between workflow runs).
//
// Usage:  node scripts/fetch-highlights.mjs        (after the data downloads; never fails the build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src", "data", "highlights.json");
const STORE = path.join(root, ".cache", "match-details", "highlights.json");
const FOOTBALL = path.join(root, "src", "data", "football.json");
const BASKET = path.join(root, "src", "data", "basket.json");
const MAX_DELAY_DAYS = 4; // a video counts only if published within N days after kick-off

/** Official channels and how their highlight titles name the two teams. */
const CHANNELS = [
  {
    // "Partita FOLLE a Bergamo! | ATALANTA-FROSINONE | HIGHLIGHTS | SERIE A ENILIVE 2026/27"
    key: "serie-a",
    channelId: "UCBJeMCIeLQos7wacox4hmLQ",
    parse: (title) => {
      const m = title.match(/\|\s*([^|]+?)\s*-\s*([^|]+?)\s*\|\s*HIGHLIGHTS\b/i);
      if (!m) return null;
      // the channel posts an Italian and an English version: Italian preferred
      return { home: m[1], away: m[2], rank: /ENILIVE/i.test(title) ? 0 : 1 };
    },
  },
  {
    // "WARRIORS at SUNS | FULL GAME HIGHLIGHTS | October 24, 2026"
    key: "nba",
    channelId: "UCWJ2lWNubArHWmf3FIHbfcQ",
    parse: (title) => {
      const m = title.match(/^\s*(.+?)\s+at\s+(.+?)\s*\|\s*FULL GAME HIGHLIGHTS\b/i);
      return m ? { home: m[2], away: m[1], rank: 0 } : null;
    },
  },
];

// ---------- names ----------
const STOP = new Set(["FC", "AC", "AS", "SS", "SSC", "US", "ACF", "CFC", "BC", "CALCIO", "HELLAS", "SPA"]);
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** Words that identify a team: "FC Internazionale Milano" + "Inter" → INTER, INTERNAZIONALE, MILANO. */
function teamKeys(...names) {
  const keys = new Set();
  for (const n of names.filter(Boolean)) {
    const full = norm(n);
    keys.add(full);
    const words = full.split(" ").filter((w) => !STOP.has(w) && !/^\d+$/.test(w));
    if (words.length) keys.add(words.join(" "));
  }
  return keys;
}
/** The side named in the title is the team's short name, or its full name without the generic words. */
function sameTeam(titleSide, keys) {
  const t = norm(titleSide);
  return [...keys].some((k) => k === t || (k.length > 3 && (k.endsWith(` ${t}`) || k.startsWith(`${t} `))));
}

// ---------- feeds ----------
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

async function latestVideos(channelId) {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const uploads = `UU${channelId.slice(2)}`;
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploads}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API HTTP ${res.status}`);
    const json = await res.json();
    return (json.items || []).map((it) => ({
      id: it.snippet?.resourceId?.videoId,
      title: it.snippet?.title ?? "",
      published: it.snippet?.publishedAt ?? "",
    }));
  }
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>([^<]+)/)?.[1],
    title: decode(e.match(/<title>([^<]*)/)?.[1] ?? ""),
    published: e.match(/<published>([^<]+)/)?.[1] ?? "",
  }));
}

// ---------- matches ----------
function finishedMatches(key) {
  if (key === "serie-a") {
    const data = JSON.parse(fs.readFileSync(FOOTBALL, "utf8"));
    const comp = data.competitions.find((c) => c.slug === "serie-a");
    return (comp?.matches ?? [])
      .filter((m) => m.status === "FINISHED")
      .map((m) => ({
        id: m.id,
        kickoff: m.utcDate,
        home: teamKeys(m.homeTeam.shortName, m.homeTeam.name),
        away: teamKeys(m.awayTeam.shortName, m.awayTeam.name),
      }));
  }
  const data = JSON.parse(fs.readFileSync(BASKET, "utf8"));
  return data.nba.games
    .filter((g) => g.status === "final")
    .map((g) => ({
      id: g.id,
      kickoff: g.utcDate,
      home: teamKeys(g.home.shortName, g.home.name),
      away: teamKeys(g.away.shortName, g.away.name),
    }));
}

const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, "utf8")) : {};
const out = {};
for (const ch of CHANNELS) {
  const known = (store[ch.key] ??= {});
  const matches = finishedMatches(ch.key);
  let found = 0;
  try {
    const videos = await latestVideos(ch.channelId);
    for (const v of videos) {
      const p = v.id && ch.parse(v.title);
      if (!p) continue;
      const published = Date.parse(v.published);
      const match = matches.find((m) => {
        const delay = published - Date.parse(m.kickoff);
        return delay > 0 && delay < MAX_DELAY_DAYS * 86400000 && sameTeam(p.home, m.home) && sameTeam(p.away, m.away);
      });
      if (!match) continue;
      const prev = known[match.id];
      if (prev && prev.rank <= p.rank) continue;
      known[match.id] = { id: v.id, title: v.title, published: v.published, rank: p.rank };
      found++;
    }
  } catch (err) {
    console.warn(`Highlights ${ch.key}: canale non raggiungibile (${err.message}), uso quelli già trovati`);
  }
  // publish only the matches still in the data (archived pages keep the video in their saved HTML)
  const ids = new Set(matches.map((m) => String(m.id)));
  out[ch.key] = Object.fromEntries(
    Object.entries(known)
      .filter(([id]) => ids.has(id))
      .map(([id, { id: video, title, published }]) => [id, { video, title, published }]),
  );
  // forget videos of matches that left the data long ago
  for (const [id, v] of Object.entries(known)) {
    if (!ids.has(id) && Date.now() - Date.parse(v.published) > 90 * 86400000) delete known[id];
  }
  console.log(`Highlights ${ch.key}: ${Object.keys(out[ch.key]).length} partite con video (${found} nuovi)`);
}

fs.mkdirSync(path.dirname(STORE), { recursive: true });
fs.writeFileSync(STORE, JSON.stringify(store));
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...out }) + "\n");
