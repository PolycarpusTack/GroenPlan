import type { IPlantNetService } from "./plantnet-port";
import type { PlantNetResultaat } from "./types";
import { HttpPlantNetAdapter } from "./http-plantnet-adapter";
import { StubPlantNetService } from "./stub-plantnet-service";

// Probeert eerst de echte PlantNet-API (via /api/plantnet). Zonder backend
// (productie-build), zonder API-sleutel of zonder netwerk valt hij terug op een
// lokaal demo-resultaat. Het resultaat markeert eerlijk welke bron het leverde.
export class FallbackPlantNetAdapter implements IPlantNetService {
  constructor(
    private readonly primair: IPlantNetService = new HttpPlantNetAdapter(),
    private readonly reserve: IPlantNetService = new StubPlantNetService(),
  ) {}

  async identificeer(afbeelding: File): Promise<PlantNetResultaat> {
    try {
      const resultaat = await this.primair.identificeer(afbeelding);
      return { ...resultaat, bron: "online" };
    } catch {
      const resultaat = await this.reserve.identificeer(afbeelding);
      return { ...resultaat, bron: "lokaal" };
    }
  }
}

let instance: IPlantNetService | null = null;

export function getPlantNetService(): IPlantNetService {
  if (!instance) {
    instance = new FallbackPlantNetAdapter();
  }
  return instance;
}
