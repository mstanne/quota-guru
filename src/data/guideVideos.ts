/**
 * VIDEO RIASSUNTIVI DELLE GUIDE
 * Ogni voce indica una guida che ha il suo video in public/video/guide/<slug>-16x9.mp4 e -9x16.mp4
 * (con i poster .jpg). I video si generano con scripts/guide-videos/render.py a partire dagli
 * storyboard in scripts/guide-videos/storyboards/<slug>.json.
 */
export interface GuideVideo {
  /** Durata in secondi (per i dati strutturati). */
  seconds: number;
  /** Data di pubblicazione ISO, es. "2026-11-14". */
  published: string;
}

export const guideVideos: Record<string, GuideVideo> = {
  "come-leggere-le-quote": { seconds: 48, published: "2026-11-14" },
  "guida-completa-scommesse-sportive": { seconds: 55, published: "2026-11-14" },
};

/** Percorsi (relativi alla radice del sito) dei file di un video. */
export const guideVideoFiles = (slug: string) => {
  const base = `/video/guide/${slug}`;
  return {
    landscape: `${base}-16x9.mp4`,
    portrait: `${base}-9x16.mp4`,
    poster: `${base}-16x9.jpg`,
    posterPortrait: `${base}-9x16.jpg`,
  };
};
