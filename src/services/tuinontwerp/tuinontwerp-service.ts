import type { ITuinOntwerpService } from "./tuinontwerp-port";
import type { Zone } from "../../domain/tuin/types";
import type { AutoFillResultaat } from "../../domain/plant/types";
import type { TuinOntwerpResultaat } from "./types";
import { HttpTuinOntwerpAdapter } from "./http-tuinontwerp-adapter";
import { StubTuinOntwerpService } from "./stub-tuinontwerp-service";

// Probeert eerst de echte AI (Claude Opus via /api/tuinontwerp). Als die niet
// bereikbaar is — geen backend in een productie-build, geen API-sleutel, of een
// netwerkfout — valt hij terug op het lokale heuristische ontwerp. Het resultaat
// markeert eerlijk welke bron het leverde, zodat de UI geen AI kan voorspiegelen
// die er niet was.
export class FallbackTuinOntwerpAdapter implements ITuinOntwerpService {
  constructor(
    private readonly primair: ITuinOntwerpService = new HttpTuinOntwerpAdapter(),
    private readonly reserve: ITuinOntwerpService = new StubTuinOntwerpService(),
  ) {}

  async analyseer(
    zone: Zone,
    catalog: Record<string, AutoFillResultaat>,
    hardheid: number,
    wens: string,
  ): Promise<TuinOntwerpResultaat> {
    try {
      const resultaat = await this.primair.analyseer(zone, catalog, hardheid, wens);
      return { ...resultaat, bron: "ai" };
    } catch {
      const resultaat = await this.reserve.analyseer(zone, catalog, hardheid, wens);
      return { ...resultaat, bron: "lokaal" };
    }
  }
}

let instance: ITuinOntwerpService | null = null;

export function getTuinOntwerpService(): ITuinOntwerpService {
  if (!instance) {
    instance = new FallbackTuinOntwerpAdapter();
  }
  return instance;
}
