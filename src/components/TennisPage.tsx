import { Trophy } from "lucide-react";
import { Card } from "./ui/card";
import { PageHeader, MetaItems } from "./layout/PageHeader";
import { TennisOverview } from "./tennis/TennisOverview";
import { TennisPredictor } from "./tennis/TennisPrediction";
import { tourData } from "../lib/tennis";

// The tennis match list with operator odds will return when a fixtures/odds feed is connected
// (the BALLDONTLIE free plan has rankings and calendar only). Meanwhile the page offers the
// head-to-head predictor built on the ATP/WTA rankings.
export function TennisPage(_props: { onMatchClick?: (matchId: string) => void }) {
  const players = tourData("atp").rankings.length + tourData("wta").rankings.length;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Trophy}
        title="Tennis: classifiche, tornei e pronostici"
        subtitle="Classifiche ATP e WTA, calendario dei tornei e probabilità di vittoria per ogni sfida tra i top 100"
        breadcrumb={[{ label: "Tennis" }]}
        meta={<MetaItems items={["ATP e WTA", `${players} giocatori nel modello`]} />}
      />
      <div className="container mx-auto px-4 py-8">
        <TennisPredictor />
        <TennisOverview />
        <Card className="bg-slate-900 border-slate-800">
          <div className="p-6">
            <h2 className="text-white text-lg mb-2">Come leggere i pronostici del tennis</h2>
            <p className="text-slate-300 text-sm mb-3">
              Le probabilità partono dalla forza dei due giocatori e dal formato della partita: al meglio dei 5 set il
              favorito vince più spesso che al meglio dei 3, perché ha più tempo per recuperare un set storto.
            </p>
            <p className="text-slate-400 text-sm">
              Superficie, forma recente, infortuni e precedenti contano: usa le probabilità come punto di partenza,
              non come una previsione certa.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
