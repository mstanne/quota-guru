/**
 * VIDEO DEI PRONOSTICI DELLE PARTITE
 * I video sono nel bucket R2 (`analisi/calcio/<AAAA-MM-GG>/<partita>`, docs/video.md), generati da
 * .github/workflows/video-partite.yml (scripts/guide-videos/match_videos.py). Il loro indice sta nel ramo
 * `video-partite` e la build lo copia in src/data/match-videos.json: nel repository resta vuoto.
 */
import index from "./match-videos.json";
import { VIDEO_BASE } from "./videos";
import type { VideoFiles } from "../components/media/SummaryVideo";

/** Questi video esistono solo nel bucket: senza VIDEO_BASE si usa il suo indirizzo pubblico. */
const BASE = VIDEO_BASE || "https://video.quotaguru.it";

interface MatchVideoEntry {
  id: number;
  label: string;
  kickoff: string;
  generated: string;
  seconds: number;
  /** nome dei file nel bucket, senza formato ed estensione (videoKeys.analisi) */
  key: string;
}

const videos = (index as { videos: Record<string, MatchVideoEntry> }).videos;

/** Il video di una partita con gli indirizzi dei suoi file; null se non c'è. */
export function matchVideo(id: number): (MatchVideoEntry & { files: VideoFiles }) | null {
  const v = videos[String(id)];
  if (!v?.key) return null;
  const at = (suffix: string) => `${BASE}/${v.key}-${suffix}`;
  return {
    ...v,
    files: { landscape: at("16x9.mp4"), portrait: at("9x16.mp4"), poster: at("16x9.jpg"), posterPortrait: at("9x16.jpg") },
  };
}
