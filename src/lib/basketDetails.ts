// NBA box scores (src/data/basket-details.json, written by scripts/fetch-match-details.mjs).
import raw from "../data/basket-details.json";
import type { NbaDetails } from "./matchDetails";

const data = raw as unknown as Record<string, NbaDetails | undefined>;
export const nbaDetailsFor = (gameId: number) => data[String(gameId)];
