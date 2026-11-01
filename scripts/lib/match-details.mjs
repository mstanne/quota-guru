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
      comment: e.comments ?? null,
    }))
    .filter((e) => Number.isFinite(e.minute));
  const lineup = {};
  for (const l of lineups) {
    const s = side(l.team?.id);
    if (!s) continue;
    const p = (x) => ({ name: x.player?.name ?? "", number: x.player?.number ?? null, pos: x.player?.pos ?? null });
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
  for (const t of players) {
    const s = side(t.team?.id);
    if (!s) continue;
    for (const p of t.players ?? []) {
      const st = p.statistics?.[0] ?? {};
      const rating = num(st.games?.rating);
      if (rating == null) continue;
      const goals = st.goals?.total ?? 0;
      const assists = st.goals?.assists ?? 0;
      if (!top || rating > top.rating || (rating === top.rating && goals > top.goals)) {
        top = { name: p.player?.name ?? "", side: s, rating, goals, assists, minutes: st.games?.minutes ?? null };
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
    savedAt: new Date().toISOString(),
  };
}

