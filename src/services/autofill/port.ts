// Port interface — domein weet niets van Claude, SQLite, of andere infrastructuur
import type { AutoFillResultaat } from "../../domain/plant/types";

export interface AutoFillOpties {
  taal?: "nl" | "en" | "fr";
  regio?: string;
  fotoHint?: string;
}

export interface AutoFillPort {
  vulAan(wetenschappelijkeNaam: string, opties?: AutoFillOpties): Promise<AutoFillResultaat>;
}

export interface CachePort {
  // verwachteVersie: indien meegegeven wordt een entry met afwijkende bron-versie
  // (nieuw model/prompt) als verlopen behandeld en geïnvalideerd (spec §6).
  haalOp(sleutel: string, verwachteVersie?: string): AutoFillResultaat | null;
  slaOp(sleutel: string, resultaat: AutoFillResultaat, versie: string): void;
}
