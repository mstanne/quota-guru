import { ImageIcon } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { cn } from "../ui/utils";

/**
 * Editorial image slot. With `src` it renders the image; without it, a neutral block that fills
 * exactly the same box (size comes from `className`), labelled with `placeholder`
 * (e.g. "[PLACEHOLDER_IMMAGINE_GUIDA_1200x675]") so the layout stays identical when the image is added.
 */
export function ImageSlot({
  src,
  alt,
  className,
  placeholder,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholder: string;
}) {
  if (src) return <ImageWithFallback src={src} alt={alt} className={className} />;
  return (
    <div
      role="img"
      aria-label={alt}
      title={placeholder}
      data-placeholder={placeholder}
      className={cn(
        "flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400",
        className,
      )}
    >
      <ImageIcon className="w-10 h-10" aria-hidden="true" />
      <span className="text-xs font-mono">{placeholder}</span>
    </div>
  );
}
