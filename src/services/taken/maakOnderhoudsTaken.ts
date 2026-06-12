import type { AutoFillResultaat } from "../../domain/plant/types";
import type { Taak } from "../../domain/taken/types";

export function maakOnderhoudsTaken(
  plant: AutoFillResultaat,
  zoneId: string,
): Omit<Taak, "id" | "status" | "aangemaakt">[] {
  const taken: Omit<Taak, "id" | "status" | "aangemaakt">[] = [];
  const naam = plant.identificatie.gewoneNamen.nl ?? plant.identificatie.wetenschappelijkeNaam;

  if (plant.onderhoud.snoeien.waarde) {
    const { wanneer, hoe } = plant.onderhoud.snoeien.waarde;
    taken.push({
      titel: `${naam} snoeien (${wanneer}) — ${hoe}`,
      zoneId,
      vervaldatum: null,
      herhaling: null,
    });
  }

  if (plant.onderhoud.bemesten.waarde) {
    taken.push({
      titel: `${naam} bemesten — ${plant.onderhoud.bemesten.waarde}`,
      zoneId,
      vervaldatum: null,
      herhaling: null,
    });
  }

  if (plant.onderhoud.overwinteren.waarde) {
    taken.push({
      titel: `${naam} overwinteren — ${plant.onderhoud.overwinteren.waarde}`,
      zoneId,
      vervaldatum: null,
      herhaling: null,
    });
  }

  return taken;
}
