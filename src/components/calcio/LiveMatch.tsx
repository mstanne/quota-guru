// Live data of a match on its page: score, minute, events, official line-ups and statistics, refreshed every
// 30 seconds from the site's own live service (Cloudflare Worker, workers/live; address in VITE_LIVE_URL).
// useLiveData polls once for the whole page: the score and status at the top of the page (CalcioMatchPage) and the
// details below (LiveMatch) show the same data.
// The page is pre-rendered with the data of the last site update (match.live, every 15 minutes): that is what
// search engines and the first paint show; in the browser the widget then keeps it up to date. No third party is
// contacted and no cookie is set. Without VITE_LIVE_URL, or outside the match window, it shows the static data only.
import { useEffect, useState } from "react";
import { isLive, isUpcoming, type Match } from "../../lib/footballCore";
import type { FootballDetails } from "../../lib/matchDetails";
import { inLiveWindow } from "../../lib/sofascore";
import { FootballMatchDetails } from "./FootballMatchDetails";

const LIVE_URL = (import.meta.env.VITE_LIVE_URL ?? "").replace(/\/+$/, "");
const POLL_MS = 30_000;
export interface LiveData extends Pick<FootballDetails, "timeline" | "lineups" | "stats" | "top"> {
  id: number;
  status: { short: string; long: string; elapsed: number | null; extra: number | null };
  score: { home: number | null; away: number | null; halftime: { home: number | null; away: number | null } | null; penalty: { home: number | null; away: number | null } | null };
  updatedAt: string;
}

const STATUS: Record<string, string> = {
  TBD: "Orario da definire", NS: "Non ancora iniziata", "1H": "Primo tempo", HT: "Intervallo", "2H": "Secondo tempo",
  ET: "Tempi supplementari", BT: "Pausa prima dei supplementari", P: "Calci di rigore", SUSP: "Sospesa", INT: "Interrotta",
  LIVE: "In corso", FT: "Finale", AET: "Finale dopo i supplementari", PEN: "Finale dopo i rigori", PST: "Rinviata",
  CANC: "Annullata", ABD: "Sospesa definitivamente", AWD: "Vittoria a tavolino", WO: "Vittoria a tavolino",
};
export const PLAYING = new Set(["1H", "2H", "ET", "P", "LIVE"]);
export const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "PST"]);
export const liveTime = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));

/** Started (or over) according to the live service. */
export const liveStarted = (d: LiveData | null): d is LiveData => !!d && d.status.short !== "NS" && d.status.short !== "TBD";

/** "Intervallo", "Secondo tempo · 67'", "Finale". */
export function liveStatusText(d: LiveData) {
  const st = d.status;
  const minute = PLAYING.has(st.short) && st.elapsed != null ? ` · ${st.elapsed}${st.extra ? `+${st.extra}` : ""}'` : "";
  return `${STATUS[st.short] ?? st.long}${minute}`;
}

/** Live data of the match from the live service, every 30 seconds while the page is visible; null until it answers. */
export function useLiveData(match: Match, enabled = true) {
  const [data, setData] = useState<LiveData | null>(null);

  useEffect(() => {
    if (!enabled || !LIVE_URL || !match.apiId || !inLiveWindow(match.utcDate)) return;
    let stop = false;
    let timer: number | undefined;
    let finalSeen = 0;
    let loaded = false;
    const load = async () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`${LIVE_URL}/match/${match.apiId}`);
          if (res.ok) {
            const d = (await res.json()) as LiveData;
            loaded = true;
            if (!stop) setData(d);
            if (FINAL.has(d.status.short)) finalSeen++;
          }
        } catch {
          /* network error: try again at the next round */
        }
      }
      // a couple of rounds after the final whistle (late statistics), then stop
      if (!stop && finalSeen < 3) timer = window.setTimeout(load, POLL_MS);
    };
    load();
    const onVisible = () => document.visibilityState === "visible" && !loaded && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, match.apiId, match.utcDate]);

  return data;
}

export function LiveMatch({ match, initial, data }: { match: Match; initial?: Match["live"]; data: LiveData | null }) {
  const details = data ?? initial;
  if (!details) return null;
  const hasContent = details.timeline.length || details.lineups.home || details.lineups.away || Object.keys(details.stats).length;
  const started = liveStarted(data);

  return (
    <div className="lg:col-span-3 min-w-0 space-y-6">
      {hasContent ? (
        <FootballMatchDetails
          match={match}
          details={details}
          lineupTitle={(data ? !started : isUpcoming(match)) ? "Formazioni ufficiali" : "Formazioni"}
          phase={
            data
              ? !started
                ? "upcoming"
                : FINAL.has(data.status.short)
                  ? "finished"
                  : "live"
              : isLive(match)
                ? "live"
                : "upcoming"
          }
        />
      ) : null}
    </div>
  );
}
