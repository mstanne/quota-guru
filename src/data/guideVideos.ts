/**
 * VIDEO RIASSUNTIVI DELLE GUIDE
 * Ogni voce indica una guida che ha il suo video guide/<slug>-16x9.mp4 e -9x16.mp4 (con i poster .jpg) nel bucket
 * dei video (videos.ts, docs/video.md). I video si generano con scripts/guide-videos/render.py a partire dagli
 * storyboard in scripts/guide-videos/storyboards/<slug>.json; il workflow "Video" li genera e li carica sul bucket.
 */
import { videoFiles, videoKeys } from "./videos";

export interface GuideVideo {
  /** Durata in secondi (per i dati strutturati). */
  seconds: number;
  /** Data di pubblicazione ISO, es. "2026-11-14". */
  published: string;
}

export const guideVideos: Record<string, GuideVideo> = {
  "agenzie-scommesse-fisiche-o-online": { seconds: 39, published: "2026-11-15" },
  "analizzare-una-partita-di-calcio": { seconds: 40, published: "2026-11-15" },
  "aprire-un-conto-di-gioco": { seconds: 42, published: "2026-11-15" },
  "autoesclusione-e-limiti-di-gioco": { seconds: 41, published: "2026-11-15" },
  "basket-over-under-handicap": { seconds: 40, published: "2026-11-15" },
  "bet-builder": { seconds: 38, published: "2026-11-15" },
  "bolletta-scommesse": { seconds: 42, published: "2026-11-15" },
  "bonus-requisiti-di-giocata": { seconds: 40, published: "2026-11-15" },
  "calcolare-vincita-multipla-sistema": { seconds: 41, published: "2026-11-15" },
  "calendario-coppe-turnover": { seconds: 38, published: "2026-11-15" },
  "cash-out": { seconds: 40, published: "2026-11-15" },
  "caso-e-probabilita": { seconds: 38, published: "2026-11-15" },
  "come-leggere-le-quote": { seconds: 48, published: "2026-11-14" },
  "controllare-una-bolletta": { seconds: 40, published: "2026-11-15" },
  "criterio-di-kelly": { seconds: 42, published: "2026-11-15" },
  "depositi-e-prelievi": { seconds: 34, published: "2026-11-15" },
  "emozioni-e-disciplina": { seconds: 39, published: "2026-11-15" },
  "expected-goals": { seconds: 40, published: "2026-11-15" },
  "gestione-del-budget": { seconds: 47, published: "2026-11-15" },
  "gioco-problematico-dove-chiedere-aiuto": { seconds: 40, published: "2026-11-15" },
  "glossario-scommesse": { seconds: 44, published: "2026-11-15" },
  "guida-completa-scommesse-sportive": { seconds: 55, published: "2026-11-14" },
  "handicap-asiatico": { seconds: 40, published: "2026-11-15" },
  "mercati-del-calcio": { seconds: 41, published: "2026-11-15" },
  "nba-stagione-play-in-playoff": { seconds: 41, published: "2026-11-15" },
  "prenotatore-scommesse": { seconds: 41, published: "2026-11-15" },
  "quanto-costa-un-bonus": { seconds: 47, published: "2026-11-15" },
  "quota-equa-e-valore-atteso": { seconds: 43, published: "2026-11-15" },
  "scommesse-in-diretta": { seconds: 37, published: "2026-11-15" },
  "scommesse-multiple": { seconds: 41, published: "2026-11-15" },
  "scommesse-sul-tennis": { seconds: 35, published: "2026-11-15" },
  "singola-multipla-sistema": { seconds: 40, published: "2026-11-15" },
  "siti-scommesse-legali": { seconds: 40, published: "2026-11-15" },
  "tornei-di-tennis": { seconds: 40, published: "2026-11-15" },
  "varianza-e-serie-negative": { seconds: 42, published: "2026-11-15" },
};

/** Indirizzi dei file di un video: nel bucket R2 se la build ha VITE_VIDEO_BASE, altrimenti in public/video (videos.ts). */
export const guideVideoFiles = (slug: string) => videoFiles(videoKeys.guide(slug));
