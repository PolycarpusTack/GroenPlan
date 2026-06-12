import type { IPlantNetService } from "./plantnet-port";
import type { PlantNetResultaat, PlantNetSuggestie } from "./types";

// Vaste pool van tuinplanten — stub simuleert een realistische top-3 op basis van bestandsnaam
const PLANT_POOL: PlantNetSuggestie[] = [
  { wetenschappelijkeNaam: "Lavandula angustifolia", gewoneNaam: "Echte lavendel", familie: "Lamiaceae", zekerheid: 0.87 },
  { wetenschappelijkeNaam: "Rosa canina", gewoneNaam: "Hondsroos", familie: "Rosaceae", zekerheid: 0.74 },
  { wetenschappelijkeNaam: "Hedera helix", gewoneNaam: "Klimop", familie: "Araliaceae", zekerheid: 0.61 },
  { wetenschappelijkeNaam: "Salvia officinalis", gewoneNaam: "Salie", familie: "Lamiaceae", zekerheid: 0.93 },
  { wetenschappelijkeNaam: "Hydrangea macrophylla", gewoneNaam: "Boerenhortensia", familie: "Hydrangeaceae", zekerheid: 0.82 },
  { wetenschappelijkeNaam: "Prunus laurocerasus", gewoneNaam: "Laurierkers", familie: "Rosaceae", zekerheid: 0.69 },
  { wetenschappelijkeNaam: "Taxus baccata", gewoneNaam: "Venijnboom", familie: "Taxaceae", zekerheid: 0.78 },
  { wetenschappelijkeNaam: "Buddleja davidii", gewoneNaam: "Vlinderstruik", familie: "Scrophulariaceae", zekerheid: 0.91 },
  { wetenschappelijkeNaam: "Fuchsia magellanica", gewoneNaam: "Bellenplant", familie: "Onagraceae", zekerheid: 0.66 },
  { wetenschappelijkeNaam: "Digitalis purpurea", gewoneNaam: "Vingerhoedskruid", familie: "Plantaginaceae", zekerheid: 0.85 },
];

export class StubPlantNetService implements IPlantNetService {
  async identificeer(afbeelding: File): Promise<PlantNetResultaat> {
    // Realistische vertraging (500–1200ms) zodat het voelt als een echte API-call
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

    // Deterministische selectie op basis van bestandsnaam zodat dezelfde foto → zelfde resultaten
    const seed = afbeelding.name
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const shuffled = [...PLANT_POOL].sort((a, b) => {
      const ha = (seed * a.wetenschappelijkeNaam.charCodeAt(0)) % 97;
      const hb = (seed * b.wetenschappelijkeNaam.charCodeAt(0)) % 97;
      return hb - ha;
    });

    const top3 = shuffled.slice(0, 3).map((s, i) => ({
      ...s,
      // Verlaag zekerheid per rang zodat de volgorde realistisch aanvoelt
      zekerheid: Math.max(0.1, s.zekerheid - i * 0.15),
    }));

    return {
      suggesties: top3,
      queryId: `stub-${Date.now()}`,
    };
  }
}
