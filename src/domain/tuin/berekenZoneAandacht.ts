import type { Zone } from "./types";
import type { Taak } from "../taken/types";

// Onder deze 7-daagse neerslag beschouwen we een zone als droogte-gevoelig.
export const DROOGTE_GRENS_MM = 5;

/**
 * Aandachtspunten per zone (droogte, achterstallige taken) — puur en
 * herbruikbaar door Dashboard en Tuinkaart. Begeleidersconflicten worden
 * apart berekend (berekenBegeleidersCheck) omdat ze de plantcatalogus nodig hebben.
 */
export function berekenZoneAandacht(
  zones: Zone[],
  taken: Taak[],
  vandaagIso: string,
): Record<string, string[]> {
  const resultaat: Record<string, string[]> = {};
  for (const z of zones) {
    const punten: string[] = [];
    if (z.regenval_mm_7d != null && z.regenval_mm_7d < DROOGTE_GRENS_MM) {
      punten.push(`Droogte: ${z.regenval_mm_7d} mm neerslag in 7 dagen`);
    }
    const achterstallig = taken.filter(
      (t) => t.status === "open" && t.zoneId === z.id && t.vervaldatum && t.vervaldatum < vandaagIso,
    ).length;
    if (achterstallig > 0) {
      punten.push(`${achterstallig} achterstallige ta${achterstallig === 1 ? "ak" : "ken"}`);
    }
    if (punten.length > 0) resultaat[z.id] = punten;
  }
  return resultaat;
}
