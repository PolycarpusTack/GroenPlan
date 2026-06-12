import type { PlagenResultaat } from "./types";

export interface IPlagenService {
  // Analyseert een plantfoto op plagen, ziekten en gebreksverschijnselen.
  // plantNaam is optionele context (bv. uit de voorafgaande PlantNet-identificatie).
  analyseer(afbeelding: File, plantNaam?: string): Promise<PlagenResultaat>;
}
