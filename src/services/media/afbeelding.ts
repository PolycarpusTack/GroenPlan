// Gedeelde validatie + meldingen voor foto-uploads (PlantNet-identificatie,
// plagen-analyse). Begrenst de beeldgrootte (kosten/DoS) en informeert de
// gebruiker dat foto's naar externe diensten gaan — zie STRIDE-plagen.md.

export const MAX_AFBEELDING_MB = 8;
export const MAX_AFBEELDING_BYTES = MAX_AFBEELDING_MB * 1024 * 1024;

// Geeft een foutmelding (NL) terug, of null als de afbeelding bruikbaar is.
export function valideerAfbeelding(bestand: File): string | null {
  if (!bestand.type.startsWith("image/")) {
    return "Kies een afbeeldingsbestand (JPG, PNG, WebP).";
  }
  if (bestand.size > MAX_AFBEELDING_BYTES) {
    const mb = (bestand.size / (1024 * 1024)).toFixed(1);
    return `Afbeelding te groot (${mb} MB). Maximaal ${MAX_AFBEELDING_MB} MB.`;
  }
  return null;
}

export const BEELD_PRIVACY_NOTE =
  "Foto's worden voor herkenning en analyse naar externe diensten (PlantNet, Anthropic) verzonden.";
