export type TaakStatus = "open" | "klaar";

// ISO weekday: 0 = Maandag … 6 = Zondag
export type WeekDag = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// Ordinal: 1 = eerste, 2 = tweede, 3 = derde, 4 = vierde, -1 = laatste
export type WeekdagOrdinal = 1 | 2 | 3 | 4 | -1;

export interface MaandRegelDag {
  soort: "dag";
  dagNummer: number; // 1-31
}
export interface MaandRegelWeekdag {
  soort: "weekdag";
  ordinal: WeekdagOrdinal;
  weekdag: WeekDag;
}
export type MaandRegel = MaandRegelDag | MaandRegelWeekdag;

export interface HerhalingDagelijks {
  type: "dagelijks";
  interval: number;       // elke N dagen
  alleenWerkdagen: boolean;
}
export interface HerhalingWekelijks {
  type: "wekelijks";
  interval: number;       // elke N weken
  weekdagen: WeekDag[];   // niet-lege lijst
}
export interface HerhalingMaandelijks {
  type: "maandelijks";
  interval: number;
  regel: MaandRegel;
}
export interface HerhalingJaarlijks {
  type: "jaarlijks";
  interval: number;
  maand: number;          // 1-12
  regel: MaandRegel;
}

export type HerhalingConfig =
  | HerhalingDagelijks
  | HerhalingWekelijks
  | HerhalingMaandelijks
  | HerhalingJaarlijks;

export interface Taak {
  id: string;
  titel: string;
  zoneId: string | null;
  vervaldatum: string | null; // YYYY-MM-DD
  status: TaakStatus;
  aangemaakt: Date;
  herhaling: HerhalingConfig | null;
  /** YYYY-MM-DD waarop de taak werd afgevinkt; optioneel voor backwards-compat. */
  voltooidOp?: string | null;
}
