// Reusable, data-driven operator UI: logo slot and outbound CTA.
import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { isPlaceholder, type OperatorData } from "../../data/operators";
import { currentPage, track } from "../../lib/analytics";

/**
 * Logo paths in operators.ts are relative to public/ ("operators/eurobet.svg"). The site can be served under a
 * base path (GitHub Pages: "/quota-guru/"), so the base is prepended here; absolute URLs and data URIs are kept.
 */
export function assetUrl(path: string) {
  if (/^(https?:|data:|\/)/.test(path)) return path;
  return `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}${path}`;
}

interface OperatorLogoProps {
  operator: Pick<OperatorData, "logoUrl" | "logoAlt" | "name">;
  /** Slot size in px – must match the original layout (e.g. 48 × 48). */
  width: number;
  height: number;
  className?: string;
}

/**
 * Operator logo. When `logoUrl` is not set, renders a neutral box of exactly `width × height`
 * labelled [PLACEHOLDER_LOGO_WxH], so replacing it with a real image never shifts the layout.
 */
export function OperatorLogo({ operator, width, height, className }: OperatorLogoProps) {
  const token = `[PLACEHOLDER_LOGO_${width}x${height}]`;
  if (operator.logoUrl) {
    return (
      <img
        src={assetUrl(operator.logoUrl)}
        alt={operator.logoAlt}
        width={width}
        height={height}
        loading="lazy"
        className={cn("shrink-0 object-contain", className)}
        style={{ width, height }}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={operator.logoAlt}
      title={token}
      data-placeholder={token}
      className={cn(
        "shrink-0 rounded-md border border-dashed border-slate-600 bg-slate-800/60 flex items-center justify-center overflow-hidden text-slate-400 leading-none text-center select-none",
        className,
      )}
      style={{ width, height }}
    >
      {width >= 40 && (
        <span className="text-[9px] px-0.5">
          LOGO
          <br />
          {width}×{height}
        </span>
      )}
    </div>
  );
}

interface OperatorCtaProps {
  operator: Pick<OperatorData, "name" | "affiliateUrl"> & { id?: string };
  /** Where the button is (for click statistics), e.g. "bonus-card", "comparison-table", "bet-slip". */
  placement?: string;
  /** Neutral, informational label (no invitation to gamble). */
  label?: string;
  /** Override the destination (e.g. offer terms page). Defaults to the operator's affiliate URL. */
  href?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary" | "link" | "destructive";
  icon?: ReactNode;
  iconPosition?: "start" | "end";
}

/**
 * Outbound link to an operator, styled as the original button.
 * Links are marked rel="sponsored nofollow" and open in a new tab. While the URL is still a placeholder
 * ([URL_AFFILIAZIONE_OPERATORE]) the link is inert, so the mock-up never navigates to a broken page.
 */
export function OperatorCta({
  operator,
  label = "Vai al sito",
  href,
  className,
  size,
  variant,
  icon,
  iconPosition = "start",
  placement = "unknown",
}: OperatorCtaProps) {
  const url = href ?? operator.affiliateUrl;
  const pending = isPlaceholder(url);
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <a
        href={pending ? undefined : url}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        aria-label={`${label}: ${operator.name} (si apre in una nuova scheda)`}
        aria-disabled={pending || undefined}
        title={pending ? url : undefined}
        data-placeholder={pending ? url : undefined}
        role={pending ? "link" : undefined}
        tabIndex={0}
        onClick={(e) => {
          if (pending) e.preventDefault();
          // T2: count outbound clicks per operator and position (only with consent, see lib/analytics.ts)
          track("outbound_click", { operator: operator.id ?? operator.name, placement, page: currentPage() });
        }}
      >
        {iconPosition === "start" && icon}
        {label}
        {iconPosition === "end" && icon}
      </a>
    </Button>
  );
}

/** Legal line under offers/CTAs. With `operator`/`offer`, clicks on "termini" are counted (offer_terms_click). */
export function OfferDisclaimer({
  className,
  termsUrl,
  operator,
  offer,
  placement,
}: {
  className?: string;
  termsUrl?: string;
  operator?: string;
  offer?: string;
  placement?: string;
}) {
  return (
    <p className={cn("text-slate-400 text-xs", className)}>
      18+ · Si applicano i termini dell'operatore
      {termsUrl && (
        <>
          {" · "}
          <a
            href={isPlaceholder(termsUrl) ? undefined : termsUrl}
            title={isPlaceholder(termsUrl) ? termsUrl : undefined}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="underline underline-offset-2 hover:text-slate-300"
            data-track={operator ? "offer_terms_click" : undefined}
            data-track-operator={operator}
            data-track-offer={offer}
            data-track-placement={placement}
          >
            termini
          </a>
        </>
      )}
    </p>
  );
}
