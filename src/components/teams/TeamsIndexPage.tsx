// /calcio/squadre and /basket/nba/squadre — every team with a page, grouped by league.
import { Shield } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { TeamBadge } from "../calcio/MatchRow";
import { footballTeamRefs, nbaTeamRefs, teamPaths, type TeamRef } from "../../lib/teams";
import { competitions } from "../../lib/football";

function Grid({ teams, base }: { teams: TeamRef[]; base: string }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {[...teams]
        .sort((a, b) => a.shortName.localeCompare(b.shortName, "it"))
        .map((t) => (
          <li key={t.id}>
            <Link
              to={`${base}/${t.slug}`}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-white hover:border-slate-600"
            >
              <TeamBadge team={{ tla: t.shortName.slice(0, 3).toUpperCase(), shortName: t.shortName, crest: t.crest ?? null }} />
              {t.shortName}
            </Link>
          </li>
        ))}
    </ul>
  );
}

export function TeamsIndexPage({ sport }: { sport: "football" | "nba" }) {
  if (sport === "nba") {
    return (
      <div className="min-h-screen bg-slate-950">
        <PageHeader
          title="Squadre NBA"
          icon={Shield}
          subtitle="Roster, record e statistiche dei giocatori stagione per stagione."
          breadcrumb={[{ label: "Basket", to: "/basket" }, { label: "NBA", to: "/pronostici/nba" }, { label: "Squadre" }]}
        />
        <div className="container mx-auto px-4 py-8">
          <Grid teams={nbaTeamRefs} base={teamPaths.nba} />
        </div>
      </div>
    );
  }
  const leagues = competitions
    .map((c) => ({ c, teams: footballTeamRefs.filter((t) => t.competition === c.slug) }))
    .filter((x) => x.teams.length);
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Squadre di calcio"
        icon={Shield}
        subtitle="Società, rosa e statistiche stagione per stagione dei club dei principali campionati."
        breadcrumb={[{ label: "Calcio", to: "/calcio" }, { label: "Squadre" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {leagues.map(({ c, teams }) => (
          <section key={c.slug} aria-labelledby={`lega-${c.slug}`}>
            <h2 id={`lega-${c.slug}`} className="text-white text-xl mb-3">
              {c.name}
            </h2>
            <Grid teams={teams} base={teamPaths.football} />
          </section>
        ))}
      </div>
    </div>
  );
}
