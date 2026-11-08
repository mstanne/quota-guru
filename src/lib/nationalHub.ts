// /pronostici/nazionali: summary page of the national teams (src/components/predictions/NationalHubPage.tsx).
// The metadata reads only the competitions index, so the pre-render does not need the matches.
import type { RouteMeta } from "../routes";
import { footballIndex } from "./footballData";

export const NATIONAL_HUB_PATH = "/pronostici/nazionali";

/** National-team competitions in the current data, in site order. */
export const nationalCompetitions = () => footballIndex.filter((c) => c.national);

export function nationalHubMeta(): RouteMeta {
  const names = nationalCompetitions().map((c) => c.name);
  const list = names.length ? names.slice(0, 4).join(", ") + (names.length > 4 ? " e altre" : "") : null;
  return {
    path: NATIONAL_HUB_PATH,
    title: "Pronostici nazionali: Italia, Nations League, qualificazioni e amichevoli",
    description:
      "Pronostici delle partite delle nazionali con le probabilità 1X2 del modello statistico" +
      (list ? `: ${list}` : "") +
      ". Le partite dell'Italia, le competizioni in corso, le schede delle nazionali e le edizioni passate.",
  };
}
