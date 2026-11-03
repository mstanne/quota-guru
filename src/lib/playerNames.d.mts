export interface PlayerNameParts {
  id?: number | null;
  name: string;
  first?: string | null;
  last?: string | null;
}
export function playerName(p: PlayerNameParts): string;
export const PLAYER_BASE: string;
export function playerUrl(p: PlayerNameParts & { id: number }): string;
export function playerPart(id: number | string): number;
export const NBA_PLAYER_BASE: string;
export function nbaPlayerUrl(p: { name: string; id: number }): string;
export function nbaPlayerPart(id: number | string): number;
