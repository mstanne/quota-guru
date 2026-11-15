/**
 * DOVE STANNO I VIDEO
 *
 * I video sono nel bucket R2 di Cloudflare `quotaguru-video`, pubblicato su https://video.quotaguru.it
 * (docs/video.md). La variabile del repository VIDEO_BASE (→ VITE_VIDEO_BASE nella build) dice al sito da dove
 * prenderli; se è vuota il sito usa i file in public/video, come prima del bucket.
 *
 * Struttura del bucket (stessa struttura sotto public/video):
 *   guide/<slug>-16x9.mp4 · -9x16.mp4 · -16x9.jpg · -9x16.jpg              video riassuntivi delle guide
 *   analisi/<sport>/<AAAA-MM-GG>/<partita>-16x9.mp4 · -9x16.mp4 · .jpg     analisi di una partita
 *   tris/<AAAA-MM-GG>-16x9.mp4 · -9x16.mp4 · .jpg                          la tripla del giorno
 *   multiple/<AAAA-MM-GG>-16x9.mp4 · -9x16.mp4 · .jpg                      le multiple del giorno
 * <sport>: calcio, basket, tennis. <partita>: lo slug della pagina della partita. Le date sono quelle italiane.
 * Ogni video ha due formati: orizzontale (16:9) per il sito su schermi larghi, verticale (9:16) per smartphone e social.
 */

/** Indirizzo del bucket, senza barra finale ("" = file del sito). */
export const VIDEO_BASE = (import.meta.env.VITE_VIDEO_BASE ?? "").replace(/\/+$/, "");

/** Indirizzo pubblico di un file del bucket, a partire dal suo nome (es. "guide/cash-out-16x9.mp4"). */
export const videoUrl = (key: string) => (VIDEO_BASE ? `${VIDEO_BASE}/${key}` : `/video/${key}`);

/** Nome dei file di un video, senza formato ed estensione. */
export const videoKeys = {
  guide: (slug: string) => `guide/${slug}`,
  analisi: (sport: "calcio" | "basket" | "tennis", date: string, match: string) => `analisi/${sport}/${date}/${match}`,
  tris: (date: string) => `tris/${date}`,
  multiple: (date: string) => `multiple/${date}`,
};

/** Indirizzi dei quattro file di un video (due formati e i loro poster). */
export const videoFiles = (key: string) => ({
  landscape: videoUrl(`${key}-16x9.mp4`),
  portrait: videoUrl(`${key}-9x16.mp4`),
  poster: videoUrl(`${key}-16x9.jpg`),
  posterPortrait: videoUrl(`${key}-9x16.jpg`),
});
