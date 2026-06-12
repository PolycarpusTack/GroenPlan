import type { Tuin } from "./types";
import type { Taak } from "../taken/types";
import type { AutoFillResultaat } from "../plant/types";
import { berekenBegeleidersCheck } from "./berekenBegeleidersCheck";

export function berekenTuinGezondheid(
  tuin: Tuin,
  taken: Taak[],
  plantCatalog: Record<string, AutoFillResultaat>,
): number {
  const totaalPlanten = tuin.zones.reduce((s, z) => s + z.plantPlaatsingen.length, 0);
  if (totaalPlanten === 0 && tuin.zones.length === 0) return 0;

  // Component 1 (60%): planten in zones zonder companion-conflicten
  let plantenZonderConflict = 0;
  for (const zone of tuin.zones) {
    const check = berekenBegeleidersCheck(zone.plantPlaatsingen, plantCatalog);
    if (!check.some((r) => r.relatie === "slecht")) {
      plantenZonderConflict += zone.plantPlaatsingen.length;
    }
  }
  const comp1 = totaalPlanten > 0 ? plantenZonderConflict / totaalPlanten : 1;

  // Component 2 (20%): zones zonder achterstallige taken
  const vandaag = new Date().toISOString().slice(0, 10);
  const zonesMetAchterstal = new Set(
    taken
      .filter((t) => t.status === "open" && t.vervaldatum && t.vervaldatum < vandaag && t.zoneId)
      .map((t) => t.zoneId!),
  );
  const comp2 = tuin.zones.length > 0
    ? tuin.zones.filter((z) => !zonesMetAchterstal.has(z.id)).length / tuin.zones.length
    : 1;

  // Component 3 (20%): bloeispreiding over het jaar
  const bloeiMaanden = new Set<number>();
  for (const zone of tuin.zones) {
    for (const p of zone.plantPlaatsingen) {
      const plant = plantCatalog[p.wetenschappelijkeNaam.toLowerCase()];
      if (plant) plant.bloei.maanden.waarde.forEach((m) => bloeiMaanden.add(m));
    }
  }
  const comp3 = bloeiMaanden.size / 12;

  return Math.round((comp1 * 0.6 + comp2 * 0.2 + comp3 * 0.2) * 100);
}

export function berekenBiodiversiteit(
  tuin: Tuin,
  plantCatalog: Record<string, AutoFillResultaat>,
): number {
  const planten = tuin.zones.flatMap((z) => z.plantPlaatsingen);
  if (planten.length === 0) return 0;

  const families = new Set<string>();
  let metBestuivers = 0;
  let inheems = 0;

  for (const p of planten) {
    const plant = plantCatalog[p.wetenschappelijkeNaam.toLowerCase()];
    if (!plant) continue;
    if (plant.identificatie.familie) families.add(plant.identificatie.familie.toLowerCase());
    if (plant.ecologie.bestuivers.waarde.length > 0) metBestuivers++;
    if (plant.ecologie.inheems_belgie.waarde === true) inheems++;
  }

  // Normaliseer families op max ~15 voor een diverse tuin
  const familieScore = Math.min(families.size / 15, 1);
  const bestuiversScore = metBestuivers / planten.length;
  const inheemScore = inheems / planten.length;

  return Math.round((familieScore * 0.4 + bestuiversScore * 0.4 + inheemScore * 0.2) * 100);
}
