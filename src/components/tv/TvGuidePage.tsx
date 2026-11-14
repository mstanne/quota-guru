// /calcio-in-tv-oggi – the football matches of today and tomorrow with their channels in Italy (src/lib/tvGuide.ts),
// the model's most likely outcome and a filter by channel.
import { useState } from "react";
import { BadgeCheck, Tv } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader, MetaItems } from "../layout/PageHeader";
import { usePageMeta } from "../../lib/pageMeta";
import { formatTime, formatUpdated, generatedAt, isFinished, matchHref } from "../../lib/football";
import { predictionFor } from "../../lib/predictions";
import { pct, topOutcome } from "../../lib/predictionsCore";
import { BROADCAST_SEASON, COMPETITION_RIGHTS } from "../../lib/broadcast";
import { channelCounts, channelTokens, tvDay, tvGuideMeta, type TvRow } from "../../lib/tvGuide";
import { dayPath } from "../../lib/dayPages";
import { paths } from "../../routes";
import { TelegramBanner } from "../TelegramBanner";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`);

function Row({ r }: { r: TvRow }) {
  const { competition: c, match: m, broadcast: b } = r;
  const p = predictionFor(m.id);
  const t = p ? topOutcome(p) : null;
  const done = isFinished(m);
  return (
    <li className="flex items-start gap-3 sm:gap-4 px-4 py-3">
      <time dateTime={m.utcDate} className="w-12 shrink-0 text-white tabular-nums pt-0.5">
        {formatTime(m.utcDate)}
      </time>
      <div className="flex-1 min-w-0">
        <Link to={matchHref(c, m)} className="text-white hover:underline">
          {m.homeTeam.shortName} – {m.awayTeam.shortName}
        </Link>
        {done && m.score.fullTime.home != null && (
          <span className="ml-2 text-slate-400 tabular-nums">
            {m.score.fullTime.home}-{m.score.fullTime.away}
          </span>
        )}
        <p className="text-slate-400 text-xs mt-0.5">
          {c.name}
          {p && t != null && !done && (
            <>
              {" "}
              · pronostico {["1", "X", "2"][t]} al {pct(p.p[t])}
            </>
          )}
        </p>
        {b?.note && <p className="text-slate-400 text-xs mt-1">{b.note}</p>}
      </div>
      <div className="shrink-0 text-right max-w-[45%]">
        <p className="text-white text-sm">{b?.channels}</p>
        {b?.verifiedAt && (
          <p className="inline-flex items-center gap-1 text-best text-xs mt-0.5">
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
            palinsesto controllato
          </p>
        )}
      </div>
    </li>
  );
}

function Day({ d, channel }: { d: "oggi" | "domani"; channel: string | null }) {
  const day = tvDay(d);
  const rows = channel ? day.onTv.filter((r) => channelTokens(r.broadcast).includes(channel)) : day.onTv;
  const others = new Map<string, number>();
  for (const r of day.elsewhere) others.set(r.competition.name, (others.get(r.competition.name) ?? 0) + 1);
  return (
    <section aria-labelledby={`tv-${d}`} className="mb-10">
      <h2 id={`tv-${d}`} className="text-white text-2xl mb-3">
        {cap(d)}, {day.label}
      </h2>
      {rows.length ? (
        <ul className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">
          {rows.map((r) => (
            <Row key={r.match.id} r={r} />
          ))}
        </ul>
      ) : (
        <p className="text-slate-400">
          {channel ? `Nessuna partita su ${channel} ${d}.` : `Nessuna partita con diritti TV noti ${d}.`}
        </p>
      )}
      {!channel && others.size > 0 && (
        <p className="text-slate-400 text-sm mt-3">
          Si giocano anche {list([...others].map(([n, k]) => `${k} ${k === 1 ? "partita" : "partite"} di ${n}`))}, per
          cui non abbiamo un accordo sui diritti TV {BROADCAST_SEASON} verificato: le trovi nei{" "}
          <Link to={dayPath(d)} className="text-action-text hover:text-action-text-hover">
            pronostici di {d}
          </Link>
          .
        </p>
      )}
    </section>
  );
}

export function TvGuidePage() {
  usePageMeta(tvGuideMeta());
  const [channel, setChannel] = useState<string | null>(null);
  const today = tvDay("oggi");
  const tomorrow = tvDay("domani");
  const counts = channelCounts([...today.onTv, ...tomorrow.onTv]);
  const todayCounts = channelCounts(today.onTv);
  const checked = [...today.onTv, ...tomorrow.onTv].some((r) => r.broadcast?.verifiedAt);
  const big = today.open
    .map((r) => ({ r, p: predictionFor(r.match.id) }))
    .filter((x) => x.p)
    .sort((a, b) => b.p!.xg[0] + b.p!.xg[1] - (a.p!.xg[0] + a.p!.xg[1]))[0];

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={Tv}
        title="Calcio in TV oggi"
        subtitle={`${cap(today.label)}: dove vedere in TV e in streaming le partite di oggi e di domani, con i pronostici del modello.`}
        breadcrumb={[{ label: "Calcio", to: paths.calcio }, { label: "In TV oggi" }]}
        meta={
          <MetaItems
            items={[`${today.onTv.length} partite in TV oggi`, `Aggiornato al ${formatUpdated(generatedAt)}`]}
          />
        }
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <p className="mb-6 text-slate-300 text-sm sm:text-base leading-relaxed">
            {today.onTv.length
              ? `Oggi, ${today.label}, ci sono ${today.onTv.length} partite di calcio visibili in Italia: ${list(todayCounts.map(([c, n]) => `${n} su ${c}`))}.`
              : `Oggi, ${today.label}, non ci sono partite delle competizioni che seguiamo con diritti TV noti in Italia.`}
            {big &&
              ` La partita con più gol attesi secondo il modello è ${big.r.match.homeTeam.shortName} – ${big.r.match.awayTeam.shortName} (${big.r.competition.name}, ore ${formatTime(big.r.match.utcDate)}, ${big.r.broadcast!.channels}).`}{" "}
            {checked
              ? "I canali con il segno di spunta vengono dal palinsesto delle emittenti, controllato ogni mattina; gli altri dagli accordi sui diritti TV della stagione."
              : "I canali vengono dagli accordi sui diritti TV della stagione: il palinsesto definitivo è quello delle emittenti."}
          </p>

          {counts.length > 1 && (
            <div role="group" aria-label="Filtra per canale" className="flex flex-wrap gap-2 mb-6">
              {[null, ...counts.map(([c]) => c)].map((c) => (
                <button
                  key={c ?? "tutti"}
                  type="button"
                  aria-pressed={channel === c}
                  onClick={() => setChannel(c)}
                  className={`px-3 py-1.5 rounded-md border text-sm ${channel === c ? "bg-white text-slate-900 border-white" : "bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500"}`}
                >
                  {c ?? "Tutti i canali"}
                </button>
              ))}
            </div>
          )}

          <Day d="oggi" channel={channel} />
          <Day d="domani" channel={channel} />

          <TelegramBanner topic="tv" className="mb-10" />

          <section aria-labelledby="diritti" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 id="diritti" className="text-white text-xl mb-3">
              Chi trasmette il calcio in Italia nella stagione {BROADCAST_SEASON}
            </h2>
            <ul className="space-y-2 text-slate-300 text-sm">
              {COMPETITION_RIGHTS.map((r) => (
                <li key={r.slug}>
                  <strong className="font-medium text-white">{r.name}</strong>: {r.text}.
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs mt-4">
              Le partite NBA in TV sono indicate nella pagina di ogni partita, nei{" "}
              <Link to="/pronostici/nba" className="text-action-text hover:text-action-text-hover">
                pronostici NBA
              </Link>
              . Le probabilità sono stime statistiche, non consigli di gioco.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
