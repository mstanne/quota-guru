// Official match highlights from YouTube. Nothing is loaded from Google until the reader clicks:
// then the player comes from youtube-nocookie.com (privacy-enhanced mode) and starts playing.
import { useState } from "react";
import { Play, Youtube } from "lucide-react";
import { Link } from "../../lib/links";
import { paths } from "../../routes";
import type { Highlight } from "../../lib/highlights";

const card = "rounded-xl border border-slate-800 bg-slate-900 p-5";

export function HighlightVideo({ highlight, channel }: { highlight: Highlight; channel: string }) {
  const [open, setOpen] = useState(false);
  const src = `https://www.youtube-nocookie.com/embed/${highlight.video}?autoplay=1&rel=0`;
  return (
    <section className={card} aria-labelledby="highlights">
      <h2 id="highlights" className="flex items-center gap-2 text-white text-xl mb-4">
        <Youtube className="w-5 h-5 text-slate-300" aria-hidden="true" />
        Highlights
      </h2>
      <div className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-slate-950" style={{ aspectRatio: "16 / 9" }}>
        {open ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={src}
            title={highlight.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center bg-gradient-to-br from-slate-800 to-slate-950 hover:from-slate-700 focus-visible:outline-2"
          >
            <span className="w-16 h-16 rounded-full bg-action flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" aria-hidden="true" />
            </span>
            <span className="text-white max-w-xl">{highlight.title}</span>
            <span className="text-slate-400 text-sm">Guarda la sintesi ufficiale</span>
          </button>
        )}
      </div>
      <p className="text-slate-400 text-xs mt-3">
        Video del canale YouTube ufficiale {channel}. Con il clic il video viene caricato da YouTube (Google), che può
        usare cookie: vedi la <Link to={paths.cookie}>cookie policy</Link>.{" "}
        <a
          href={`https://www.youtube.com/watch?v=${highlight.video}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-action-text hover:text-action-text-hover"
        >
          Apri su YouTube
        </a>
      </p>
    </section>
  );
}
