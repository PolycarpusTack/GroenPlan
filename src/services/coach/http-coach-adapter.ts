import type { ICoachService } from "./coach-port";
import type { CoachAntwoord } from "./types";

export class HttpCoachAdapter implements ICoachService {
  async vraag(vraag: string, context?: string): Promise<CoachAntwoord> {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vraag, context: context ?? null }),
    });

    if (!res.ok) {
      const fout = await res.json().catch(() => ({ fout: `HTTP ${res.status}` })) as { fout?: string };
      throw new Error(fout.fout ?? `Serverfout (${res.status})`);
    }

    return res.json() as Promise<CoachAntwoord>;
  }
}
