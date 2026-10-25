// A team name that links to the team's page when it has one.
import { Link } from "../../lib/links";
import { footballTeamPath, nbaTeamPath } from "../../lib/teams";

export function TeamName({
  id,
  name,
  sport = "football",
  className = "text-white",
}: {
  id: number;
  name: string;
  sport?: "football" | "nba";
  className?: string;
}) {
  const to = sport === "nba" ? nbaTeamPath(id) : footballTeamPath(id);
  if (!to) return <span className={className}>{name}</span>;
  return (
    <Link to={to} className={`${className} hover:underline underline-offset-4`}>
      {name}
    </Link>
  );
}
