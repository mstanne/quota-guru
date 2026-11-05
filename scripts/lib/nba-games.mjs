// Reading an API-NBA game (v2.nba.api-sports.io /games): status, score, quarters. Shared by the full download
// (scripts/fetch-basket-data.mjs) and the quick live update (scripts/lib/live-nba.mjs), so both write the same fields.

/** Site status of an API-NBA game: "scheduled", "live", "final" or "postponed". */
export function nbaStatusOf(g) {
  const long = String(g.status?.long ?? "").toLowerCase();
  if (long.includes("postponed") || long.includes("canceled") || long.includes("cancelled")) return "postponed";
  if (g.status?.short === 3 || long === "finished") return "final";
  if (g.status?.short === 2 || long.includes("play") || long.includes("half")) return "live";
  return "scheduled";
}

/**
 * The fields of a site game that change while it is played: status, score, points per quarter (final games), the
 * quarter being played and the half-time break (live games, only when the API has them).
 */
export function nbaGameState(g) {
  const status = nbaStatusOf(g);
  const lines = (side) => (g.scores?.[side]?.linescore ?? []).map(Number).filter((n) => Number.isFinite(n));
  return {
    status,
    score:
      status === "scheduled" || status === "postponed"
        ? { home: null, away: null }
        : { home: g.scores?.home?.points ?? null, away: g.scores?.visitors?.points ?? null },
    periods: status === "final" ? { home: lines("home"), away: lines("visitors") } : null,
    // quarter being played (1–4, 5+ = overtime) and half-time break, for games under way
    ...(status === "live" && g.periods?.current
      ? { period: g.periods.current, ...(g.status?.halftime ? { halftime: true } : {}) }
      : {}),
  };
}
