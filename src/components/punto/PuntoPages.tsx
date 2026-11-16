// "Il punto del modello" (src/lib/punto.ts): /il-punto (list of the weekly editions) and /il-punto/<date> (one edition,
// frozen on its Monday, with the changes since the edition before).
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { ArrowDown, ArrowUp, CalendarCheck, Minus } from "lucide-react";
import { Link } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { NotFoundPage } from "../NotFoundPage";
import { TeamName } from "../teams/TeamLink";
import { usePageMeta } from "../../lib/pageMeta";
import { paths } from "../../routes";
import { site } from "../../data/site";
import {
  PUNTO_BASE,
  deltaText,
  leadSentence,
  longDate,
  puntoEdition,
  puntoEditions,
  puntoHubMeta,
  puntoMeta,
  puntoPath,
  type PuntoEdition,
  type PuntoLeague,
} from "../../lib/punto";

const pct = (p: number) => {
  const v = Math.round(p * 100);
  return p > 0 && v < 1 ? "<1%" : `${v}%`;
};
const th = "text-right font-normal px-2 py-3 whitespace-nowrap";
const td = "text-right px-2 tabular-nums";

/** A chance with its change since the previous edition (percentage points). */
function Chance({ p, d, bad = false }: { p: number; d?: number; bad?: boolean }) {
  const v = d == null ? 0 : Math.round(d * 100);
  const good = bad ? v < 0 : v > 0;
  return (
    <span className="inline-flex items-baseline gap-1.5 justify-end">
      <span className="text-white">{pct(p)}</span>
      {d != null && v !== 0 && (
        <span className={`text-xs ${good ? "text-predict" : "text-rose-300"}`}>
          {v > 0 ? "+" : "−"}
          {Math.abs(v)}
        </span>
      )}
    </span>
  );
}

