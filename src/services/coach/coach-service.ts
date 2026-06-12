import type { ICoachService } from "./coach-port";
import type { CoachAntwoord } from "./types";
import { HttpCoachAdapter } from "./http-coach-adapter";
import { StubCoachService } from "./stub-coach-service";

// Probeert eerst de echte AI (Claude via /api/coach). Zonder backend, sleutel of
// netwerk valt hij terug op lokale begeleiding. Het antwoord markeert eerlijk
// welke bron het leverde.
export class FallbackCoachAdapter implements ICoachService {
  constructor(
    private readonly primair: ICoachService = new HttpCoachAdapter(),
    private readonly reserve: ICoachService = new StubCoachService(),
  ) {}

  async vraag(vraag: string, context?: string): Promise<CoachAntwoord> {
    try {
      const antwoord = await this.primair.vraag(vraag, context);
      return { ...antwoord, bron: "ai" };
    } catch {
      const antwoord = await this.reserve.vraag(vraag, context);
      return { ...antwoord, bron: "lokaal" };
    }
  }
}

let instance: ICoachService | null = null;

export function getCoachService(): ICoachService {
  if (!instance) {
    instance = new FallbackCoachAdapter();
  }
  return instance;
}
