export type ObservatieType =
  | "bloei"
  | "groei"
  | "plaag"
  | "ziekte"
  | "snoei"
  | "bemesting"
  | "overwintering"
  | "overig";

export interface Observatie {
  id: string;
  datum: string; // ISO-datumstring YYYY-MM-DD
  type: ObservatieType;
  tekst: string;
  zoneId: string | null;
  wetenschappelijkeNaam: string | null; // gekoppeld aan plant
  afbeeldingUrl: string | null;
  aangemaakt: Date;
}
