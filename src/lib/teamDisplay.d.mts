// Types for teamDisplay.mjs (plain JavaScript shared by the site and the scripts).
export function fullName(short: string): string;
export function teamName(t: { shortName?: string | null; name?: string }): string;
export function fullLabel(label: string): string;
export function withFullNames<T>(x: T): T;
