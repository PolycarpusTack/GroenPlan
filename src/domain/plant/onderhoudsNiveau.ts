import type { AutoFillResultaat } from "./types";

// Onderhoudsniveau 1 (laag) – 3 (hoog), afgeleid uit de aanwezige
// onderhoudsdata: basisverzorging + snoeien + bemesten. Zelfde maatstaf
// als de Analyse-tab van de Zone Designer.
export type OnderhoudsNiveau = 1 | 2 | 3;

export function onderhoudsNiveau(plant: AutoFillResultaat): OnderhoudsNiveau {
  let n = 1;
  if (plant.onderhoud.snoeien.waarde) n++;
  if (plant.onderhoud.bemesten.waarde) n++;
  return n as OnderhoudsNiveau;
}

export const ONDERHOUD_LABEL: Record<OnderhoudsNiveau, string> = {
  1: "Laag",
  2: "Medium",
  3: "Hoog",
};
