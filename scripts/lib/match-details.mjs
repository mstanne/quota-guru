// Compact form of the API-Football match details (events, line-ups, statistics, player ratings), shared by
// scripts/fetch-match-details.mjs (recent matches) and scripts/backfill-archive.mjs (past seasons).

export const num = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace("%", ""));
  return Number.isFinite(n) ? n : null;
};

/** Compact form of the four API-Football answers for one fixture. `sideOf(apiTeamId)` → "home" | "away" | null. */
export function footballDetails(fx, events, lineups, statistics, players, sideOf) {
  const side = (teamId) => sideOf(teamId);
  const timeline = events
    .filter((e) => side(e.team?.id))
    .map((e) => ({
      minute: e.time?.elapsed ?? null,
      extra: e.time?.extra ?? null,
      side: side(e.team.id),
      type: e.type === "subst" ? "sub" : String(e.type ?? "").toLowerCase(), // goal | card | sub | var
      detail: e.detail ?? "",
      player: e.player?.name ?? null,
      // for substitutions API-Football puts the player coming in under "assist"
      other: e.assist?.name ?? null,
      // API-Football ids: links to the player pages
      playerId: e.player?.id ?? null,
      otherId: e.assist?.id ?? null,
      comment: e.comments ?? null,
    }))
    .filter((e) => Number.isFinite(e.minute));
  const lineup = {};
  for (const l of lineups) {
    const s = side(l.team?.id);
    if (!s) continue;
    const p = (x) => ({ id: x.player?.id ?? null, name: x.player?.name ?? "", number: x.player?.number ?? null, pos: x.player?.pos ?? null });
    lineup[s] = {
      formation: l.formation ?? null,
      coach: l.coach?.name ?? null,
      starters: (l.startXI ?? []).map(p),
      bench: (l.substitutes ?? []).map(p),
    };
  }
  const stats = {};
  for (const t of statistics) {
    const s = side(t.team?.id);
    if (!s) continue;
    stats[s] = Object.fromEntries((t.statistics ?? []).map((x) => [x.type, num(x.value)]));
  }
  let top = null;
  const lines = {};
  for (const t of players) {
    const s = side(t.team?.id);
    if (!s) continue;
    for (const p of t.players ?? []) {
      const st = p.statistics?.[0] ?? {};
      const line = playerLine(p, st);
      if (line) (lines[s] ??= []).push(line);
      const rating = num(st.games?.rating);
      if (rating == null) continue;
      const goals = st.goals?.total ?? 0;
      const assists = st.goals?.assists ?? 0;
      if (!top || rating > top.rating || (rating === top.rating && goals > top.goals)) {
        top = { id: p.player?.id ?? null, name: p.player?.name ?? "", side: s, rating, goals, assists, minutes: st.games?.minutes ?? null };
      }
    }
  }
  return {
    fixture: fx.fixture?.id,
    venue: fx.fixture?.venue?.name ?? null,
    city: fx.fixture?.venue?.city ?? null,
    referee: fx.fixture?.referee ?? null,
    timeline,
    lineups: lineup,
    stats,
    top,
    ...(Object.keys(lines).length ? { players: lines } : {}),
    savedAt: new Date().toISOString(),
  };
}

/**
 * Every player who took part in a match, one compact row each (arrays keep the archive small: ~30 rows per match).
 * Order of the values: PLAYER_LINE. Used by the player pages (last matches, home/away), never by the match pages.
 */
export const PLAYER_LINE = [
  "id", "min", "rating", "goals", "assists", "shots", "shotsOn", "keyPasses", "yellow", "red", "starter", "saves", "conceded",
];
function playerLine(p, st) {
  const id = p.player?.id;
  const min = num(st.games?.minutes);
  if (id == null || !min) return null;
  const n = (v) => num(v) ?? 0;
  return [
    id,
    min,
    num(st.games?.rating),
    n(st.goals?.total),
    n(st.goals?.assists),
    n(st.shots?.total),
    n(st.shots?.on),
    n(st.passes?.key),
    n(st.cards?.yellow),
    n(st.cards?.red),
    st.games?.substitute ? 0 : 1,
    n(st.goals?.saves),
    n(st.goals?.conceded),
  ];
}
/** A row of PLAYER_LINE as an object. */
export const lineObject = (row) => Object.fromEntries(PLAYER_LINE.map((k, i) => [k, row[i] ?? null]));

