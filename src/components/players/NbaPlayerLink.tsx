// Name of an NBA player, linked to the player's page when there is one.
import { Link } from "../../lib/links";
import { nbaPlayerPath } from "../../lib/nbaPlayers";

export function NbaPlayerLink({ player }: { player: { id?: number | null; name: string } }) {
  const href = nbaPlayerPath(player);
  return href ? (
    <Link to={href} className="hover:text-action-text-hover underline-offset-2 hover:underline">
      {player.name}
    </Link>
  ) : (
    <>{player.name}</>
  );
}
