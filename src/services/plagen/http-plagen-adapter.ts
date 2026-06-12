import type { IPlagenService } from "./plagen-port";
import type { PlagenResultaat } from "./types";

function bestandNaarBase64(bestand: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip "data:image/...;base64," prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(bestand);
  });
}

export class HttpPlagenAdapter implements IPlagenService {
  async analyseer(afbeelding: File, plantNaam?: string): Promise<PlagenResultaat> {
    const base64 = await bestandNaarBase64(afbeelding);
    const queryId = crypto.randomUUID();

    const res = await fetch("/api/plagen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType: afbeelding.type, plantNaam: plantNaam ?? null, queryId }),
    });

    if (!res.ok) {
      const fout = await res.json().catch(() => ({ fout: `HTTP ${res.status}` })) as { fout?: string };
      throw new Error(fout.fout ?? `Serverfout (${res.status})`);
    }

    return res.json() as Promise<PlagenResultaat>;
  }
}
