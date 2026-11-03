// Player page: trophies, transfers and injury/suspension history (API-Football, scripts/fetch-player-extras.mjs).
// A section appears once its data has been downloaded; an empty list then says so instead of hiding the section.
import { ArrowRightLeft, Cross, Trophy } from "lucide-react";
import { Link } from "../../lib/links";
import type { PlayerClub, PlayerHistory as History } from "../../lib/players";
import { teamPaths } from "../../lib/teams";
import { Card, SectionTitle, formatDate } from "../teams/TeamUi";

const th = "text-left font-normal py-2 px-2 whitespace-nowrap";

function Club({ club }: { club: PlayerClub | null }) {
  if (!club) return <span className="text-slate-400">–</span>;
  return club.slug ? (
    <Link to={`${teamPaths.football}/${club.slug}`} className="text-slate-200 hover:text-white">
      {club.name}
    </Link>
  ) : (
    <span className="text-slate-200">{club.name}</span>
  );
}

export function PlayerHistory({ history: h }: { history: History | null | undefined }) {
  if (!h) return null;
  return (
    <>
      {h.complete.transfers && <Transfers h={h} />}
      {h.complete.trophies && <Trophies h={h} />}
      {h.complete.sidelined && <Sidelined h={h} />}
    </>
  );
}

function Trophies({ h }: { h: History }) {
  const titles = h.trophies.reduce((t, x) => t + x.won.length, 0);
  return (
    <Card id="palmares">
      <SectionTitle id="palmares-titolo" icon={Trophy}>
        Palmarès
      </SectionTitle>
      {h.trophies.length === 0 ? (
        <p className="text-slate-400 text-sm">Nessun titolo o piazzamento registrato.</p>
      ) : (
        <>
          <p className="text-slate-300 text-sm mb-3">
            {titles === 1 ? "1 titolo vinto" : `${titles} titoli vinti`} con club e nazionali.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="text-left font-normal py-2 pr-2">Competizione</th>
                  <th scope="col" className="text-right font-normal py-2 px-2">Titoli</th>
                  <th scope="col" className={th}>Stagioni vinte</th>
                  <th scope="col" className={th}>Altri piazzamenti</th>
                </tr>
              </thead>
              <tbody>
                {h.trophies.map((t) => (
                  <tr key={`${t.competition}-${t.country}`} className="border-b border-slate-800 last:border-0 align-top">
                    <th scope="row" className="text-left font-normal py-2 pr-2 text-white">
                      {t.competition}
                      {t.country && <span className="block text-slate-400 text-xs">{t.country}</span>}
                    </th>
                    <td className="text-right px-2 py-2 tabular-nums text-white font-semibold">{t.won.length}</td>
                    <td className="px-2 py-2 text-slate-300">{t.won.join(", ") || "–"}</td>
                    <td className="px-2 py-2 text-slate-400">
                      {t.other.length ? t.other.map((o) => `${o.place ?? ""} ${o.season}`.trim()).join(", ") : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-slate-400 text-xs mt-3">Dati API-Football.</p>
    </Card>
  );
}

function Transfers({ h }: { h: History }) {
  return (
    <Card id="trasferimenti">
      <SectionTitle id="trasferimenti-titolo" icon={ArrowRightLeft}>
        Trasferimenti
      </SectionTitle>
      {h.transfers.length === 0 ? (
        <p className="text-slate-400 text-sm">Nessun trasferimento registrato.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal py-2 pr-2">Data</th>
                <th scope="col" className={th}>Da</th>
                <th scope="col" className={th}>A</th>
                <th scope="col" className={th}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {h.transfers.map((t) => (
                <tr key={`${t.date}-${t.to?.name}`} className="border-b border-slate-800 last:border-0">
                  <td className="py-2 pr-2 text-slate-300 whitespace-nowrap tabular-nums">{formatDate(t.date)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <Club club={t.from} />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <Club club={t.to} />
                  </td>
                  <td className="px-2 py-2 text-slate-300 whitespace-nowrap">{t.type ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-slate-400 text-xs mt-3">Le cifre sono quelle riportate dalla fonte, quando disponibili. Dati API-Football.</p>
    </Card>
  );
}

function Sidelined({ h }: { h: History }) {
  return (
    <Card id="infortuni">
      <SectionTitle id="infortuni-titolo" icon={Cross}>
        Infortuni e squalifiche
      </SectionTitle>
      {h.sidelined.length === 0 ? (
        <p className="text-slate-400 text-sm">Nessun infortunio o squalifica registrato.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal py-2 pr-2">Motivo</th>
                <th scope="col" className={th}>Dal</th>
                <th scope="col" className={th}>Al</th>
                <th scope="col" className="text-right font-normal py-2 px-2">Giorni</th>
              </tr>
            </thead>
            <tbody>
              {h.sidelined.map((s) => (
                <tr key={`${s.start}-${s.type}`} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className="text-left font-normal py-2 pr-2 text-white">{s.type}</th>
                  <td className="px-2 py-2 text-slate-300 whitespace-nowrap tabular-nums">{formatDate(s.start)}</td>
                  <td className="px-2 py-2 text-slate-300 whitespace-nowrap tabular-nums">{s.end ? formatDate(s.end) : s.ongoing ? "in corso" : "–"}</td>
                  <td className="text-right px-2 py-2 tabular-nums text-slate-300">{s.days ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-slate-400 text-xs mt-3">I periodi più recenti, come registrati dalla fonte. Dati API-Football.</p>
    </Card>
  );
}
