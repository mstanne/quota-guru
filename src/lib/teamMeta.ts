// Title, description and structured data of the team pages (used by the pages and by the pre-render).
import type { FootballTeam, NbaTeam } from "./teams";
import { teamPaths } from "./teams";

export function footballTeamMeta(t: FootballTeam) {
  const path = `${teamPaths.football}/${t.slug}`;
  const cur = t.seasons.find((s) => s.current);
  const where = cur?.record ? `, ${cur.record.position}ª in ${t.competition.name}` : "";
  const description =
    `${t.name}${t.founded ? ` (fondata nel ${t.founded})` : ""}: informazioni sulla società, rosa ${cur?.label ?? ""}` +
    `${where} e statistiche stagione per stagione.`.replace(/\s+/g, " ");
  return {
    path,
    title: `${t.shortName}: rosa, statistiche e stagioni`,
    description,
    image: undefined,
    jsonLd: [
      {
        "@type": "SportsTeam",
        "@id": `${path}#squadra`,
        name: t.name,
        alternateName: t.shortName !== t.name ? t.shortName : undefined,
        sport: "Calcio",
        url: path,
        logo: t.crest ?? undefined,
        foundingDate: t.founded ? String(t.founded) : undefined,
        memberOf: { "@type": "SportsOrganization", name: t.competition.name },
        location: t.venue ? { "@type": "StadiumOrArena", name: t.venue.name, address: t.venue.city ?? undefined } : undefined,
        coach: t.coach ? { "@type": "Person", name: t.coach.name } : undefined,
        sameAs: t.website ? [t.website] : undefined,
      },
    ],
  };
}

export function nbaTeamMeta(t: NbaTeam) {
  const path = `${teamPaths.nba}/${t.slug}`;
  const cur = t.seasons.find((s) => s.current);
  const rec = cur?.record ? ` (${cur.record.won}-${cur.record.lost} nella stagione ${cur.label})` : "";
  return {
    path,
    title: `${t.name}: roster, statistiche e stagioni NBA`,
    description: `${t.name}${rec}: roster, record e statistiche dei giocatori stagione per stagione.`,
    jsonLd: [
      {
        "@type": "SportsTeam",
        "@id": `${path}#squadra`,
        name: t.name,
        sport: "Pallacanestro",
        url: path,
        memberOf: { "@type": "SportsOrganization", name: "NBA" },
        location: t.city ? { "@type": "Place", name: t.city } : undefined,
      },
    ],
  };
}