function Move({ move }: { move: number | null }) {
  if (move == null) return <span className="text-xs text-slate-400">nuova</span>;
  if (move === 0) return <Minus className="inline w-3.5 h-3.5 text-slate-500" aria-label="stessa posizione" />;
  return move > 0 ? (
    <span className="inline-flex items-center text-xs text-predict">
      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
      {move}
    </span>
  ) : (
    <span className="inline-flex items-center text-xs text-rose-300">
      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
      {-move}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-white text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function LeagueTable({ l }: { l: PuntoLeague }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <caption className="sr-only">{l.name}: probabilità di fine stagione secondo il modello</caption>
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th scope="col" className="text-left font-normal px-4 py-3">Squadra</th>
            <th scope="col" className={th} title="Punti in classifica oggi">Punti</th>
            <th scope="col" className={th} title="Punti attesi a fine stagione">Punti attesi</th>
            <th scope="col" className={th}>Vince {l.titleWord}</th>
            <th scope="col" className={th}>Prime {l.top}</th>
            <th scope="col" className={`${th} pr-4`}>Ultime {l.bottom}</th>
          </tr>
        </thead>
        <tbody>
          {l.teams.map((t) => (
            <tr key={t.id} className="border-b border-slate-800 last:border-0">
              <th scope="row" className="text-left font-normal px-4 py-2.5">
                <TeamName id={t.id} name={t.name} />
              </th>
              <td className={`${td} text-slate-300`}>{t.pts}</td>
              <td className={`${td} text-slate-300`}>{t.xpts.toFixed(1).replace(".", ",")}</td>
              <td className={td}>
                <Chance p={t.title} d={t.d?.title} />
              </td>
              <td className={td}>
                <Chance p={t.top} d={t.d?.top} />
              </td>
              <td className={`${td} pr-4`}>
                <Chance p={t.rel} d={t.d?.rel} bad />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The biggest changes of Serie A since the previous edition, in words. */
function movers(l: PuntoLeague) {
  const out: { team: string; text: string; size: number }[] = [];
  for (const t of l.teams) {
    const d = t.d;
    if (!d) continue;
    const items: [number | undefined, number, string][] = [
      [d.title, t.title, "scudetto"],
      [d.top, t.top, `prime ${l.top}`],
      [d.rel, t.rel, "rischio retrocessione"],
    ];
    for (const [v, now, what] of items) {
      if (v == null || Math.abs(v) < 0.05) continue;
      out.push({ team: t.name, text: `${what} ${deltaText(v)}, ora ${pct(now)}`, size: Math.abs(v) });
    }
  }
  return out.sort((a, b) => b.size - a.size).slice(0, 6);
}

function Edition({ e }: { e: PuntoEdition }) {
  const summary = puntoEditions.find((x) => x.date === e.date)!;
  const sa = e.leagues["serie-a"];
  const others = ["premier-league", "liga", "bundesliga", "ligue-1"].map((k) => e.leagues[k]).filter(Boolean);
  const moves = sa && e.prev ? movers(sa) : [];
  const url = `https://www.quotaguru.it${puntoPath(e.date)}/`;
  const idx = puntoEditions.findIndex((x) => x.date === e.date);
  const newer = puntoEditions[idx - 1];
  const older = puntoEditions[idx + 1];
  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      <p className="max-w-3xl rounded-xl border border-predict/30 bg-predict/10 p-4 text-white text-lg leading-relaxed">
        {leadSentence(summary)}
      </p>
      <p className="max-w-3xl text-slate-300">
        Ogni lunedì fotografiamo le simulazioni del nostro modello (10.000 stagioni per campionato, con le stesse
        probabilità dei pronostici) e le confrontiamo con la settimana prima. Questa edizione è del{" "}
        {longDate(e.date)} e non cambia più{e.prev ? `; i numeri piccoli accanto alle percentuali sono la variazione in punti rispetto al ${longDate(e.prev)}` : ""}.
        Le proiezioni aggiornate ogni giorno sono nelle{" "}
        <Link to="/calcio/serie-a/classifica" className="text-action-text hover:text-action-text-hover">
          classifiche
        </Link>
        .
      </p>

      {sa && (
        <Section id="serie-a" title={`Serie A dopo ${sa.played} giornate: scudetto, Champions e salvezza`}>
          <LeagueTable l={sa} />
          {moves.length > 0 && (
            <div className="max-w-3xl">
              <h3 className="text-white text-lg mb-2">Chi sale e chi scende rispetto a lunedì scorso</h3>
              <ul className="list-disc pl-6 text-slate-300 space-y-1">
                {moves.map((m) => (
                  <li key={`${m.team}-${m.text}`}>
                    <strong className="text-white">{m.team}</strong>: {m.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {others.length > 0 && (
        <Section id="campionati-esteri" title="Premier League, Liga, Bundesliga e Ligue 1: chi vince il titolo">
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((l) => (
              <div key={l.name} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="text-white mb-2">
                  {l.name} <span className="text-slate-400 text-sm">dopo {l.played} giornate</span>
                </h3>
                <ul className="space-y-1 text-sm">
                  {[...l.teams]
                    .sort((a, b) => b.title - a.title)
                    .slice(0, 4)
                    .map((t) => (
                      <li key={t.id} className="flex justify-between gap-2">
                        <TeamName id={t.id} name={t.name} />
                        <Chance p={t.title} d={t.d?.title} />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(e.cups).length > 0 && (
        <Section id="coppe" title="Coppe europee: chi vince secondo il modello">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(e.cups).map(([slug, c]) => (
              <div key={slug} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="text-white mb-2">{c.name}</h3>
                <ul className="space-y-1 text-sm">
                  {c.teams.slice(0, 6).map((t) => (
                    <li key={t.id} className="flex justify-between gap-2">
                      <TeamName id={t.id} name={t.name} />
                      <Chance p={t.win} d={t.d?.win} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {e.nba.length > 0 && (
        <Section id="nba" title="NBA: chi vince il titolo">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <caption className="sr-only">NBA: probabilità di titolo e playoff secondo il modello</caption>
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="text-left font-normal px-4 py-3">Squadra</th>
                  <th scope="col" className={th}>Record</th>
                  <th scope="col" className={th}>Vittorie attese</th>
                  <th scope="col" className={th}>Playoff</th>
                  <th scope="col" className={`${th} pr-4`}>Titolo</th>
                </tr>
              </thead>
              <tbody>
                {e.nba.slice(0, 8).map((t) => (
                  <tr key={t.id} className="border-b border-slate-800 last:border-0">
                    <th scope="row" className="text-left font-normal px-4 py-2.5">
                      <TeamName id={t.id} name={t.name} sport="nba" />
                    </th>
                    <td className={`${td} text-slate-300`}>
                      {t.w}-{t.l}
                    </td>
                    <td className={`${td} text-slate-300`}>{t.xw.toFixed(1).replace(".", ",")}</td>
                    <td className={td}>
                      <Chance p={t.playoffs} d={t.d?.playoffs} />
                    </td>
                    <td className={`${td} pr-4`}>
                      <Chance p={t.title} d={t.d?.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {e.ranking.length > 0 && (
        <Section id="ranking" title="Ranking di forza: le 20 squadre più forti secondo il modello">
          <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2 text-sm max-w-4xl">
            {e.ranking.slice(0, 20).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-800 py-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-6 text-slate-400 tabular-nums">{t.rank}</span>
                  <TeamName id={t.id} name={t.name} />
                  <span className="text-slate-500 text-xs">{t.leagueName}</span>
                </span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-slate-300">
                    {t.gd > 0 ? "+" : ""}
                    {t.gd.toFixed(2).replace(".", ",")}
                  </span>
                  {e.prev && <Move move={t.move} />}
                </span>
              </li>
            ))}
          </ol>
          <p className="text-slate-400 text-xs max-w-3xl">
            Differenza reti attesa a partita contro una squadra di riferimento, in campo neutro. Ranking completo e
            aggiornato: <Link to="/calcio/ranking-squadre" className="text-action-text hover:text-action-text-hover">ranking delle squadre</Link>.
          </p>
        </Section>
      )}

      <Section id="citare" title="Come citare questi numeri">
        <div className="max-w-3xl space-y-2 text-slate-300">
          <p className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm">
            Fonte: QuotaGuru, modello statistico, dati al {longDate(e.date)} – <a href={url} className="text-action-text break-all">{url}</a>
          </p>
          <p className="text-sm">
            I numeri di questa pagina si possono riprendere citando QuotaGuru con il link all'edizione. Per articoli,
            approfondimenti o dati su altre squadre scrivi a{" "}
            <a href={`mailto:${site.email}`} className="text-action-text hover:text-action-text-hover">
              {site.email}
            </a>
            . Sono stime statistiche, non certezze: il modello non conosce infortuni, mercato e motivazioni.{" "}
            <Link to={`${paths.metodologia}#pronostici`} className="text-action-text hover:text-action-text-hover">
              Come funziona il modello
            </Link>
          </p>
        </div>
      </Section>

      <nav aria-label="Altre edizioni" className="flex flex-wrap gap-4 text-sm">
        {older && (
          <Link to={puntoPath(older.date)} className="text-action-text hover:text-action-text-hover">
            ← Edizione del {longDate(older.date)}
          </Link>
        )}
        {newer && (
          <Link to={puntoPath(newer.date)} className="text-action-text hover:text-action-text-hover">
            Edizione del {longDate(newer.date)} →
          </Link>
        )}
        <Link to={PUNTO_BASE} className="text-action-text hover:text-action-text-hover">
          Tutte le edizioni
        </Link>
      </nav>
    </div>
  );
}

export function PuntoPage() {
  const { data: date } = useParams();
  const e = puntoEdition(date);
  const summary = puntoEditions.find((x) => x.date === date);
  usePageMeta(summary && e && !(e instanceof Promise) ? puntoMeta(summary) : null);
  if (e instanceof Promise) throw e; // edition still loading (Suspense)
  if (!e || !summary) return <NotFoundPage />;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={CalendarCheck}
        title={`Chi vince lo scudetto secondo il modello: il punto del ${longDate(e.date)}`}
        subtitle="I numeri del nostro modello sulla stagione, ogni lunedì, con il confronto con la settimana prima."
        breadcrumb={[{ label: "Il punto del modello", to: PUNTO_BASE }, { label: longDate(e.date) }]}
        meta={<span>Aggiornato al {longDate(e.date)}</span>}
      />
      <Edition e={e} />
    </div>
  );
}

export function PuntoHubPage() {
  const ok = puntoEditions.length > 0;
  usePageMeta(ok ? puntoHubMeta() : null);
  if (!ok) return <NotFoundPage />;
  const [last, ...rest] = puntoEditions;
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        icon={CalendarCheck}
        title="Il punto del modello"
        subtitle="Ogni lunedì le probabilità di scudetto, Champions, salvezza, coppe europee e NBA secondo il nostro modello, con data e confronto con la settimana prima."
        breadcrumb={[{ label: "Il punto del modello" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="max-w-3xl rounded-xl border border-predict/30 bg-predict/10 p-5 space-y-3">
          <p className="text-slate-300 text-sm">Ultima edizione</p>
          <p className="text-white text-lg leading-relaxed">{leadSentence(last)}</p>
          <Link to={puntoPath(last.date)} className="inline-block text-action-text hover:text-action-text-hover">
            Leggi il punto del {longDate(last.date)} →
          </Link>
        </div>
        {rest.length > 0 && (
          <section aria-labelledby="edizioni" className="max-w-3xl">
            <h2 id="edizioni" className="text-white text-xl mb-3">
              Edizioni precedenti
            </h2>
            <ul className="divide-y divide-slate-800">
              {rest.map((s) => (
                <li key={s.date} className="py-2">
                  <Link to={puntoPath(s.date)} className="text-action-text hover:text-action-text-hover">
                    Il punto del {longDate(s.date)}
                  </Link>
                  {s.scudetto[0] && (
                    <span className="text-slate-400 text-sm">
                      {" "}
                      · scudetto: {s.scudetto[0].name} {pct(s.scudetto[0].p)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="max-w-3xl text-slate-400 text-sm">
          Ogni edizione è fissata il lunedì mattina e non cambia più: si può citare con la sua data. Le proiezioni
          aggiornate ogni giorno sono nelle classifiche dei campionati.
        </p>
      </div>
    </div>
  );
}
