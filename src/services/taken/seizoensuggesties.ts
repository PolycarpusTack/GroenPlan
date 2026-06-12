import type { AutoFillResultaat } from "../../domain/plant/types";
import type { PlantPlaatsing } from "../../domain/tuin/types";

export type Seizoen = "lente" | "zomer" | "herfst" | "winter";

export interface TaakSuggestie {
  titel: string;
  wetenschappelijkeNaam: string;
  gewoneNaam: string | null;
  zoneId: string;
}

function huidigSeizoen(): Seizoen {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "lente";
  if (m >= 6 && m <= 8) return "zomer";
  if (m >= 9 && m <= 11) return "herfst";
  return "winter";
}

const SEIZOEN_TREFWOORDEN: Record<Seizoen, string[]> = {
  lente: ["lente", "spring", "voorjaar", "maart", "april", "mei", "voor de zomer", "vroeg"],
  zomer: ["zomer", "summer", "juni", "juli", "augustus", "na de bloei"],
  herfst: ["herfst", "autumn", "fall", "september", "oktober", "november", "najaar"],
  winter: ["winter", "december", "januari", "februari", "vroeg in het jaar", "voor het uitlopen"],
};

function matchSeizoen(tekst: string, seizoen: Seizoen): boolean {
  if (!tekst) return false;
  const lower = tekst.toLowerCase();
  return SEIZOEN_TREFWOORDEN[seizoen].some((t) => lower.includes(t));
}

export function berekenSeizoenSuggesties(
  plaatsingen: PlantPlaatsing[],
  catalog: Record<string, AutoFillResultaat>,
  zoneId: string,
): TaakSuggestie[] {
  const seizoen = huidigSeizoen();
  const suggesties: TaakSuggestie[] = [];
  const gezien = new Set<string>(); // voorkom dubbelen per wetNaam+type

  for (const p of plaatsingen) {
    const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
    if (!plant) continue;

    const wetNaam = plant.identificatie.wetenschappelijkeNaam;
    const gewoneNaam = plant.identificatie.gewoneNamen.nl;
    const { snoeien, bemesten, overwinteren } = plant.onderhoud;

    if (snoeien.waarde?.wanneer && matchSeizoen(snoeien.waarde.wanneer, seizoen)) {
      const sleutel = `snoei:${wetNaam}`;
      if (!gezien.has(sleutel)) {
        gezien.add(sleutel);
        const hoe = snoeien.waarde.hoe ? ` (${snoeien.waarde.hoe})` : "";
        suggesties.push({
          titel: `Snoei ${gewoneNaam ?? wetNaam}${hoe}`,
          wetenschappelijkeNaam: wetNaam,
          gewoneNaam,
          zoneId,
        });
      }
    }

    if (bemesten.waarde && matchSeizoen(bemesten.waarde, seizoen)) {
      const sleutel = `bemest:${wetNaam}`;
      if (!gezien.has(sleutel)) {
        gezien.add(sleutel);
        suggesties.push({
          titel: `Bemest ${gewoneNaam ?? wetNaam}`,
          wetenschappelijkeNaam: wetNaam,
          gewoneNaam,
          zoneId,
        });
      }
    }

    if ((seizoen === "herfst" || seizoen === "winter") && overwinteren.waarde) {
      if (matchSeizoen(overwinteren.waarde, seizoen)) {
        const sleutel = `winter:${wetNaam}`;
        if (!gezien.has(sleutel)) {
          gezien.add(sleutel);
          suggesties.push({
            titel: `Overwinter ${gewoneNaam ?? wetNaam}`,
            wetenschappelijkeNaam: wetNaam,
            gewoneNaam,
            zoneId,
          });
        }
      }
    }
  }

  return suggesties.slice(0, 6);
}
