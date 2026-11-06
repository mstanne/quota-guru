// Structured data of the home page: the upcoming matches listed there (ItemList of links to their prediction
// pages), so search engines see what the page is a hub of. Server only (src/entry-server.tsx).
import home from "../data/football-home.json";
import { matchHref, type CompetitionRef, type Match } from "./footballCore";

const data = home as unknown as { matches: { competition: CompetitionRef; match: Match }[] };

export function homeItemList(limit = 12) {
  const items = data.matches.slice(0, limit);
  if (!items.length) return [];
  return [
    {
      "@type": "ItemList",
      "@id": "/#prossime-partite",
      name: "Prossimi pronostici di calcio",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: items.length,
      itemListElement: items.map(({ competition, match }, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: matchHref(competition, match),
        name: `Pronostico ${match.homeTeam.shortName} – ${match.awayTeam.shortName} (${competition.name})`,
      })),
    },
  ];
}
