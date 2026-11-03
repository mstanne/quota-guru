// Name of a football player as written in the match data, linked to the player's page when there is one.
import { Link } from "../../lib/links";
import { footballPlayerHref } from "../../lib/playerLinks";

export function FootballPlayerLink({ id, name }: { id?: number | null; name: string }) {
  const href = footballPlayerHref(id);
  return href ? (
    <Link to={href} className="hover:text-action-text-hover underline-offset-2 hover:underline">
      {name}
    </Link>
  ) : (
    <>{name}</>
  );
}
