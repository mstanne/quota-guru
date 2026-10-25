// schema.org (JSON-LD) objects for the pre-rendered pages. Paths start with "/": the pre-render turns them into
// absolute URLs with SITE_URL. Kept free of data imports so it can be used by every route-meta builder.

type Status = "scheduled" | "postponed" | "cancelled";

const EVENT_STATUS: Record<Status, string> = {
  scheduled: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  cancelled: "https://schema.org/EventCancelled",
};

export function sportsEvent(e: {
  path: string;
  name: string;
  description: string;
  startDate: string;
  sport: string;
  league: string;
  home: { name: string; logo?: string | null };
  away: { name: string; logo?: string | null };
  status: Status;
}) {
  const team = (t: { name: string; logo?: string | null }) => ({
    "@type": "SportsTeam",
    name: t.name,
    ...(t.logo ? { logo: t.logo } : {}),
  });
  return {
    "@type": "SportsEvent",
    "@id": `${e.path}#evento`,
    url: e.path,
    name: e.name,
    description: e.description,
    startDate: e.startDate,
    eventStatus: EVENT_STATUS[e.status],
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: e.sport,
    superEvent: { "@type": "SportsEvent", name: e.league },
    homeTeam: team(e.home),
    awayTeam: team(e.away),
    competitor: [team(e.home), team(e.away)],
  };
}

/** VideoObject for an embedded YouTube video (Google video results). */
export function videoObject(v: { video: string; title: string; published: string }, description: string) {
  return {
    "@type": "VideoObject",
    name: v.title,
    description,
    thumbnailUrl: `https://i.ytimg.com/vi/${v.video}/hqdefault.jpg`,
    uploadDate: v.published,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.video}`,
    contentUrl: `https://www.youtube.com/watch?v=${v.video}`,
  };
}

/** "13 ottobre 2026" → "2026-10-13" (undefined if the text is not a date). */
const MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
export function isoFromItalianDate(text: string): string | undefined {
  const m = text.trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  const month = m ? MONTHS.indexOf(m[2]) + 1 : 0;
  if (!m || !month) return undefined;
  return `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Plain text of a string that may contain inline links written as [text](/path). */
export const plainText = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
