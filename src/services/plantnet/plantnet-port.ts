import type { PlantNetResultaat } from "./types";

export interface IPlantNetService {
  identificeer(afbeelding: File): Promise<PlantNetResultaat>;
}
