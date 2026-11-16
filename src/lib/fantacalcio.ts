// Fantasy football advice for the next round of Serie A (src/data/fantacalcio.json, scripts/derive-fantacalcio.mjs):
// /fantacalcio (the round, by role) and /fantacalcio/chi-schierare (compare two or three players).
import data from "../data/fantacalcio.json";
import { formatDay, formatTime } from "./footballCore";

export type Role = "P" | "D" | "C" | "A";
export interface FantaPlayer {
  id: number;
  name: string;
  url?: string;
  role: Role;
  team: { id: number; name: string; slug: string | null };
  opp: { id: number; name: string };
  home: boolean;
  match: number;
  /** chance of starting (1 / 0 once the official line-up is out) */
  start: number;
  band: "quasi certo" | "probabile" | "in dubbio" | "riserva" | "titolare" | "panchina";
  /** expected minutes */
  min: number;
  goal: number;
  assist: number;
  card: number;
  cleanSheet?: number;
  conceded?: number;
  penSaved?: number;
  /** expected bonus, classic rules */
  bonus: number;
}
export interface FantaMatch {
  id: number;
  kickoff: string;
  status: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
  lineups: boolean;
  xg?: [number, number];
  /** chance that home / away keep a clean sheet */
  cleanSheet?: [number, number];
}
interface FantaDoc {
  generatedAt: string | null;
  season: number | null;
  matchday: number | null;
  deadline: string | null;
  started: boolean;
  matches: FantaMatch[];
  players: FantaPlayer[];
  out: { name: string; role: Role; team: string; reason: string | null }[];
}
const doc = data as unknown as FantaDoc;

export const fanta = doc;
export const fantaPath = "/fantacalcio";
export const chiSchierarePath = "/fantacalcio/chi-schierare";
export const hasFanta = () => !!doc.matchday && doc.players.length >= 100;

export const ROLES: { key: Role; name: string; plural: string; anchor: string }[] = [
  { key: "P", name: "Portiere", plural: "Portieri", anchor: "portieri" },
  { key: "D", name: "Difensore", plural: "Difensori", anchor: "difensori" },
  { key: "C", name: "Centrocampista", plural: "Centrocampisti", anchor: "centrocampisti" },
  { key: "A", name: "Attaccante", plural: "Attaccanti", anchor: "attaccanti" },
];
export const roleName = (r: Role) => ROLES.find((x) => x.key === r)!.name;
export const playersOf = (r: Role) => doc.players.filter((p) => p.role === r);
export const playerById = (id: number) => doc.players.find((p) => p.id === id);
export const matchOf = (p: FantaPlayer) => doc.matches.find((m) => m.id === p.match);

/** "sab 21 novembre ore 15:00" of the deadline (first match of the round). */
export const deadlineText = () => (doc.deadline ? `${formatDay(doc.deadline)} ore ${formatTime(doc.deadline)}` : null);
export const fmtBonus = (b: number) => `${b > 0 ? "+" : b < 0 ? "−" : ""}${Math.abs(b).toFixed(2).replace(".", ",")}`;
/** Bands that count as "plays" in the filters. */
export const playsLikely = (p: FantaPlayer) => p.band === "quasi certo" || p.band === "probabile" || p.band === "titolare";

function topNames(r: Role, n: number) {
  return playersOf(r)
    .filter(playsLikely)
    .slice(0, n)
    .map((p) => p.name);
}

export function fantaMeta() {
  const n = doc.matchday;
  const att = topNames("A", 2);
  const gk = topNames("P", 1);
  return {
    path: fantaPath,
    title: `Consigli Fantacalcio ${n}ª giornata: chi schierare in Serie A`,
    description: [
      `Consigli fantacalcio per la ${n}ª giornata di Serie A con i numeri del nostro modello: probabilità di gol, assist, porta inviolata e bonus atteso di ogni giocatore, ruolo per ruolo.`,
      att.length ? `In testa tra gli attaccanti ${att.join(" e ")}${gk.length ? `, tra i portieri ${gk[0]}` : ""}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export function chiSchierareMeta() {
  return {
    path: chiSchierarePath,
    title: `Chi schierare al Fantacalcio: confronto giocatori (${doc.matchday}ª giornata)`,
    description: `Chi schierare tra due o tre giocatori nella ${doc.matchday}ª giornata di Serie A: probabilità di essere titolare, gol, assist, porta inviolata e bonus atteso calcolati dal nostro modello.`,
  };
}
