// Items of the "Siti scommesse" menu (header dropdown, mobile menu, tiles at the bottom of the thematic pages).
import { Euro, Fingerprint, HandCoins, ListChecks, MonitorPlay, Wallet, Zap, type LucideIcon } from "lucide-react";
import { paths } from "../../routes";
import { methodPath, paymentMethods, topicPath, topics, type TopicId } from "../../lib/topicDefs";

const ICONS: Record<TopicId, LucideIcon> = {
  "deposito-5": Euro,
  prelievo: Zap,
  "cash-out": HandCoins,
  streaming: MonitorPlay,
  spid: Fingerprint,
  metodi: Wallet,
};

export interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const sitiMenu: MenuItem[] = [
  { to: paths.sitiScommesse, label: "Tutti i siti scommesse", icon: ListChecks },
  ...topics.map((t) => ({ to: topicPath(t), label: t.label, icon: ICONS[t.id] })),
];

/** Shorter names for the list of payment methods in the menu. */
const SHORT: Record<string, string> = { carte: "Carte di credito", bonifico: "Bonifico" };

export const methodMenu = paymentMethods.map((m) => ({ to: methodPath(m), label: SHORT[m.id] ?? m.name }));
