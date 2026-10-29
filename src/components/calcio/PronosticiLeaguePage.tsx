// /pronostici/:competizione/:evento – the second segment is either a round ("giornata-12",
// "fase-campionato-giornata-3") or a fixture ("juventus-inter"), see src/lib/footballCore.ts.
import { useParams } from "react-router";
import { parseMatchdaySlug } from "../../lib/footballCore";
import { MatchdayPage } from "./MatchdayPage";
import { CalcioEventPage } from "./CalcioEventPage";

export function PronosticiLeagueChild() {
  const { evento = "" } = useParams();
  return parseMatchdaySlug(evento) ? <MatchdayPage slug={evento} /> : <CalcioEventPage slug={evento} />;
}
