// Past seasons: /calcio/stagioni (every competition), /calcio/:competizione/stagioni (roll of honour) and
// /calcio/:competizione/stagioni/:stagione (final standings and results round by round).
// Data: src/lib/seasons.ts (scripts/derive-seasons.mjs, from the permanent archive).
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, ChevronLeft, ChevronRight, ListOrdered, Trophy } from "lucide-react";
import { Link, withSlash } from "../../lib/links";
import { PageHeader } from "../layout/PageHeader";
import { NotFoundPage } from "../NotFoundPage";
import { TeamName } from "../teams/TeamLink";
import { TeamBadge } from "../calcio/MatchRow";
import { formatShortDate, formatTime } from "../../lib/footballCore";
import { findCompetitionInfo } from "../../lib/footballData";
import { hasResults, resultsPath } from "../../lib/results";
import { usePageMeta } from "../../lib/pageMeta";
import {
  seasonData,
  seasonPath,
  seasonsHubPath,
  seasonsIndex,
  seasonsOf,
  seasonsPath,
  seasonsRoutes,
  type SeasonData,
  type SeasonMatch,
  type SeasonRow,
  type SeasonsCompetition,
} from "../../lib/seasons";

const metaFor = (path: string) => seasonsRoutes().find((r) => r.path === path) ?? null;
const card = "rounded-xl border border-slate-800 bg-slate-900";
const linkCls = "text-action-text hover:text-action-text-hover";

