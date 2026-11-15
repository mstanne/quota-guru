/**
 * VIDEO DEI PRONOSTICI DELLE PARTITE
 * src/data/match-videos.json è l'indice del ramo `video-partite` (scripts/guide-videos/match_videos.py), copiato dal
 * deploy insieme ai file in public/video/partite. Nel repository resta vuoto: i video cambiano ogni giorno.
 */
import index from "./match-videos.json";
import type { VideoFiles } from "../components/media/SummaryVideo";

interface MatchVideoEntry {
  id: number;
  label: string;
  kickoff: string;
  generated: string;
  seconds: number;
  files: VideoFiles;
}

const videos = (index as { videos: Record<string, MatchVideoEntry> }).videos;

/** Il video di una partita, con i percorsi dei file relativi alla radice del sito; null se non c'è. */
export function matchVideo(id: number): (MatchVideoEntry & { files: VideoFiles }) | null {
  const v = videos[String(id)];
  if (!v) return null;
  const at = (f: string) => `/video/${f}`;
  return {
    ...v,
    files: {
      landscape: at(v.files.landscape),
      portrait: at(v.files.portrait),
      poster: at(v.files.poster),
      posterPortrait: at(v.files.posterPortrait),
    },
  };
}
