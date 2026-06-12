import type { Zone } from "../../domain/tuin/types";
import type { AutoFillResultaat } from "../../domain/plant/types";
import type { TuinOntwerpResultaat } from "./types";

export interface ITuinOntwerpService {
  analyseer(zone: Zone, catalog: Record<string, AutoFillResultaat>, hardheid: number, wens: string): Promise<TuinOntwerpResultaat>;
}
