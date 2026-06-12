import type { IPlantNetService } from "./plantnet-port";
import type { PlantNetResultaat } from "./types";

function bestandNaarBase64(bestand: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip "data:image/jpeg;base64," prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(bestand);
  });
}

export class HttpPlantNetAdapter implements IPlantNetService {
  async identificeer(afbeelding: File): Promise<PlantNetResultaat> {
    const base64 = await bestandNaarBase64(afbeelding);
    const queryId = crypto.randomUUID();

    const res = await fetch("/api/plantnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType: afbeelding.type, queryId }),
    });

    if (!res.ok) {
      const fout = await res.json().catch(() => ({ fout: `HTTP ${res.status}` })) as { fout?: string };
      throw new Error(fout.fout ?? `Serverfout (${res.status})`);
    }

    return res.json() as Promise<PlantNetResultaat>;
  }
}
