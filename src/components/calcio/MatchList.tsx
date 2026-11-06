// Football match list used across the site (calendar, home, predictions hub, "altre partite" of a match page):
// one card per Italian calendar day ("Oggi · venerdì 6 novembre"), rows in time order, a small heading whenever the
// competition (or round) changes from the row above, so the order by time is kept and the competition is not
// repeated on every row.
import { Fragment } from "react";
import { Link } from "../../lib/links";
import { competitionPath, romeDay, roundLabel, type CompetitionRef, type Match } from "../../lib/footballCore";
import { marketColumns } from "../predictions/PredictionUi";
import type { FootballMarket, Prediction } from "../../lib/predictionsCore";
import { DayLabel, useRomeToday } from "../predictions/DayLabel";
import { GroupSubheading } from "../predictions/ListTools";
import { MatchListHeader, MatchRow, type PickOutcome } from "./MatchRow";

export interface MatchListRow {
  competition: CompetitionRef;
  match: Match;
  prediction?: Prediction;
}

/** Days → runs of consecutive rows with the same competition and round. Rows must already be in display order. */
export function groupMatchRows<R extends MatchListRow>(rows: R[]) {
  const days: {
    day: string;
    iso: string;
    runs: { key: string; competition: CompetitionRef; round: string; items: R[] }[];
  }[] = [];
  for (const r of rows) {
    const day = romeDay(r.match.utcDate);
    let d = days[days.length - 1];
    if (!d || d.day !== day) days.push((d = { day, iso: r.match.utcDate, runs: [] }));
    const round = roundLabel(r.match);
    const key = `${r.competition.slug}|${round}`;
    let run = d.runs[d.runs.length - 1];
    if (!run || run.key !== key) d.runs.push((run = { key, competition: r.competition, round, items: [] }));
    run.items.push(r);
  }
  return days;
}

export function MatchList<R extends MatchListRow>({
  rows,
  market = "1x2",
  heads = "competition",
  columns: wantColumns = true,
  idPrefix = "giorno",
  linkQuery = "",
  outcome,
  maxDays,
  headingLevel = "h2",
  columnHeader = true,
}: {
  /** false: the column headers are shown elsewhere (sticky filter bar); the cells still drop their labels. */
  columnHeader?: boolean;
  rows: R[];
  market?: FootballMarket;
  /** Small heading inside each day: competition and round, round only (one competition), or none. */
  heads?: "competition" | "round" | "none";
  /** Column headers (1 · X · 2…) on the first day's heading, when the rows show probability cells. */
  columns?: boolean;
  /** Ids of the day headings (several lists on one page need different prefixes). */
  idPrefix?: string;
  /** Query kept by the competition links ("?mercato=…"). */
  linkQuery?: string;
  /** Finished matches: ✓/✗ of the model's pick (results lists). */
  outcome?: (r: R) => PickOutcome | undefined;
  maxDays?: number;
  headingLevel?: "h2" | "h3";
}) {
  const today = useRomeToday();
  const days = groupMatchRows(rows).slice(0, maxDays);
  const columns = wantColumns && !!marketColumns(market).labels && rows.some((r) => !!r.prediction);
  return (
    <div className="space-y-6">
      {days.map((d, i) => (
        <section key={d.day} aria-labelledby={`${idPrefix}-${d.day}`}>
          <MatchListHeader
            id={`${idPrefix}-${d.day}`}
            title={<DayLabel iso={d.iso} today={today} />}
            market={market}
            columns={columns && columnHeader && i === 0}
            meta={false}
            as={headingLevel}
          />
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            {d.runs.map((run) => (
              <Fragment key={`${run.key}-${run.items[0].match.id}`}>
                {heads !== "none" && (
                  <GroupSubheading>
                    {heads === "competition" && (
                      <>
                        <Link
                          to={`${competitionPath(run.competition)}${linkQuery}`}
                          className="relative z-10 text-slate-200 hover:text-white hover:underline"
                        >
                          {run.competition.name}
                        </Link>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{run.round}</span>
                  </GroupSubheading>
                )}
                {run.items.map((r) => (
                  <MatchRow
                    key={r.match.id}
                    competition={r.competition}
                    match={r.match}
                    prediction={r.prediction}
                    market={market}
                    columns={columns}
                    meta={false}
                    outcome={outcome?.(r)}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
