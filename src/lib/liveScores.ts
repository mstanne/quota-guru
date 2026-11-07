// Live scores for the match lists: score, status and minute of the matches under way, from GET /live of the site's
// live service (workers/live; address in VITE_LIVE_URL), every 30 seconds.
//
// One request for the whole page, however many rows show a match: every row asks for its match with useLiveMatch;
// the requests start when at least one of them is around kick-off or under way (inLiveWindow) and stop when none is
// (page changed, matches over). Pre-rendered pages and the first paint keep the data of the last site update.
// No third party is contacted and no cookie is set.
import { useCallback, useSyncExternalStore } from "react";
import type { Match, MatchStatus } from "./footballCore";
import { inLiveWindow } from "./sofascore";

const LIVE_URL = (import.meta.env.VITE_LIVE_URL ?? "").replace(/\/+$/, "");
const POLL_MS = 30_000;

/** Compact record of GET /live (workers/live scoreOf). */
interface LiveScore {
  id: number;
  /** API-Football short status: 1H, HT, 2H, FT… */
  s: string;
  min: number | null;
  ext: number | null;
  h: number | null;
  a: number | null;
  ph: number | null;
  pa: number | null;
  at: string;
}

let scores = new Map<number, LiveScore>();
let version = 0;
const listeners = new Set<() => void>();
const wanted = new Map<number, number>(); // fixture id → rows showing it
let timer: number | undefined;
let running = false;

async function load() {
  window.clearTimeout(timer);
  if (!wanted.size) {
    running = false;
    return;
  }
  if (document.visibilityState === "visible") {
    try {
      const res = await fetch(`${LIVE_URL}/live`);
      if (res.ok) {
        const d = (await res.json()) as { matches: LiveScore[] };
        scores = new Map(d.matches.map((m) => [m.id, m]));
        version++;
        listeners.forEach((l) => l());
      }
    } catch {
      /* network error: try again at the next round */
    }
  }
  timer = window.setTimeout(load, POLL_MS);
}

function onVisible() {
  if (document.visibilityState === "visible" && running) load();
}

function watch(id: number) {
  wanted.set(id, (wanted.get(id) ?? 0) + 1);
  if (!running) {
    running = true;
    document.addEventListener("visibilitychange", onVisible);
    // let all the rows of the page register first: one request for all of them
    timer = window.setTimeout(load, 0);
  }
  return () => {
    const n = (wanted.get(id) ?? 1) - 1;
    if (n > 0) wanted.set(id, n);
    else wanted.delete(id);
    if (!wanted.size) {
      running = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

const PLAYING = new Set(["1H", "2H", "ET", "P", "LIVE", "INT", "SUSP"]);
const PAUSE = new Set(["HT", "BT"]);

/** The match with the live service's score and status over the ones of the last site update. */
function overlay(m: Match, l: LiveScore): Match {
  let status: MatchStatus | null = null;
  if (PLAYING.has(l.s)) status = "IN_PLAY";
  else if (PAUSE.has(l.s)) status = "PAUSED";
  else if (l.s === "FT" || l.s === "AET" || l.s === "PEN") status = "FINISHED";
  else if (l.s === "AWD" || l.s === "WO") status = "AWARDED";
  else if (l.s === "PST") status = "POSTPONED";
  else if (l.s === "CANC" || l.s === "ABD") status = "CANCELLED";
  if (!status || l.h === null || l.a === null) return m;
  // a match already final in the site data stays as it is (the site has the complete record)
  if (m.status === "FINISHED" || m.status === "AWARDED") return m;
  const finished = status === "FINISHED" || status === "AWARDED";
  const pens = l.ph !== null && l.pa !== null ? { home: l.ph, away: l.pa } : null;
  const winner = !finished
    ? null
    : l.h !== l.a
      ? l.h > l.a
        ? "HOME_TEAM"
        : "AWAY_TEAM"
      : pens && pens.home !== pens.away
        ? pens.home > pens.away
          ? "HOME_TEAM"
          : "AWAY_TEAM"
        : "DRAW";
  return {
    ...m,
    status,
    elapsed: l.min ?? undefined,
    elapsedExtra: l.ext ?? undefined,
    score: {
      ...m.score,
      winner,
      fullTime: { home: l.h, away: l.a },
      ...(pens ? { penalties: pens, duration: "PENALTY_SHOOTOUT" as const } : {}),
    },
  };
}

const getVersion = () => version;
const getServerVersion = () => 0;
const subscribeAll = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * `match` with the live score while it is around kick-off or under way; unchanged before the first answer, on the
 * server, without the live service or outside the live window.
 */
export function useLiveMatch(match: Match): Match {
  const id = match.apiId;
  const active = !!LIVE_URL && !!id && match.status !== "FINISHED" && match.status !== "AWARDED";
  // stable between renders: a new function would unsubscribe and subscribe again at every update
  const subscribe = useCallback(
    (fn: () => void) => {
      if (!active || !inLiveWindow(match.utcDate)) return () => {};
      const unsubscribe = subscribeAll(fn);
      const unwatch = watch(id!);
      return () => {
        unsubscribe();
        unwatch();
      };
    },
    [active, id, match.utcDate],
  );
  useSyncExternalStore(subscribe, getVersion, getServerVersion);
  const l = active ? scores.get(id!) : undefined;
  return l ? overlay(match, l) : match;
}
