import type { PlantPlaatsing } from "./types";
import type { AutoFillResultaat } from "../plant/types";

export type BegeleiderRelatie = "goed" | "slecht";

export interface BegeleidersResultaat {
  plantA: string;
  plantB: string;
  relatie: BegeleiderRelatie;
}

function normaleer(naam: string): string {
  return naam.toLowerCase().trim();
}

function heeftMatch(lijst: string[], doelNaam: string): boolean {
  const doel = normaleer(doelNaam);
  return lijst.some((n) => normaleer(n) === doel);
}

/**
 * Berekent alle niet-neutrale begeleiderrelaties tussen de planten in een zone.
 * "slecht" wint boven "goed" als beide signalen aanwezig zijn voor hetzelfde paar.
 */
export function berekenBegeleidersCheck(
  plaatsingen: PlantPlaatsing[],
  catalog: Record<string, AutoFillResultaat>,
): BegeleidersResultaat[] {
  const resultaten: BegeleidersResultaat[] = [];

  for (let i = 0; i < plaatsingen.length; i++) {
    for (let j = i + 1; j < plaatsingen.length; j++) {
      const naamA = plaatsingen[i].wetenschappelijkeNaam;
      const naamB = plaatsingen[j].wetenschappelijkeNaam;
      const plantA = catalog[naamA.toLowerCase()];
      const plantB = catalog[naamB.toLowerCase()];

      if (!plantA && !plantB) continue;

      const goedSignalen =
        (plantA ? heeftMatch(plantA.ecologie.begeleiders.waarde.goed, naamB) : false) ||
        (plantB ? heeftMatch(plantB.ecologie.begeleiders.waarde.goed, naamA) : false);

      const slechtSignalen =
        (plantA ? heeftMatch(plantA.ecologie.begeleiders.waarde.slecht, naamB) : false) ||
        (plantB ? heeftMatch(plantB.ecologie.begeleiders.waarde.slecht, naamA) : false);

      if (slechtSignalen) {
        resultaten.push({ plantA: naamA, plantB: naamB, relatie: "slecht" });
      } else if (goedSignalen) {
        resultaten.push({ plantA: naamA, plantB: naamB, relatie: "goed" });
      }
    }
  }

  // Conflicten (slecht) eerst
  return resultaten.sort((a, b) => (a.relatie === "slecht" ? -1 : 1) - (b.relatie === "slecht" ? -1 : 1));
}
