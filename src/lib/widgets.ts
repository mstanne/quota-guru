// Embeddable widgets (src/data/widgets.json, pages written by scripts/build-widgets.mjs under /embed/<id>/): the list
// shown on /widget with the embed code, and the link from the standings pages.
import data from "../data/widgets.json";
import { leagueOutlook } from "./seasonOutlook";
import { hasNbaStandings } from "./nbaSeason";

export interface WidgetDef {
  id: string;
  kind: "league" | "cup" | "nba";
  slug?: string;
  name: string;
  height: number;
}
export const WIDGET_PAGE = "/widget";
const SITE = "https://www.quotaguru.it";
const all = (data as { widgets: WidgetDef[] }).widgets;

/** Widgets with data now (the builder skips the others). */
export const widgets = () =>
  all.filter((w) => (w.kind === "nba" ? hasNbaStandings() : w.kind === "cup" ? leagueOutlook(w.slug!)?.cup === true : !!w.slug));
export const widgetFor = (slug: string) => widgets().find((w) => w.slug === slug && w.kind !== "nba");
export const nbaWidget = () => widgets().find((w) => w.kind === "nba");

export const widgetTitle = (w: WidgetDef) =>
  w.kind === "nba" ? "Classifica NBA e proiezione" : w.kind === "cup" ? `${w.name}: classifica e chi vince` : `Classifica ${w.name} e probabilità`;
/** Page of the site the widget links to (and the link of the embed code). */
export const widgetTarget = (w: WidgetDef) => (w.kind === "nba" ? "/basket/nba/classifica/" : `/calcio/${w.slug}/classifica/`);
const anchorText = (w: WidgetDef) =>
  w.kind === "nba"
    ? "classifica NBA con le probabilità di playoff"
    : w.kind === "cup"
      ? `probabilità ${w.name}`
      : w.slug === "serie-a"
        ? "probabilità scudetto e retrocessione in Serie A"
        : `classifica ${w.name} con le probabilità`;

export const embedSrc = (w: WidgetDef, light = false) => `${SITE}/embed/${w.id}/${light ? "?tema=chiaro" : ""}`;
/** HTML to paste: the iframe and, in the host page, the link to the site. */
export function embedCode(w: WidgetDef, light = false) {
  return [
    `<iframe src="${embedSrc(w, light)}" title="${widgetTitle(w)} – Quota Guru" width="100%" height="${w.height}" style="border:0;max-width:640px" loading="lazy"></iframe>`,
    `<p style="font-size:12px;margin:4px 0 0">Dati: <a href="${SITE}${widgetTarget(w)}">${anchorText(w)}</a> di Quota Guru</p>`,
  ].join("\n");
}

export const widgetPageMeta = () => ({
  path: WIDGET_PAGE,
  title: "Widget gratuiti: classifica Serie A con le probabilità per il tuo sito",
  description:
    "Widget gratuiti da incorporare nel tuo sito, blog o forum: classifiche di Serie A, Serie B e grandi campionati con le probabilità di scudetto, Champions e retrocessione, Champions League e NBA. Si aggiornano da soli.",
});
