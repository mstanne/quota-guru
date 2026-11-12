// Types for leagues.mjs (plain JavaScript shared by the build scripts, the live worker and the site).
export interface CompetitionDef {
  code: string;
  slug: string;
  name: string;
  api: number;
  area: string;
  domestic?: boolean;
  info?: boolean;
  tier?: number;
  cup?: boolean;
  supercup?: boolean;
  national?: boolean;
  calendar?: boolean;
  homeFinal?: boolean;
  twoLegs?: string[];
  apiName?: string;
  country?: string;
  leaders?: boolean;
}
export const COMPETITIONS: CompetitionDef[];
export const NATIONAL: CompetitionDef[];
export const NATIONAL_CUPS: CompetitionDef[];
export const INFO_LEAGUES: CompetitionDef[];
export function isNational(code: string): boolean;
export function isInfoLeague(code: string): boolean;
export function isNationalCup(code: string): boolean;
export function isCalendarSeason(code: string): boolean;
export function seasonYearOf(date: string, code: string): number;
