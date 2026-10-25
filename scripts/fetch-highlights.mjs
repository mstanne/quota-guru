// Finds the official YouTube highlights of finished matches and writes src/data/highlights.json
// (match id → video). The pages embed the video from YouTube (click to load, youtube-nocookie.com):
// nothing is downloaded or re-hosted.
//
// Sources: the public feeds of the official channels (leagues or their official broadcasters) (latest 15 uploads, no key needed). If YOUTUBE_API_KEY is set
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

/** Official channels (leagues or their official broadcasters) and how their highlight titles name the teams.
 *  `rank`: lower is preferred when a channel posts several versions of the same match. */
const CHANNELS = [
  {
    // "Partita FOLLE a Bergamo! | ATALANTA-FROSINONE | HIGHLIGHTS | SERIE A ENILIVE 2026/27"
    key: "serie-a",
    channelId: "UCBJeMCIeLQos7wacox4hmLQ",
    channel: "Serie A",
    parse: (title) => {
      const m = title.match(/\|\s*([^|]+?)\s*-\s*([^|]+?)\s*\|\s*HIGHLIGHTS\b/i);
      // the channel posts an Italian and an English version: Italian preferred
      return m && { home: m[1], away: m[2], rank: /ENILIVE/i.test(title) ? 0 : 1 };
    },
  },
  {
    // "REAL SOCIEDAD 2 - 1 LEVANTE UD | RESUMEN LALIGA EA SPORTS"
    key: "liga",
    channelId: "UCTv-XvfzLX3i4IGWAm4sbmA",
    channel: "LALIGA EA SPORTS",
    parse: (title) => {
      const m = title.match(/^\s*(.+?)\s+\d+\s*-\s*\d+\s+(.+?)\s*\|\s*RESUMEN\b/i);
      return m && { home: m[1], away: m[2], rank: 0 };
    },
  },
  {
    // "Olise Punishes Late Blunder! | SC FREIBURG - FC BAYERN | Highlights | MD 7 – Bundesliga 2026/27"
    key: "bundesliga",
    channelId: "UC6UL29enLNe4mqwTfAyeNuw",
    channel: "Bundesliga",
    parse: (title) => {
      const m = title.match(/\|\s*([^|]+?)\s+-\s+([^|]+?)\s*\|\s*Highlights\b/i);
      return m && !/Bundesliga 2\b/i.test(title) && { home: m[1], away: m[2], rank: 0 };
    },
  },
  {
    // "Resumo: Rio Ave 0-4 Famalicão (Liga 26/27 #9)"
    key: "primeira-liga",
    channelId: "UCuIlu5oGIj1RzHOYmeSV5Eg",
    channel: "VSPORTS - Liga Portugal",
    parse: (title) => {
      const m = title.match(/^\s*Resumo:\s*(.+?)\s+\d+\s*-\s*\d+\s+(.+?)\s*\(Liga\b/i);
      return m && { home: m[1], away: m[2], rank: 0 };
    },
  },
  {
    // "LATE DRAMA! | Luton Town v Leicester City extended highlights" / "West Ham United v Southampton Highlights"
    key: "championship",
    channelId: "UCCmo_NIuQR5eU4AvBa6sEQQ",
    channel: "EFL",
    parse: (title) => {
      const m = title.match(/(?:^|\|)\s*([^|]+?)\s+v\s+([^|]+?)\s+(extended highlights|highlights)\s*$/i);
      return m && { home: m[1], away: m[2], rank: /extended/i.test(m[3]) ? 0 : 1 };
    },
  },
  {
    // "VASCO 3 X 2 CORINTHIANS | MELHORES MOMENTOS | 32ª RODADA | BRASILEIRÃO 2026 | ge.globo"
    key: "brasileirao",
    channelId: "UCgCKagVhzGnZcuP9bSMgMCg",
    channel: "ge tv (Globo)",
    parse: (title) => {
      const m = title.match(/^\s*(.+?)\s+\d+\s*X\s*\d+\s+(.+?)\s*\|\s*MELHORES MOMENTOS\b.*BRASILEIR/i);
      return m && { home: m[1], away: m[2], rank: 0 };
    },
  },
  {
    // "💫 OUAZANE met een BEAUTY ... 🏰 | Samenvatting Sparta - Ajax"
    key: "eredivisie",
    channelId: "UCXnPiEv1DoUCDAqDUXT9shQ",
    channel: "ESPN NL",
    parse: (title) => {
      const m = title.match(/Samenvatting\s+(.+?)\s+-\s+(.+?)\s*$/i);
      return m && { home: m[1], away: m[2], rank: 0 };
    },
  },
  {
    // "WARRIORS at SUNS | FULL GAME HIGHLIGHTS | October 24, 2026"
    key: "nba",
    channelId: "UCWJ2lWNubArHWmf3FIHbfcQ",
    channel: "NBA",
    parse: (title) => {
      const m = title.match(/^\s*(.+?)\s+at\s+(.+?)\s*\|\s*FULL GAME HIGHLIGHTS\b/i);
      return m && { home: m[2], away: m[1], rank: 0 };
    },
  },
];

// ---------- names ----------
// Generic words in club names, ignored when comparing ("FC Bayern München" ~ "FC BAYERN").
const STOP = new Set(
  "FC AC AS SS SSC US ACF CFC BC CALCIO HELLAS SPA SC SV VFL VFB TSV FSV TSG BSC AFC CF CD UD RC RCD SD CA SE EC FR FBC FBPA AF CR GD CS SBV".split(
    " ",
  ),
);
// How broadcasters name a few clubs, by football-data.org short code.
const ALIASES = { CAM: ["Atlético-MG", "Atletico Mineiro"], CAP: ["Athletico-PR", "Athletico Paranaense"] };

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)));
const subset = (a, b) => a.size > 0 && [...a].every((w) => b.has(w));

/** A team as the titles may name it: full name, short name, three-letter code and known aliases. */
function team(t) {
  const names = [t.name, t.shortName, t.tla, ...(ALIASES[t.tla] ?? [])].filter(Boolean);
  const all = new Set(names.flatMap((n) => [...tokens(n)]));
  return { all, names: names.map(tokens) };
}
/** The title names the team if its words all belong to the team's names, or it contains one of the names whole. */
function sameTeam(titleSide, t) {
  const words = tokens(titleSide);
  return subset(words, t.all) || t.names.some((n) => subset(n, words));
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
let football;
function finishedMatches(key) {
  if (key !== "nba") {
    football ??= JSON.parse(fs.readFileSync(FOOTBALL, "utf8"));
    const comp = football.competitions.find((c) => c.slug === key);
    return (comp?.matches ?? [])
      .filter((m) => m.status === "FINISHED")
      .map((m) => ({ id: m.id, kickoff: m.utcDate, home: team(m.homeTeam), away: team(m.awayTeam) }));
  }
  const data = JSON.parse(fs.readFileSync(BASKET, "utf8"));
  return data.nba.games
    .filter((g) => g.status === "final")
    .map((g) => ({
      id: g.id,
      kickoff: g.utcDate,
      home: team({ name: g.home.name, shortName: g.home.shortName, tla: g.home.abbr }),
      away: team({ name: g.away.name, shortName: g.away.shortName, tla: g.away.abbr }),
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
      .map(([id, { id: video, title, published }]) => [id, { video, title, published, channel: ch.channel }]),
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
