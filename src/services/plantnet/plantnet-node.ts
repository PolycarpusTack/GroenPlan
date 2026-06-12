// SERVER-SIDE ONLY — only imported dynamically by the Vite middleware
import type { PlantNetResultaat, PlantNetSuggestie } from "./types";

interface PlantNetApiResponse {
  results: Array<{
    score: number;
    species: {
      scientificNameWithoutAuthor: string;
      commonNames: string[];
      family?: { scientificName: string };
    };
  }>;
}

export async function identificeerPlant(
  base64: string,
  mimeType: string,
  queryId: string,
): Promise<PlantNetResultaat> {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) throw new Error("PLANTNET_API_KEY is niet ingesteld in de omgevingsvariabelen.");

  const buffer = Buffer.from(base64, "base64");
  const formData = new FormData();
  formData.append("images", new Blob([buffer], { type: mimeType }), "plant.jpg");
  formData.append("organs", "auto");

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=nl&include-related-images=false&nb-results=5`;
  const res = await fetch(url, { method: "POST", body: formData });

  // 404 = geen overeenkomst gevonden in PlantNet-database
  if (res.status === 404) return { suggesties: [], queryId };

  if (!res.ok) throw new Error(`PlantNet API fout: HTTP ${res.status}`);

  const data = await res.json() as PlantNetApiResponse;
  const suggesties: PlantNetSuggestie[] = data.results.slice(0, 5).map((r) => ({
    wetenschappelijkeNaam: r.species.scientificNameWithoutAuthor,
    zekerheid: r.score,
    gewoneNaam: r.species.commonNames[0] ?? null,
    familie: r.species.family?.scientificName ?? null,
  }));

  return { suggesties, queryId };
}
