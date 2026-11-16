// Shared pieces of the fantasy football pages (src/lib/fantacalcio.ts).
import { Link } from "../../lib/links";
import { TeamName } from "../teams/TeamLink";
import type { FantaPlayer } from "../../lib/fantacalcio";

export const pc = (p: number) => {
  const v = Math.round(p * 100);
  return v < 1 && p > 0 ? "<1%" : `${v}%`;
};

const BAND_STYLE: Record<FantaPlayer["band"], string> = {
  titolare: "bg-predict/20 text-predict border-predict/40",
  "quasi certo": "bg-predict/15 text-predict border-predict/30",
  probabile: "bg-sky-400/10 text-sky-300 border-sky-400/30",
  "in dubbio": "bg-amber-400/10 text-amber-300 border-amber-400/30",
  riserva: "bg-slate-700/40 text-slate-300 border-slate-600",
  panchina: "bg-slate-700/40 text-slate-300 border-slate-600",
};
/** Start chance in words ("quasi certo", "in dubbio"… or the official line-up). */
export function Band({ p }: { p: FantaPlayer }) {
  const label = p.band === "titolare" ? "titolare (ufficiale)" : p.band === "panchina" ? "in panchina (ufficiale)" : p.band;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${BAND_STYLE[p.band]}`}
      title={p.band === "titolare" || p.band === "panchina" ? "Formazione ufficiale" : `Probabilità di partire titolare: ${pc(p.start)}`}
    >
      {label}
    </span>
  );
}

/** Player name (linked to his page when it exists). */
export function PlayerName({ p }: { p: FantaPlayer }) {
  return p.url ? (
    <Link to={p.url} className="text-white hover:text-action-text-hover">
      {p.name}
    </Link>
  ) : (
    <span className="text-white">{p.name}</span>
  );
}

/** "Lazio – Lecce" seen from the player's side: club (linked) and opponent, home or away. */
export function Fixture({ p }: { p: FantaPlayer }) {
  return (
    <span className="whitespace-nowrap text-slate-300">
      <TeamName id={p.team.id} name={p.team.name} /> <span className="text-slate-500">{p.home ? "vs" : "@"}</span>{" "}
      {p.opp.name}
    </span>
  );
}
