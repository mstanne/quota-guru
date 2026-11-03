// Title, description and structured data of the player pages (used by the page and by the pre-render).
import type { FootballPlayer } from "./players";
import { teamPaths } from "./teams";

export function playerMeta(p: FootballPlayer) {
  const cur = p.seasons.find((s) => s.team.id === p.team.id) ?? p.seasons[0];
  const role = p.position ? `${p.position.toLowerCase()} ` : "";
  const stats = cur
    ? `${cur.goals} gol e ${cur.assists} assist in ${cur.apps} presenze nel ${cur.label}`
    : "statistiche della stagione";
  return {
    path: p.url,
    title: `${p.name}: statistiche ${cur?.label ?? ""} e carriera`.replace(/\s+/g, " "),
    description: `${p.name}, ${role}del ${p.team.shortName}${p.nationality ? ` (${p.nationality})` : ""}: ${stats}, ${
      p.current?.detail ? "tiri, passaggi chiave, duelli, " : ""
    }voto medio, ${p.current?.last.length ? "ultime partite " : ""}e statistiche stagione per stagione.`,
    jsonLd: [
      {
        "@type": "Person",
        "@id": `${p.url}#giocatore`,
        name: p.name,
        alternateName: p.fullName !== p.name ? p.fullName : undefined,
        url: p.url,
        birthDate: p.birth ?? undefined,
        nationality: p.nationality ? { "@type": "Country", name: p.nationality } : undefined,
        height: p.height ? { "@type": "QuantitativeValue", value: p.height, unitCode: "CMT" } : undefined,
        jobTitle: p.position ? `Calciatore (${p.position.toLowerCase()})` : "Calciatore",
        memberOf: { "@type": "SportsTeam", name: p.team.name, url: `${teamPaths.football}/${p.team.slug}` },
      },
    ],
  };
}
