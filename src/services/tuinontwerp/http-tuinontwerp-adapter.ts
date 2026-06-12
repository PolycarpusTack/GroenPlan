import type { Zone } from "../../domain/tuin/types";
import type { AutoFillResultaat } from "../../domain/plant/types";
import type { ITuinOntwerpService } from "./tuinontwerp-port";
import type { TuinOntwerpResultaat } from "./types";

export class HttpTuinOntwerpAdapter implements ITuinOntwerpService {
  async analyseer(
    zone: Zone,
    catalog: Record<string, AutoFillResultaat>,
    hardheid: number,
    wens: string,
  ): Promise<TuinOntwerpResultaat> {
    const res = await fetch("/api/tuinontwerp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, catalog, hardheid, wens }),
    });

    if (!res.ok) {
      const fout = await res.json().catch(() => ({ fout: `HTTP ${res.status}` })) as { fout?: string };
      throw new Error(fout.fout ?? `Serverfout (${res.status})`);
    }

    return res.json() as Promise<TuinOntwerpResultaat>;
  }
}
