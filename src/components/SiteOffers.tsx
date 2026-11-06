// Welcome offers on every page, right under the page's main section (as on the home, where they follow the opening
// block): rendered by PageHeader and by the headers of the match pages. Not on the home (its own block), on the
// offers pages themselves, nor on the guides about problem gambling and self-exclusion, where an offer is out of place.
import { useLocation, useNavigate } from "react-router";
import { paths } from "../routes";
import { BonusSection } from "./BonusSection";

const NO_SITE_OFFERS = [
  paths.bonus,
  `${paths.guide}/gioco-problematico-dove-chiedere-aiuto`,
  `${paths.guide}/autoesclusione-e-limiti-di-gioco`,
];

export function SiteOffers() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || NO_SITE_OFFERS.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <BonusSection placement="site-offers" onViewAllClick={() => navigate(paths.bonus)} />;
}
