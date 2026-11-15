// Video riassuntivo (guide, pronostici): orizzontale (16:9) su schermi larghi, verticale (9:16) su smartphone.
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../operator/OperatorUi";

const MOBILE = "(max-width: 639px)";

export interface VideoFiles {
  landscape: string;
  portrait: string;
  poster: string;
  posterPortrait: string;
}

export function SummaryVideo({
  files,
  label,
  caption,
  onFirstPlay,
  className = "mb-8",
}: {
  files: VideoFiles;
  label: string;
  caption?: string;
  onFirstPlay?: (format: "9x16" | "16x9") => void;
  className?: string;
}) {
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
    <figure className={className}>
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
        aria-label={label}
        onPlay={() => {
          if (played.current) return;
          played.current = true;
          onFirstPlay?.(portrait ? "9x16" : "16x9");
        }}
      />
      {caption && <figcaption className="mt-2 text-sm text-slate-400">{caption}</figcaption>}
    </figure>
  );
}