/** Links back to the competition's current pages (only for competitions the site follows). */
function CurrentLinks({ slug, name }: { slug: string; name: string }) {
  const comp = findCompetitionInfo(slug);
  if (!comp) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <Link to={`/pronostici/${slug}`} className={linkCls}>
        {name}: stagione in corso →
      </Link>
      {hasResults(slug) && (
        <Link to={resultsPath(slug)} className={linkCls}>
          Risultati della stagione in corso →
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- /calcio/stagioni

export function SeasonsHubPage() {
  usePageMeta(metaFor(seasonsHubPath));
  if (!seasonsIndex.length) return <NotFoundPage />;
  const leagues = seasonsIndex.filter((c) => c.type === "league");
  const cups = seasonsIndex.filter((c) => c.type === "cup");
  const nationals = seasonsIndex.filter((c) => c.type === "national");
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Albo d'oro e stagioni passate"
        icon={Trophy}
        subtitle="I vincitori di ogni stagione, con classifiche finali e risultati di campionati, coppe e competizioni delle nazionali."
        breadcrumb={[{ label: "Calcio", to: "/calcio" }, { label: "Stagioni passate" }]}
      />
      <div className="container mx-auto px-4 py-8 space-y-10">
        {[
          { title: "Campionati", list: leagues },
          { title: "Coppe", list: cups },
          { title: "Nazionali", list: nationals },
        ].map(
          (g) =>
            g.list.length > 0 && (
              <section key={g.title} aria-labelledby={`hub-${g.title}`}>
                <h2 id={`hub-${g.title}`} className="text-white text-2xl mb-4">
                  {g.title}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.list.map((c) => (
                    <HubCard key={c.slug} c={c} />
                  ))}
                </div>
              </section>
            ),
        )}
      </div>
    </div>
  );
}

function HubCard({ c }: { c: SeasonsCompetition }) {
  const last = c.seasons[0];
  return (
    <Link to={seasonsPath(c.slug)} className={`${card} block p-5 hover:border-slate-600 transition-colors`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-white text-lg">{c.name}</h3>
        <span className="text-slate-400 text-xs whitespace-nowrap">
          {c.seasons.length}{" "}
          {c.type === "national" ? (c.seasons.length === 1 ? "edizione" : "edizioni") : c.seasons.length === 1 ? "stagione" : "stagioni"}
        </span>
      </div>
      {last?.champion && (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-warn shrink-0" aria-hidden="true" />
          <span className="text-slate-400">{last.label}:</span>
          <span className="text-white truncate">{last.champion.name}</span>
        </p>
      )}
      <p className="mt-3 text-action-text text-sm">Albo d'oro e {c.type === "national" ? "edizioni" : "stagioni"} →</p>
    </Link>
  );
}

// ---------------------------------------------------------------- /calcio/:competizione/stagioni

export function SeasonsIndexPage() {
  const { competizione } = useParams();
  const c = seasonsOf(competizione);
  usePageMeta(metaFor(seasonsPath(competizione ?? "")));
  if (!c) return <NotFoundPage />;
  const cup = c.type !== "league";
  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={`Albo d'oro ${c.name}`}
        icon={Trophy}
        subtitle={
          cup
            ? c.type === "national"
              ? "Vincitori e finali delle edizioni passate. Apri un'edizione per gironi e tutte le partite."
              : "Le finali e i vincitori delle stagioni passate. Apri una stagione per tutte le partite, turno per turno."
            : "Le prime due classificate delle stagioni passate. Apri una stagione per classifica finale e risultati."
        }
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: "Stagioni passate", to: seasonsHubPath },
          { label: c.name },
        ]}
        meta={<span>{c.seasons.length} {c.type === "national" ? "edizioni" : "stagioni"} nell'archivio</span>}
      />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <SeasonNav slug={c.slug} />
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full text-sm min-w-[560px]">
            <caption className="sr-only">Albo d'oro {c.name}</caption>
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th scope="col" className="text-left font-normal px-4 py-3">
                  {c.type === "national" ? "Edizione" : "Stagione"}
                </th>
                <th scope="col" className="text-left font-normal py-3">
                  Vincitore
                </th>
                <th scope="col" className="text-left font-normal py-3">
                  {cup ? "Finale" : "Seconda classificata"}
                </th>
                <th scope="col" className="py-3 pr-4">
                  <span className="sr-only">Dettagli</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {c.seasons.map((s) => (
                <tr key={s.key} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                  <th scope="row" className="px-4 py-3 text-left font-normal text-white tabular-nums whitespace-nowrap">
                    {s.label}
                  </th>
                  <td className="py-3 pr-4">
                    {s.champion ? (
                      <span className="inline-flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-warn shrink-0" aria-hidden="true" />
                        <TeamName id={s.champion.id} name={s.champion.name} className="text-white font-medium" />
                      </span>
                    ) : (
                      <span className="text-slate-500">–</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {cup ? (
                      (s.final ?? <span className="text-slate-500">–</span>)
                    ) : s.runnerUp ? (
                      <TeamName id={s.runnerUp.id} name={s.runnerUp.name} className="text-slate-300" />
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    <Link
                      to={seasonPath(c.slug, s.key)}
                      className={linkCls}
                      aria-label={`${c.name} ${s.label}: ${cup ? "tutte le partite" : "classifica e risultati"}`}
                    >
                      {cup ? "Partite" : "Classifica e risultati"} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-400 text-xs">
          Le stagioni più vecchie si aggiungono man mano che vengono recuperate nell'archivio del sito.
        </p>
        <CurrentLinks slug={c.slug} name={c.name} />
        <OtherCompetitions current={c.slug} />
      </div>
    </div>
  );
}

function OtherCompetitions({ current }: { current: string }) {
  const others = seasonsIndex.filter((o) => o.slug !== current);
  if (!others.length) return null;
  return (
    <nav aria-label="Albo d'oro delle altre competizioni" className="pt-2">
      <h2 className="text-white text-lg mb-3">Altre competizioni</h2>
      <ul className="flex flex-wrap gap-2">
        {others.map((o) => (
          <li key={o.slug}>
            <Link
              to={seasonsPath(o.slug)}
              className="inline-flex px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-sm text-white hover:border-slate-500"
            >
              {o.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------- navigation (both pages)

const selectCls =
  "w-full h-11 appearance-none rounded-md border border-slate-700 bg-slate-950 pl-3 pr-9 text-white text-sm cursor-pointer hover:border-slate-500";

function Select({
  label,
  value,
  onChange,
  children,
  className = "flex-1",
}: {
  className?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-slate-400 text-xs mb-1">{label}</span>
      <span className="relative block">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

/**
 * Competition and season selectors (plus previous/next season arrows on a season page). Changing competition keeps
 * the same season when the other competition has it (by starting year), otherwise opens its most recent one; on the
 * roll-of-honour page it opens the other competition's roll of honour.
 */
function SeasonNav({ slug, season }: { slug: string; season?: string }) {
  const navigate = useNavigate();
  const go = (path: string) => navigate(withSlash(path));
  const c = seasonsOf(slug)!;
  const i = season ? c.seasons.findIndex((s) => s.key === season) : -1;
  const current = i >= 0 ? c.seasons[i] : null;
  const older = i >= 0 ? c.seasons[i + 1] : undefined;
  const newer = i > 0 ? c.seasons[i - 1] : undefined;

  const changeCompetition = (to: string) => {
    const target = seasonsOf(to);
    if (!target) return;
    if (!current) return go(seasonsPath(to));
    const same = target.seasons.find((s) => s.year === current.year) ?? target.seasons[0];
    go(seasonPath(to, same.key));
  };
  const arrow = (s: typeof older, dir: "prev" | "next") => {
    const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
    const cls = "inline-flex items-center justify-center size-11 shrink-0 rounded-md border border-slate-700";
    return s ? (
      <Link
        to={seasonPath(slug, s.key)}
        aria-label={`${dir === "prev" ? "Stagione precedente" : "Stagione successiva"}: ${c.name} ${s.label}`}
        className={`${cls} bg-slate-950 text-white hover:border-slate-500`}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </Link>
    ) : (
      <span className={`${cls} text-slate-700`} aria-hidden="true">
        <Icon className="w-5 h-5" />
      </span>
    );
  };
  const groups = [
    { label: "Campionati", list: seasonsIndex.filter((x) => x.type === "league") },
    { label: "Coppe", list: seasonsIndex.filter((x) => x.type === "cup") },
    { label: "Nazionali", list: seasonsIndex.filter((x) => x.type === "national") },
  ];

  return (
    <nav aria-label="Scegli competizione e stagione" className={`${card} p-3 sm:p-4 flex flex-col sm:flex-row gap-3`}>
      <Select label="Competizione" value={slug} onChange={changeCompetition} className="sm:w-72 sm:flex-none">
        {groups.map(
          (g) =>
            g.list.length > 0 && (
              <optgroup key={g.label} label={g.label}>
                {g.list.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            ),
        )}
      </Select>
      <div className="flex flex-1 items-end gap-2 min-w-0">
        {season && arrow(older, "prev")}
        <Select label="Stagione" value={season ?? ""} onChange={(v) => go(v ? seasonPath(slug, v) : seasonsPath(slug))}>
          <option value="">Albo d'oro (tutte le {c.type === "national" ? "edizioni" : "stagioni"})</option>
          {c.seasons.map((s) => (
            <option key={s.key} value={s.key}>
              {c.name} {s.label}
              {s.champion ? ` · ${s.champion.name}` : ""}
            </option>
          ))}
        </Select>
        {season && arrow(newer, "next")}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------- /calcio/:competizione/stagioni/:stagione

export function SeasonPage() {
  const { competizione, stagione } = useParams();
  usePageMeta(metaFor(`/calcio/${competizione}/stagioni/${stagione}`));
  const data = seasonData(competizione, stagione);
  if (data instanceof Promise) throw data; // loading (Suspense)
  if (!data) return <NotFoundPage />;
  const c = seasonsOf(data.slug)!;
  const cup = data.type !== "league";
  const national = data.type === "national";

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title={`${data.name} ${data.label}`}
        icon={cup ? Trophy : ListOrdered}
        subtitle={
          national
            ? `Gironi${data.final ? ", fase finale" : ""} e tutte le partite dell'edizione, turno per turno.`
            : cup
              ? "Tutte le partite della stagione, turno per turno, fino alla finale."
              : "Classifica finale e risultati di tutte le giornate."
        }
        breadcrumb={[
          { label: "Calcio", to: "/calcio" },
          { label: "Stagioni passate", to: seasonsHubPath },
          { label: data.name, to: seasonsPath(data.slug) },
          { label: data.label },
        ]}
        meta={
          data.champion ? (
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-warn" aria-hidden="true" />
              {cup ? "Vincitore" : "Campione"}: <strong className="text-white font-medium">{data.champion.name}</strong>
            </span>
          ) : undefined
        }
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <SeasonNav slug={c.slug} season={data.key} />

        {cup && data.final && (
          <p className={`${card} px-5 py-4 text-white`}>
            <span className="text-slate-400">Finale: </span>
            {data.final}
          </p>
        )}
        {data.standings && <Standings data={data} />}
        {data.groups && data.groups.length > 0 && <Groups data={data} />}
        {data.notes.length > 0 && (
          <ul className="space-y-1 text-slate-400 text-sm">
            {data.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}

        <section aria-labelledby="risultati" className="space-y-4">
          <h2 id="risultati" className="text-white text-2xl">
            {cup ? "Tutte le partite" : "Risultati"}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            {(cup ? [...data.rounds].reverse() : data.rounds).map((r) => (
              <Round key={r.round} title={r.round} matches={r.matches} />
            ))}
          </div>
        </section>
        <CurrentLinks slug={c.slug} name={c.name} />
      </div>
    </div>
  );
}

const ZONE_CLS: Record<string, string> = {
  "Champions League": "border-l-sky-400",
  "Europa League": "border-l-orange-400",
  "Conference League": "border-l-emerald-400",
  Promozione: "border-l-sky-400",
  Playoff: "border-l-orange-400",
  Libertadores: "border-l-sky-400",
  Sudamericana: "border-l-orange-400",
  Playout: "border-l-amber-300",
  Retrocessione: "border-l-red-500",
};

function Standings({ data }: { data: SeasonData }) {
  const rows = data.standings as SeasonRow[];
  const zones = [...new Set(rows.map((r) => r.zone).filter(Boolean))] as string[];
  return (
    <section aria-labelledby="classifica">
      <h2 id="classifica" className="text-white text-2xl mb-3">
        Classifica finale
      </h2>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm min-w-[640px]">
          <caption className="sr-only">
            Classifica finale {data.name} {data.label}
          </caption>
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th scope="col" className="text-left font-normal px-4 py-3 w-10">
                #
              </th>
              <th scope="col" className="text-left font-normal py-3">
                Squadra
              </th>
              {[
                ["Pt", "Punti"],
                ["G", "Partite giocate"],
                ["V", "Vittorie"],
                ["N", "Pareggi"],
                ["P", "Sconfitte"],
                ["GF", "Gol fatti"],
                ["GS", "Gol subiti"],
                ["DR", "Differenza reti"],
              ].map(([a, t]) => (
                <th key={a} scope="col" className="text-right font-normal py-3 px-2 last:pr-4">
                  {a === "Pt" ? a : <abbr title={t}>{a}</abbr>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.team.id}
                className={`border-b border-slate-800 last:border-0 hover:bg-slate-800/40 border-l-4 ${r.zone ? ZONE_CLS[r.zone] : "border-l-transparent"}`}
              >
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{r.pos}</td>
                <th scope="row" className="py-2.5 text-left font-normal">
                  <span className="flex items-center gap-2.5">
                    <TeamBadge
                      team={{
                        tla: r.team.name.slice(0, 3).toUpperCase(),
                        crest: r.crest ?? null,
                        shortName: r.team.name,
                      }}
                    />
                    <TeamName id={r.team.id} name={r.team.name} />
                    {r.pos === 1 && <Trophy className="w-4 h-4 text-warn shrink-0" aria-label="Campione" />}
                  </span>
                </th>
                <td className="text-right px-2 text-white font-semibold tabular-nums">
                  {r.pts}
                  {r.ded ? (
                    <sup className="text-warn" title={`${r.ded} punti di penalizzazione`}>
                      *
                    </sup>
                  ) : null}
                </td>
                <td className="text-right px-2 text-slate-300 tabular-nums">{r.played}</td>
                <td className="text-right px-2 text-slate-300 tabular-nums">{r.won}</td>
                <td className="text-right px-2 text-slate-300 tabular-nums">{r.draw}</td>
                <td className="text-right px-2 text-slate-300 tabular-nums">{r.lost}</td>
                <td className="text-right px-2 text-slate-300 tabular-nums">{r.gf}</td>
                <td className="text-right px-2 text-slate-300 tabular-nums">{r.ga}</td>
                <td className="text-right px-2 pr-4 text-slate-300 tabular-nums">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {zones.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-slate-400 text-xs" aria-label="Legenda">
          {zones.map((z) => (
            <li key={z} className={`border-l-4 pl-2 ${ZONE_CLS[z]}`}>
              {z}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Group tables of a national-team edition. */
function Groups({ data }: { data: SeasonData }) {
  return (
    <section aria-labelledby="gironi" className="space-y-3">
      <h2 id="gironi" className="text-white text-2xl">
        {data.groups!.length > 1 ? "Gironi" : "Classifica"}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {data.groups!.map((g) => (
          <div key={g.name} className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <caption className="text-left text-white px-4 pt-3 pb-1">{g.name}</caption>
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th scope="col" className="text-left font-normal px-4 py-2 w-8">#</th>
                  <th scope="col" className="text-left font-normal py-2">Squadra</th>
                  <th scope="col" className="text-right font-normal py-2 px-2">Pt</th>
                  <th scope="col" className="text-right font-normal py-2 px-2"><abbr title="Partite giocate">G</abbr></th>
                  <th scope="col" className="text-right font-normal py-2 px-2 pr-4"><abbr title="Differenza reti">DR</abbr></th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.team.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-4 py-2 text-slate-400 tabular-nums">{r.pos}</td>
                    <th scope="row" className="py-2 text-left font-normal">
                      <TeamName id={r.team.id} name={r.team.name} />
                    </th>
                    <td className="text-right px-2 text-white font-semibold tabular-nums">{r.pts}</td>
                    <td className="text-right px-2 text-slate-300 tabular-nums">{r.played}</td>
                    <td className="text-right px-2 pr-4 text-slate-300 tabular-nums">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

function Round({ title, matches }: { title: string; matches: SeasonMatch[] }) {
  return (
    <section className={`${card} px-4 py-3`}>
      <h3 className="text-white py-1.5 first-letter:uppercase">{title}</h3>
      <ul className="divide-y divide-slate-800">
        {matches.map((m) => (
          <MatchLine key={m.id} m={m} />
        ))}
      </ul>
    </section>
  );
}

function MatchLine({ m }: { m: SeasonMatch }) {
  const [h, a] = m.score;
  const homeWon = h > a || (h === a && m.pen && m.pen[0] > m.pen[1]);
  const awayWon = a > h || (h === a && m.pen && m.pen[1] > m.pen[0]);
  const score = (
    <>
      {h}–{a}
      {m.pen ? (
        <span className="text-slate-400 text-xs">
          {" "}
          ({m.pen[0]}-{m.pen[1]} rig.)
        </span>
      ) : m.aet ? (
        <span className="text-slate-400 text-xs"> dts</span>
      ) : null}
    </>
  );
  return (
    <li className="flex items-center gap-2 py-2 text-sm">
      <span className="w-16 shrink-0 text-slate-500 text-xs tabular-nums leading-tight">
        {formatShortDate(m.date).slice(0, 5)}
        <span className="block">{formatTime(m.date)}</span>
      </span>
      <span className="flex-1 min-w-0 text-right truncate">
        <TeamName
          id={m.home.id}
          name={m.home.name}
          className={homeWon ? "text-white font-semibold" : "text-slate-300"}
        />
      </span>
      {m.path ? (
        <Link
          to={m.path}
          className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 tabular-nums text-white hover:bg-slate-700"
          aria-label={`${m.home.name} ${h}-${a} ${m.away.name}: scheda della partita`}
        >
          {score}
        </Link>
      ) : (
        <span className="shrink-0 rounded-md bg-slate-950 px-2 py-0.5 tabular-nums text-white">{score}</span>
      )}
      <span className="flex-1 min-w-0 truncate">
        <TeamName
          id={m.away.id}
          name={m.away.name}
          className={awayWon ? "text-white font-semibold" : "text-slate-300"}
        />
      </span>
    </li>
  );
}
