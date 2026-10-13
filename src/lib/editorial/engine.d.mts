// Types for engine.mjs (plain JavaScript shared by the site and scripts/generate-editorial.mjs).
export interface ArticleSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
}
export interface Article {
  key: string;
  sport: "calcio" | "basket" | "tennis";
  kind: "preview" | "recap";
  title: string;
  sections: ArticleSection[];
  faq: { q: string; a: string }[];
  note: string;
  fingerprint: string;
  source: "template" | "ai";
}
export interface Rewrite {
  fingerprint: string;
  sections: { id: string; paragraphs?: string[]; bullets?: string[] }[];
  faq?: { q: string; a: string }[];
}
export const PREVIEW_WINDOW_DAYS: number;
export function hash(str: string): string;
export function teamName(t: { shortName?: string; name: string }): string;
export function footballPreview(input: { comp: any; match: any; h2h?: any; generatedAt: string }): Article | null;
export function footballRecap(input: { comp: any; match: any; generatedAt: string }): Article | null;
export function footballArticle(input: { comp: any; match: any; h2h?: any; generatedAt: string }): Article | null;
export function nbaPreview(input: { game: any; games: any[]; season: number; generatedAt: string }): Article | null;
export function nbaRecap(input: { game: any; generatedAt: string }): Article | null;
export function nbaArticle(input: { game: any; games: any[]; season: number; generatedAt: string }): Article | null;
export function tennisArticle(input: { match: any; generatedAt: string }): Article | null;
export const BANNED: RegExp[];
export function textsOf(art: Article): string[];
export function checkArticle(art: Article, reference?: Article): string[];
export function withRewrite(art: Article | null, rewrite?: Rewrite | null): Article | null;
