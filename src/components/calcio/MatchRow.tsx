import { useState, type ReactNode } from "react";
import { Link } from "../../lib/links";
import { Check, ChevronRight, X } from "lucide-react";
import { compactTeamName } from "../../lib/teamNames";
import {
  formatTime,
  isFinished,
  isLive,
  isResultPending,
  liveMinute,
  matchHref,
  roundLabel,
  statusLabel,
  type CompetitionRef,
  type Match,
  type Team,
} from "../../lib/footballCore";
import { pct, type FootballMarket, type Prediction } from "../../lib/predictionsCore";
import { MarketMini, marketColumns } from "../predictions/PredictionUi";
import { footballSlip } from "../predictions/SlipPicks";

/**
 * Team crest (API-Football CDN). Falls back to the three-letter code if the crest is missing
 * or fails to load. The box size is fixed so the layout does not move while the image loads.
 */
export function TeamBadge({
  team,
  size = "sm",
}: {
  team: Pick<Team, "tla" | "crest" | "shortName">;
  /** xs: list rows (28 px) · sm: 36 px · lg: match page header */
  size?: "xs" | "sm" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const box =
    size === "lg" ? "w-16 h-16 rounded-xl p-2" : size === "xs" ? "w-7 h-7 rounded-md p-0.5" : "w-9 h-9 rounded-lg p-1";
  const px = size === "lg" ? 64 : size === "xs" ? 28 : 36;
  if (team.crest && !failed) {
    return (
      <span
        aria-hidden="true"
        className={`${box} shrink-0 inline-flex items-center justify-center bg-slate-800 border border-slate-700`}
      >
        <img
          src={team.crest}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain"
        />
      </span>
    );
  }
  const text = size === "lg" ? "text-lg" : size === "xs" ? "text-[9px]" : "text-[11px]";
  return (
    <span
      aria-hidden="true"
      className={`${box} ${text} shrink-0 inline-flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-200 font-semibold tracking-wide`}
    >
      {team.tla || "–"}
    </span>
  );
}

/**
 * One fixture/result row, linking to the match page. Upcoming matches show the model's probabilities, which are
 * buttons that add the outcome to the bet slip: the row is a "stretched" link (the link covers the whole row,
 * the probability buttons sit above it), so there are no buttons inside the link.
 */
export function MatchRow({
  competition,
  match,
  showCompetition = false,
  prediction,
  market = "1x2",
  columns = false,
  meta = true,
  outcome,
}: {
  competition: CompetitionRef;
  match: Match;
  showCompetition?: boolean;
  /** Competition and round column on the right (md+). Off in lists grouped by competition and round. */
  meta?: boolean;
  /** Finished matches: the model's most likely 1X2 outcome and whether it came true. */
  outcome?: PickOutcome;
  prediction?: Prediction | null;
  /** Market shown in the prediction cells (quick filter of the calendar page). */
  market?: FootballMarket;
  /** The list shows column headers (MatchListHeader): the probability cells drop their labels. */
  columns?: boolean;
}) {
  const finished = isFinished(match);
  const live = isLive(match);
  const pending = isResultPending(match);
  const ft = match.score.fullTime;
  const label = `${match.homeTeam.shortName} – ${match.awayTeam.shortName}, ${finished ? `risultato ${ft.home}-${ft.away}` : pending ? "risultato in arrivo" : `ore ${formatTime(match.utcDate)}`}`;

  const quickPick = !!prediction && !prediction.pre && !finished && !live && !pending;

  return (
    <div
      className={`group relative flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-2.5 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40 focus-within:bg-slate-800/40 transition-colors ${
        live ? "bg-red-500/5" : ""
      }`}
    >
      <Link
        to={matchHref(competition, match)}
        aria-label={label}
        className="flex flex-1 min-w-0 items-center gap-2.5 sm:gap-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-action focus-visible:after:-outline-offset-2"
      >
        <div className="w-11 sm:w-14 shrink-0 text-center">
          {finished ? (
            <span className="text-slate-400 text-xs uppercase tracking-wide">Finale</span>
          ) : live ? (
            <LiveMark minute={liveMinute(match)} label={statusLabel(match)} />
          ) : pending ? (
            <span className="block text-warn text-[11px] leading-tight">{statusLabel(match)}</span>
          ) : (
            <span className="text-white tabular-nums">{formatTime(match.utcDate)}</span>
          )}
          {match.status === "POSTPONED" && <span className="block text-amber-400 text-xs">Rinviata</span>}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {[
            { team: match.homeTeam, goals: ft.home, win: match.score.winner === "HOME_TEAM" },
            { team: match.awayTeam, goals: ft.away, win: match.score.winner === "AWAY_TEAM" },
          ].map(({ team, goals, win }) => (
            <div key={team.id} className="flex items-center gap-2">
              <TeamBadge team={team} size="xs" />
              <TeamName name={team.shortName} className={finished && !win ? "text-slate-400" : "text-white"} />
              {(finished || live) && (
                <span
                  className={`ml-auto tabular-nums ${live ? "text-white text-lg font-semibold" : `text-lg ${win ? "text-best" : "text-slate-300"}`}`}
                >
                  {goals ?? "–"}
                </span>
              )}
            </div>
          ))}
        </div>
      </Link>

      {prediction && !finished && !live && !pending && (
        <div className="relative z-10 shrink-0">
          <MarketMini
            prediction={prediction}
            market={market}
            home={match.homeTeam.shortName}
            away={match.awayTeam.shortName}
            slip={quickPick ? footballSlip(competition.name, match) : undefined}
            columns={columns}
          />
        </div>
      )}

      {outcome && finished && <OutcomeBadge outcome={outcome} />}

      {meta && (
        <div className="hidden md:block w-40 shrink-0 text-right text-xs text-slate-400">
          {showCompetition && <div className="text-slate-300 text-sm">{competition.name}</div>}
          <div>{roundLabel(match)}</div>
        </div>
      )}
      <ChevronRight
        className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-white shrink-0"
        aria-hidden="true"
      />
    </div>
  );
}

/** Team name of a list row: a shorter form on phones ("Salisburgo"), the data's name from `sm` up. */
export function TeamName({ name, short: given, className = "" }: { name: string; short?: string; className?: string }) {
  const short = given || compactTeamName(name);
  // a bit smaller on phones: the short names then fit next to the probability cells
  const cls = `truncate text-[15px] sm:text-base ${className}`;
  if (short === name) return <span className={cls}>{name}</span>;
  return (
    <span className={cls} title={name}>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{name}</span>
    </span>
  );
}

/** "In corso" mark of a live row: pulsing dot and the minute at the last update ("67'"), or the status. */
export function LiveMark({ minute, label }: { minute: string | null; label: string }) {
  return (
    <span
      className="flex flex-col items-center gap-1 text-red-400 text-[10px] leading-none font-semibold uppercase"
      title={minute ? "All'ultimo aggiornamento dei dati, non in tempo reale" : undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
      {minute ? (
        <span className="text-xs tabular-nums normal-case">
          <span className="sr-only">In corso, minuto </span>
          {minute}
        </span>
      ) : (
        label
      )}
    </span>
  );
}

/** The model's most likely outcome of a finished match and whether it came true. */
export interface PickOutcome {
  /** "1", "X", "2" */
  pick: string;
  /** What the pick stands for, for screen readers: "vittoria Inter", "pareggio". */
  spoken: string;
  prob: number;
  hit: boolean;
  /** true: the prediction published before kick-off (archive); false: recalculated by the model afterwards. */
  published: boolean;
}

/** ✓ / ✗ next to a result: the most likely outcome the model indicated, with its probability. */
export function OutcomeBadge({ outcome: o }: { outcome: PickOutcome }) {
  const Icon = o.hit ? Check : X;
  const what = `${o.published ? "Pronostico pubblicato" : "Pronostico ricalcolato"}: ${o.spoken} (${pct(o.prob)}), ${
    o.hit ? "azzeccato" : "non azzeccato"
  }`;
  return (
    <span
      role="img"
      aria-label={what}
      title={what}
      className={`shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs tabular-nums ${
        o.hit ? "bg-best/15 text-best" : "bg-slate-800 text-slate-400"
      }`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="font-semibold">{o.pick}</span>
      <span className="hidden sm:inline">{pct(o.prob)}</span>
    </span>
  );
}

/** Most likely 1X2 outcome of a finished football match against the 90-minute result (as the track record counts it). */
export function footballOutcome(
  match: Match,
  prediction: Prediction | undefined,
  published: boolean,
): PickOutcome | undefined {
  const ft = match.score.fullTime;
  if (!prediction?.p || ft.home == null || ft.away == null || !isFinished(match)) return undefined;
  const i = [0, 1, 2].reduce((a, b) => (prediction.p[b] > prediction.p[a] ? b : a), 0);
  // cup ties decided in extra time or on penalties: the 90-minute score, where the source has it
  const rt = match.score.regularTime ?? ft;
  const res = (rt.home ?? 0) > (rt.away ?? 0) ? 0 : rt.home === rt.away ? 1 : 2;
  const names = [`vittoria ${match.homeTeam.shortName}`, "pareggio", `vittoria ${match.awayTeam.shortName}`];
  return { pick: ["1", "X", "2"][i], spoken: names[i], prob: prediction.p[i], hit: i === res, published };
}

/**
 * Heading of a group of match rows (a day, "In corso"), with the column headers of the probability cells aligned
 * to the rows below (same paddings, gaps and widths as MatchRow). No column headers for combos (labels in the cells).
 */
export function MatchListHeader({
  id,
  title,
  market,
  columns,
  tone = "default",
  meta = true,
  as: Heading = "h2",
}: {
  /** Heading level of the title (h3 inside a page section that already has an h2). */
  as?: "h2" | "h3";
  id: string;
  title: ReactNode;
  market: FootballMarket;
  /** Show the column headers (only if the rows show prediction cells). */
  columns: boolean;
  tone?: "default" | "live";
  /** false: the rows have no competition column (MatchRow `meta`). */
  meta?: boolean;
}) {
  const { labels, width } = marketColumns(market);
  return (
    <div className="flex items-end gap-2.5 sm:gap-4 px-3 sm:px-4 mb-1.5">
      <Heading
        id={id}
        className={`flex-1 min-w-0 text-sm uppercase tracking-wide first-letter:uppercase ${
          tone === "live" ? "text-red-300" : "text-slate-300"
        }`}
      >
        {title}
      </Heading>
      {columns && labels && (
        <div className="flex gap-1 shrink-0" aria-hidden="true">
          {labels.map((l) => (
            <span key={l} className={`${width} text-center text-slate-400 text-xs whitespace-nowrap`}>
              {l}
            </span>
          ))}
        </div>
      )}
      {meta && <span className="hidden md:block w-40 shrink-0" aria-hidden="true" />}
      <span className="hidden sm:block w-4 shrink-0" aria-hidden="true" />
    </div>
  );
}

/**
 * Column headers of the probability cells alone (1 · X · 2…), aligned to the rows of a list card: for the bottom of
 * a sticky filter bar, so they stay visible while the list scrolls. The 1px side borders match the list cards.
 */
export function MatchListColumns({
  market,
  className = "",
  meta = true,
}: {
  market: FootballMarket;
  className?: string;
  /** false: the rows have no competition column (MatchRow `meta`). */
  meta?: boolean;
}) {
  const { labels, width } = marketColumns(market);
  if (!labels) return null;
  return <ListColumns labels={labels} width={width} className={className} meta={meta} />;
}

/** The same column strip with any labels and cell width (also used by the NBA list). */
export function ListColumns({
  labels,
  width,
  className = "",
  meta = true,
}: {
  labels: string[];
  width: string;
  className?: string;
  meta?: boolean;
}) {
  return (
    <div className={`border-x border-transparent ${className}`} aria-hidden="true">
      <div className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-4">
        <span className="flex-1" />
        <div className="flex gap-1 shrink-0">
          {labels.map((l) => (
            <span key={l} className={`${width} text-center text-slate-400 text-xs whitespace-nowrap`}>
              {l}
            </span>
          ))}
        </div>
        {meta && <span className="hidden md:block w-40 shrink-0" />}
        <span className="hidden sm:block w-4 shrink-0" />
      </div>
    </div>
  );
}
