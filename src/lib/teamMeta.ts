// Title, description and structured data of the team pages (used by the pages and by the pre-render).
import type { FootballTeam, NationalTeam, NbaTeam } from "./teams";
import { teamPaths } from "./teams";
import { leagueOutlook, pct } from "./seasonOutlook";

export function footballTeamMeta(t: FootballTeam) {
  const path = `${teamPaths.football}/${t.slug}`;
  const cur = t.seasons.find((s) => s.current);
  const where = cur?.record ? `, ${cur.record.position}ª in ${t.competition.name}` : "";
  // end-of-season projection (src/lib/seasonOutlook.ts): expected points and the chance of the main zone
  const o = leagueOutlook(t.competition.slug)?.team(t.id);
  // the zone that says most about the team: the likeliest one after the first place (Champions, playoff, relegation…)
  const z = o?.zones.slice(1).sort((a, b) => b.p - a.p)[0];
  const outlook = o
    ? ` Proiezione del modello: ${o.xpts.toFixed(0)} punti attesi a fine stagione${z && z.p >= 0.01 ? ` (${z.zone.short.toLowerCase()}: ${pct(z.p)})` : ""}.`
    : "";
  const description = (
    `${t.name}${t.founded ? ` (fondata nel ${t.founded})` : ""}: informazioni sulla società, rosa ${cur?.label ?? ""}` +
    `${where} e statistiche stagione per stagione.${outlook}`
  ).replace(/\s+/g, " ");
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

const CONFED_IT: Record<string, string> = {
  UEFA: "UEFA (Europa)",
  CONMEBOL: "CONMEBOL (Sudamerica)",
  CAF: "CAF (Africa)",
  AFC: "AFC (Asia)",
  CONCACAF: "CONCACAF (Nord e Centro America)",
  OFC: "OFC (Oceania)",
};
export const confedLabel = (c: string | null) => (c ? (CONFED_IT[c] ?? c) : null);

export function nationalTeamMeta(t: NationalTeam) {
  const path = `${teamPaths.football}/${t.slug}`;
  const next = t.upcoming[0];
  const description =
    `Nazionale di calcio ${t.name === "Italia" ? "italiana" : `di ${t.name}`}: ` +
    (next ? `prossima partita contro ${next.opponent} (${next.competition}) con il pronostico, ` : "") +
    "ultimi risultati, bilancio anno per anno, convocati e commissario tecnico.";
  return {
    path,
    title: `Nazionale ${t.name}: pronostici, risultati e convocati`,
    description,
    image: undefined,
    jsonLd: [
      {
        "@type": "SportsTeam",
        "@id": `${path}#squadra`,
        name: `Nazionale di calcio: ${t.name}`,
        alternateName: t.name,
        sport: "Calcio",
        url: path,
        logo: t.crest ?? undefined,
        memberOf: t.confed ? { "@type": "SportsOrganization", name: t.confed } : undefined,
        coach: t.coach ? { "@type": "Person", name: t.coach.name } : undefined,
      },
    ],
  };
}
