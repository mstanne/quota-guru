// Links to the football player pages from data that has only the API-Football id and an abbreviated name (match
// line-ups, events, best player): id → URL name of every page (src/data/players/slugs.json, scripts/derive-players.mjs).
import slugs from "../data/players/slugs.json";
import { PLAYER_BASE } from "./playerNames.mjs";

const bySlug = slugs as Record<string, string>;

/** URL of the player's page, or undefined if the player has none. */
export const footballPlayerHref = (id?: number | null) =>
  id != null && bySlug[id] ? `${PLAYER_BASE}/${bySlug[id]}-${id}` : undefined;
