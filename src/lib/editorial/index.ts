// Editorial texts of match pages: template text from the data (engine.mjs), replaced by the
// Claude rewrite saved by scripts/generate-editorial.mjs only if it was made from the same template.
import rewrites from "../../data/editorial-ai.json";
import { footballArticle, nbaArticle, withRewrite, type Article, type Rewrite } from "./engine.mjs";

export type { Article } from "./engine.mjs";

const items = (rewrites as { items: Record<string, Rewrite> }).items;

export function footballEditorial(input: { comp: unknown; match: { id: number }; h2h?: unknown; generatedAt: string }): Article | null {
  const art = footballArticle(input);
  return art ? withRewrite(art, items[art.key]) : null;
}

export function nbaEditorial(input: { game: { id: number }; games: unknown[]; season: number; generatedAt: string }): Article | null {
  const art = nbaArticle(input);
  return art ? withRewrite(art, items[art.key]) : null;
}
