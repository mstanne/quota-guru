// Video riassuntivo di una guida: orizzontale (16:9) su schermi larghi, verticale (9:16) su smartphone.
import { useEffect, useRef, useState } from "react";
import { guideVideoFiles } from "../../data/guideVideos";
import { assetUrl } from "../operator/OperatorUi";
import { track } from "../../lib/analytics";

const MOBILE = "(max-width: 639px)";

export function GuideVideo({ slug, title }: { slug: string; title: string }) {
  const files = guideVideoFiles(slug);
  // Il prerender produce la versione orizzontale; sul telefono si passa alla verticale dopo il caricamento.
  const [portrait, setPortrait] = useState(false);
  const played = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <figure className="mb-8">
      <video
        key={portrait ? "v" : "h"}
        className={
          portrait
            ? "block mx-auto h-[70vh] max-h-[640px] w-auto max-w-full rounded-lg bg-slate-900"
            : "block w-full aspect-video rounded-lg bg-slate-900"
        }
        style={portrait ? { aspectRatio: "9 / 16" } : undefined}
        src={assetUrl(portrait ? files.portrait : files.landscape)}
        poster={assetUrl(portrait ? files.posterPortrait : files.poster)}
        controls
        playsInline
        preload="none"
        aria-label={`Video riassuntivo: ${title}`}
        onPlay={() => {
          if (played.current) return;
          played.current = true;
          track("guide_video_play", { guide: slug, format: portrait ? "9x16" : "16x9" });
        }}
      />
      <figcaption className="mt-2 text-sm text-slate-400">
        Il riassunto in video. Dettagli ed esempi sono nel testo qui sotto.
      </figcaption>
    </figure>
  );
}
