export interface PlantNetSuggestie {
  wetenschappelijkeNaam: string;
  zekerheid: number; // 0–1
  gewoneNaam: string | null;
  familie: string | null;
}

export interface PlantNetResultaat {
  suggesties: PlantNetSuggestie[];
  queryId: string;
  // "online" = echte PlantNet-API via backend, "lokaal" = demo-reserve
  // (geen backend/API-sleutel of geen netwerk).
  bron?: "online" | "lokaal";
}
