// /llms.txt (llmstxt.org): a plain description of the site for AI assistants and search engines that read it, with
// the current figures of the track record and links to the main pages. Written by scripts/prerender.mjs.
import { paths } from "../routes";
import { footballIndex } from "./footballData";
import { competitionPath } from "./footballCore";
import { footballTrackRecord } from "./trackRecordFootball";
import { nbaTrackRecord } from "./trackRecordNba";
import { trackLead, ARCHIVE_FILES, TRACK_RECORD_PATH } from "./trackRecordMeta";
import { guides } from "../data/guides";

export function llmsTxt(url: (path: string) => string) {
  const link = (title: string, path: string, note = "") => `- [${title}](${url(path)})${note ? `: ${note}` : ""}`;
  return [
    "# QuotaGuru",
    "",
    "> Sito italiano di pronostici sportivi basati sui dati: per ogni partita di calcio e NBA pubblica le probabilità di ogni esito calcolate da modelli statistici (calcio: modello di Poisson/Dixon-Coles sui gol delle ultime stagioni; NBA: modello a punti per scarto e totale), con le motivazioni della stima e il bilancio di tutti i pronostici passati, giusti e sbagliati. Per il tennis stima chi vince tra due giocatori dei top 100 ATP e WTA. Elenca anche gli operatori di scommesse con concessione ADM e le loro offerte.",
    "",
    "Le probabilità sono stime statistiche, non consigli di gioco né quote di un operatore. Il gioco è vietato ai minori di 18 anni; Telefono Verde nazionale per le problematiche legate al gioco d'azzardo: 800 558 822.",
    "",
    `Bilancio aggiornato: ${trackLead(footballTrackRecord(), nbaTrackRecord())}`,
    "",
    "## Pronostici",
    link("Tutti i pronostici", paths.pronostici, "calcio, NBA e tennis, divisi per giorno"),
    link("Pronostici di oggi", "/pronostici/oggi"),
    link("Pronostici di domani", "/pronostici/domani"),
    link("Bilancio dei pronostici", TRACK_RECORD_PATH, "percentuale di esiti azzeccati per competizione e mese"),
    link("Metodologia", paths.metodologia, "come sono calcolate le probabilità e da dove arrivano i dati"),
    ...footballIndex.map((c) => link(`Pronostici ${c.name}`, competitionPath(c))),
    link("Pronostici NBA", "/pronostici/nba"),
    link("Tennis: pronostico testa a testa", paths.tennis),
    "",
    "## Dati",
    ...ARCHIVE_FILES.map((f) => link(f.name, f.url, "ogni pronostico pubblicato con probabilità, risultato ed esito")),
    link("Calendario e risultati calcio", paths.calcio),
    link("Squadre di calcio", paths.squadreCalcio),
    link("Squadre NBA", paths.squadreNba),
    "",
    "## Operatori e offerte",
    link("Siti di scommesse legali", paths.sitiScommesse, "solo concessionari ADM"),
    link("Offerte di benvenuto", paths.bonus, "condizioni, requisiti di giocata e costo reale"),
    "",
    "## Guide",
    ...guides.map((g) => link(g.title, `${paths.guide}/${g.slug}`)),
    "",
    "## Chi siamo",
    link("Chi siamo", paths.chiSiamo),
    link("Contatti", paths.contatti),
    link("Domande frequenti", paths.faq),
    "",
  ].join("\n");
}
