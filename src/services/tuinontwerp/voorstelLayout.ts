import type { AutoFillResultaat } from "../../domain/plant/types";

// Indicatieve plaatsing van een beplantingsvoorstel: hoge soorten achteraan,
// lage vooraan, per rij gelijkmatig verdeeld. Dit is een deterministische
// auto-layout op basis van catalogus-afmetingen — uitdrukkelijk GEEN
// AI-gegenereerde posities; de UI labelt dat ook zo.
export interface VoorstelPlantLayout {
  naam: string;
  /** Positie en straal in meter binnen de zone (oorsprong linksboven). */
  x: number;
  y: number;
  r: number;
  hoogteCm: number | null;
  /** false = volwassen breedte onbekend → default 40 cm, gestippeld weergegeven. */
  breedteBekend: boolean;
}

const DEFAULT_DIAMETER_M = 0.4;
const RIJ_GAP_M = 0.2;

export function berekenVoorstelLayout(
  soorten: string[],
  catalog: Record<string, AutoFillResultaat>,
  zoneBreedteM: number,
  zoneDiepteM: number,
): VoorstelPlantLayout[] {
  if (soorten.length === 0 || zoneBreedteM <= 0 || zoneDiepteM <= 0) return [];

  const info = soorten.map((naam) => {
    const plant = catalog[naam.toLowerCase()];
    const breedteCm = plant?.groei.volwassenBreedte_cm.waarde?.max ?? null;
    const hoogteCm = plant?.groei.volwassenHoogte_cm.waarde?.max ?? null;
    return {
      naam,
      diameterM: (breedteCm ?? DEFAULT_DIAMETER_M * 100) / 100,
      hoogteCm,
      breedteBekend: breedteCm !== null,
    };
  });

  // Hoog → laag; onbekende hoogte telt als bescheiden 40 cm.
  info.sort((a, b) => (b.hoogteCm ?? 40) - (a.hoogteCm ?? 40));

  // Verdeel over max. 3 rijen: achter (hoog) → voor (laag).
  const aantalRijen = Math.min(3, info.length);
  const perRij = Math.ceil(info.length / aantalRijen);
  const rijen = Array.from({ length: aantalRijen }, (_, r) =>
    info.slice(r * perRij, (r + 1) * perRij),
  ).filter((rij) => rij.length > 0);

  const resultaat: VoorstelPlantLayout[] = [];
  rijen.forEach((rij, rijIndex) => {
    const y = zoneDiepteM * ((rijIndex + 1) / (rijen.length + 1));
    const totaal = rij.reduce((som, p) => som + p.diameterM, 0) + RIJ_GAP_M * (rij.length - 1);
    // Past de rij niet in de zonebreedte, schaal de getekende diameters terug.
    const schaal = totaal > zoneBreedteM * 0.94 ? (zoneBreedteM * 0.94) / totaal : 1;
    let x = (zoneBreedteM - totaal * schaal) / 2;
    for (const p of rij) {
      const r = (p.diameterM * schaal) / 2;
      resultaat.push({
        naam: p.naam,
        x: Math.round((x + r) * 100) / 100,
        y: Math.round(y * 100) / 100,
        r: Math.round(r * 100) / 100,
        hoogteCm: p.hoogteCm,
        breedteBekend: p.breedteBekend,
      });
      x += p.diameterM * schaal + RIJ_GAP_M * schaal;
    }
  });
  return resultaat;
}
