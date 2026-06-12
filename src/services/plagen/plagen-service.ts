import type { IPlagenService } from "./plagen-port";
import type { PlagenResultaat } from "./types";
import { HttpPlagenAdapter } from "./http-plagen-adapter";
import { StubPlagenService } from "./stub-plagen-service";

// Probeert eerst de echte AI (Claude-vision via /api/plagen). Zonder backend
// (productie-build), zonder API-sleutel of zonder netwerk valt hij terug op een
// lokaal demo-resultaat. Het resultaat markeert eerlijk welke bron het leverde.
export class FallbackPlagenAdapter implements IPlagenService {
  constructor(
    private readonly primair: IPlagenService = new HttpPlagenAdapter(),
    private readonly reserve: IPlagenService = new StubPlagenService(),
  ) {}

  async analyseer(afbeelding: File, plantNaam?: string): Promise<PlagenResultaat> {
    try {
      const resultaat = await this.primair.analyseer(afbeelding, plantNaam);
      return { ...resultaat, bron: "ai" };
    } catch {
      const resultaat = await this.reserve.analyseer(afbeelding, plantNaam);
      return { ...resultaat, bron: "lokaal" };
    }
  }
}

let instance: IPlagenService | null = null;

export function getPlagenService(): IPlagenService {
  if (!instance) {
    instance = new FallbackPlagenAdapter();
  }
  return instance;
}
