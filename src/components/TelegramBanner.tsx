import { Send } from "lucide-react";
import { isFilled, site } from "../data/site";

/**
 * Invitation to the QuotaGuru Telegram channel (posts: scripts/telegram/README.md).
 * One text per page, about the rubric that page shares with the channel. Hidden when site.social.telegram is empty.
 * Decreto Dignità: like the channel, only data and predictions — no operators, bonuses or invitations to bet.
 */
const TEXTS = {
  tris: {
    title: "Il tris anche su Telegram",
    text: "Il tris del weekend esce sul canale il sabato mattina, quelli delle coppe il giorno della giornata; il lunedì il bilancio di com'è andata.",
  },
  multiple: {
    title: "Le multiple del giorno su Telegram",
    text: "Ogni mattina sul canale le multiple del giorno con probabilità e quota equa, e com'è andata ognuna di quelle del giorno prima.",
  },
  pronostici: {
    title: "I pronostici del giorno su Telegram",
    text: "Sul canale ogni giorno le partite con le probabilità del modello, il tris, le multiple e le formazioni ufficiali appena escono.",
  },
  bilancio: {
    title: "Il bilancio ogni lunedì su Telegram",
    text: "Ogni lunedì sul canale com'è andato ogni pronostico del weekend e degli ultimi 30 giorni, vinti e persi.",
  },
  formazioni: {
    title: "Formazioni ufficiali su Telegram",
    text: "Sul canale le formazioni ufficiali di ogni partita di Serie A appena escono, circa un'ora prima, con il pronostico del modello.",
  },
  partita: {
    title: "I pronostici del giorno su Telegram",
    text: "Sul canale ogni giorno le partite con le probabilità del modello, il tris, le multiple e i risultati contro il modello.",
  },
  tv: {
    title: "Dove vederla, ogni venerdì su Telegram",
    text: "Il venerdì sul canale i canali TV di tutta la giornata di Serie A, poi le formazioni ufficiali partita per partita.",
  },
} as const;

export type TelegramTopic = keyof typeof TEXTS;

/** stacked: always one column (narrow sidebars); otherwise text and button side by side from sm. */
export function TelegramBanner({
  topic,
  stacked = false,
  className = "",
}: {
  topic: TelegramTopic;
  stacked?: boolean;
  className?: string;
}) {
  const href = site.social.telegram;
  if (!isFilled(href)) return null;
  const { title, text } = TEXTS[topic];
  return (
    <aside
      aria-label="Canale Telegram di QuotaGuru"
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-4 ${stacked ? "" : "sm:flex-row sm:items-center"} ${className}`}
    >
      <span
        className={`${stacked ? "hidden" : "hidden sm:inline-flex"} size-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white`}
        aria-hidden="true"
      >
        <Send className="w-5 h-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-white font-medium">{title}</p>
        <p className="text-slate-300 text-sm mt-1">{text}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-selected px-4 text-sm font-medium text-selected-foreground hover:bg-white transition-colors"
      >
        <Send className={`w-4 h-4 ${stacked ? "" : "sm:hidden"}`} aria-hidden="true" />
        Segui il canale
      </a>
    </aside>
  );
}
