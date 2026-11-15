// Video riassuntivo di una guida.
import { guideVideoFiles } from "../../data/guideVideos";
import { track } from "../../lib/analytics";
import { SummaryVideo } from "../media/SummaryVideo";

export function GuideVideo({ slug, title }: { slug: string; title: string }) {
  return (
    <SummaryVideo
      files={guideVideoFiles(slug)}
      label={`Video riassuntivo: ${title}`}
      caption="Il riassunto in video. Dettagli ed esempi sono nel testo qui sotto."
      onFirstPlay={(format) => track("guide_video_play", { guide: slug, format })}
    />
  );
}
