// QuotaGuru logo (horizontal lockup, files in src/assets/brand – source: quotaguru-brand/).
// The site is dark, so the default is the full-colour version for dark backgrounds.
import logoDark from "../../assets/brand/quotaguru-logo-dark-bg.svg";
import logoLight from "../../assets/brand/quotaguru-logo-light-bg.svg";
import logoWhite from "../../assets/brand/quotaguru-logo-white.svg";

const SRC = { dark: logoDark, light: logoLight, white: logoWhite } as const;
const RATIO = 548 / 199.1; // viewBox of the SVG lockup

interface BrandLogoProps {
  /** Logo height in px (width follows the original proportions). */
  height?: number;
  /** Background the logo sits on. */
  variant?: keyof typeof SRC;
  /** Empty when the logo is inside a link that already has an accessible name. */
  alt?: string;
  className?: string;
}

export function BrandLogo({ height = 36, variant = "dark", alt = "QuotaGuru", className }: BrandLogoProps) {
  const width = Math.round(height * RATIO);
  return (
    <img
      src={SRC[variant]}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ height, width: "auto" }}
      decoding="async"
    />
  );
}
