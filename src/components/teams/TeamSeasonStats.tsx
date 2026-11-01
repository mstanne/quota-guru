// Season statistics of a club in its league: form, goals by minute, clean sheets, penalties, formations
// (API-Football /teams/statistics) and corners, cards, expected goals per match (from the archive).
import { Activity } from "lucide-react";
import { Link } from "../../lib/links";
import { cornersCardsPath } from "../../lib/footballCore";
import type { FootballTeam } from "../../lib/teams";
import { Card, Facts, SectionTitle, num } from "./TeamUi";

const FORM = { W: ["V", "bg-best text-best-foreground", "Vittoria"], D: ["N", "bg-slate-500 text-white", "Pareggio"], L: ["P", "bg-live text-white", "Sconfitta"] } as const;
const SLOTS = ["0-15", "16-30", "31-45", "46-60", "61-75", "76-90", "91-105"];
const SLOT_LABEL: Record<string, string> = { "91-105": "Recupero" };

export function TeamSeasonStats({ team }: { team: FootballTeam }) {
  const st = team.stats;
  const ms = team.matchStats;
  if (!st && !ms) return null;
  const facts: [string, string][] = [];
  if (st) {
    const p = st.played.total;
    facts.push(
      ["Porta inviolata", `${st.cleanSheets.total} partite su ${p} (casa ${st.cleanSheets.home}, trasferta ${st.cleanSheets.away})`],
      ["Senza segnare", `${st.failedToScore.total} partite su ${p}`],
      ["Rigori", `${st.penalty.scored} segnati, ${st.penalty.missed} sbagliati`],
    );
    if (st.streak.wins > 1) facts.push(["Serie di vittorie più lunga", `${st.streak.wins} partite`]);
    if (st.formations.length) facts.push(["Moduli più usati", st.formations.map((f) => `${f.formation} (${f.played})`).join(", ")]);
  }
  if (ms?.n) {
    facts.push(
      ["Corner a partita", `${num(ms.cf / ms.n)} fatti, ${num(ms.ca / ms.n)} subiti`],
      ["Cartellini a partita", `${num((ms.yf + ms.rf) / ms.n)} ricevuti, ${num((ms.ya + ms.ra) / ms.n)} agli avversari`],
    );
    if (ms.xn) facts.push(["Expected goals (xG) a partita", `${num(ms.xf / ms.xn, 2)} creati, ${num(ms.xa / ms.xn, 2)} concessi`]);
  }
  const maxGoals = st ? Math.max(1, ...SLOTS.map((k) => Math.max(st.goalsByMinute.for[k] ?? 0, st.goalsByMinute.against[k] ?? 0))) : 1;

  return (
    <Card id="statistiche-stagione">
      <SectionTitle id="statistiche-stagione-titolo" icon={Activity}>
        Statistiche della stagione in {team.competition.name}
      </SectionTitle>
      {st?.form && (
        <div className="mb-5">
          <p className="text-slate-400 text-sm mb-2">Ultime partite di campionato, dalla meno recente</p>
          <ol className="flex flex-wrap gap-1.5" aria-label="Forma recente">
            {[...st.form].map((ch, i) => {
              const f = FORM[ch as keyof typeof FORM];
              return f ? (
                <li key={i}>
                  <span title={f[2]} className={`w-7 h-7 rounded inline-flex items-center justify-center text-xs font-semibold ${f[1]}`}>
                    {f[0]}
                  </span>
                </li>
              ) : null;
            })}
          </ol>
        </div>
      )}
      <Facts rows={facts} />
      {st && SLOTS.some((k) => (st.goalsByMinute.for[k] ?? 0) + (st.goalsByMinute.against[k] ?? 0) > 0) && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left text-slate-300 mb-2">Gol per fascia di minuto</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal py-2 pr-2">Minuti</th>
                <th scope="col" className="text-left font-normal py-2 px-2">Fatti</th>
                <th scope="col" className="text-left font-normal py-2 px-2">Subiti</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((k) => {
                const f = st.goalsByMinute.for[k] ?? 0;
                const a = st.goalsByMinute.against[k] ?? 0;
                return (
                  <tr key={k} className="border-b border-slate-800 last:border-0">
                    <th scope="row" className="text-left font-normal py-2 pr-2 text-slate-300 whitespace-nowrap">
                      {SLOT_LABEL[k] ?? `${k.replace("-", "–")}'`}
                    </th>
                    {[f, a].map((v, i) => (
                      <td key={i} className="py-2 px-2 w-2/5">
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={`h-2 rounded ${i ? "bg-slate-500" : "bg-action"}`}
                            style={{ width: `${(v / maxGoals) * 100}%`, minWidth: v ? 4 : 0 }}
                          />
                          <span className="tabular-nums text-slate-200">{v}</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-slate-400 text-xs mt-4">
        Solo partite di {team.competition.name} (dati API-Football).
        {ms?.n ? (
          <>
            {" "}
            Confronto con le altre squadre:{" "}
            <Link to={cornersCardsPath(team.competition)} className="text-action-text hover:text-action-text-hover">
              statistiche corner e cartellini
            </Link>
            .
          </>
        ) : null}
      </p>
    </Card>
  );
}
