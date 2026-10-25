// Types for eventTiming.mjs (plain JavaScript shared by the site and the build scripts).
export type TimedSport = "football" | "basket";
export declare const EXPECTED_MINUTES: Record<TimedSport, number>;
export declare const DATA_DELAY_MINUTES: number;
export declare function overdueAfter(utcDate: string, sport: TimedSport): number;
export declare function isOverdue(utcDate: string, sport: TimedSport, refMs: number): boolean;
export declare const BUILD_TIME_FILE: string;
export declare const BUILD_TIME_MAX_AGE_MS: number;
