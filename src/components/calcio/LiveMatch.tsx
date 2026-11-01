// Live data of a match on its page: score, minute, events, official line-ups and statistics, refreshed every
// 30 seconds from the site's own live service (Cloudflare Worker, workers/live; address in VITE_LIVE_URL).
// The page is pre-rendered with the data of the last site update (match.live, every 15 minutes): that is what
// search engines and the first paint show; in the browser the widget then keeps it up to date. No third party is
// contacted and no cookie is set. Without VITE_LIVE_URL, or outside the match window, it shows the static data only.
import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { isUpcoming, type Match } from "../../lib/footballCore";
import type { FootballDetails } from "../../lib/matchDetails";
import { inLiveWindow } from "../../lib/sofascore";
import { FootballMatchDetails } from "./FootballMatchDetails";

const LIVE_URL = (import.meta.env.VITE_LIVE_URL ?? "").replace(/\/+$/, "");
const POLL_MS = 30_000;
const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

interface LiveData extends Pick<FootballDetails, "timeline" | "lineups" | "stats" | "top"> {
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
const PLAYING = new Set(["1H", "2H", "ET", "P", "LIVE"]);
const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "PST"]);
const time = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));

export function LiveMatch({ match, initial }: { match: Match; initial?: Match["live"] }) {
  const [data, setData] = useState<LiveData | null>(null);

  useEffect(() => {
    if (!LIVE_URL || !match.apiId || !inLiveWindow(match.utcDate)) return;
    let stop = false;
    let timer: number | undefined;
    let finalSeen = 0;
    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`${LIVE_URL}/match/${match.apiId}`);
          if (res.ok) {
            const d = (await res.json()) as LiveData;
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
    const onVisible = () => document.visibilityState === "visible" && data === null && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.apiId, match.utcDate]);

  const details = data ?? initial;
  if (!details) return null;
  const hasContent = details.timeline.length || details.lineups.home || details.lineups.away || Object.keys(details.stats).length;
  const st = data?.status;
  const started = st && st.short !== "NS" && st.short !== "TBD";

  return (
    <div className="lg:col-span-3 min-w-0 space-y-6">
      {data && started && (
        <section className={card} aria-labelledby="diretta" aria-live="polite">
          <h2 id="diretta" className="flex items-center gap-2 text-white text-xl mb-4">
            <Radio className={`w-5 h-5 ${PLAYING.has(st.short) ? "text-red-500 animate-pulse motion-reduce:animate-none" : "text-slate-300"}`} aria-hidden="true" />
            {FINAL.has(st.short) ? "Risultato" : "In diretta"}
          </h2>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-w-xl mx-auto text-center">
            <span className="text-white text-lg">{match.homeTeam.shortName}</span>
            <span className="text-white text-4xl tabular-nums">
              {data.score.home ?? 0} <span className="text-slate-400">–</span> {data.score.away ?? 0}
            </span>
            <span className="text-white text-lg">{match.awayTeam.shortName}</span>
          </div>
          <p className="text-center mt-2 text-sm">
            <span className={PLAYING.has(st.short) ? "text-red-400" : "text-slate-300"}>
              {STATUS[st.short] ?? st.long}
              {PLAYING.has(st.short) && st.elapsed != null && ` · ${st.elapsed}${st.extra ? `+${st.extra}` : ""}'`}
            </span>
            {data.score.penalty?.home != null && (
              <span className="text-slate-300">
                {" "}
                · rigori {data.score.penalty.home}–{data.score.penalty.away}
              </span>
            )}
          </p>
          <p className="text-center text-slate-500 text-xs mt-2">Aggiornato alle {time(data.updatedAt)} · si aggiorna da solo ogni 30 secondi</p>
        </section>
      )}
      {hasContent ? (
        <FootballMatchDetails match={match} details={details} lineupTitle={(data ? !started : isUpcoming(match)) ? "Formazioni ufficiali" : "Formazioni"} />
      ) : null}
    </div>
  );
}
