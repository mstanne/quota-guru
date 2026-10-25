// Football match details (src/data/football-details.json, written by scripts/fetch-match-details.mjs).
import raw from "../data/football-details.json";
import type { FootballDetails } from "./matchDetails";

const data = raw as unknown as Record<string, FootballDetails | undefined>;
export const footballDetailsFor = (matchId: number) => data[String(matchId)];
