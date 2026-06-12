// Pure domeinlogica voor de zaadbank — geen I/O, volledig testbaar zonder mocks.
import type { Zaad } from "./types";

export const MAAND_KORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

// Is dit zaad zaaibaar in de gegeven maand (1–12)? Ondersteunt vensters die over
// de jaarwisseling lopen (bv. nov–feb).
export function isZaaibaarInMaand(zaad: Zaad, maand: number): boolean {
  const { zaaiVan, zaaiTot } = zaad;
  if (zaaiVan == null || zaaiTot == null) return false;
  if (zaaiVan <= zaaiTot) return maand >= zaaiVan && maand <= zaaiTot;
  return maand >= zaaiVan || maand <= zaaiTot; // wrap-around
}

// Houdbaarheid verlopen t.o.v. een referentiedatum (YYYY-MM-DD of YYYY-MM).
export function isVerlopen(zaad: Zaad, refISO: string): boolean {
  if (!zaad.houdbaarTot) return false;
  return zaad.houdbaarTot < refISO.slice(0, 7);
}

// Verloopt binnen `maanden` maanden (en is nog niet verlopen).
export function isBijnaVerlopen(zaad: Zaad, refISO: string, maanden = 2): boolean {
  if (!zaad.houdbaarTot) return false;
  const [hj, hm] = zaad.houdbaarTot.split("-").map(Number);
  const [rj, rm] = refISO.slice(0, 7).split("-").map(Number);
  const verschil = (hj - rj) * 12 + (hm - rm);
  return verschil >= 0 && verschil <= maanden;
}

// Leesbaar label voor het zaaivenster, bv. "mrt–mei". Null als onbekend.
export function zaaivensterLabel(zaad: Zaad): string | null {
  if (zaad.zaaiVan == null || zaad.zaaiTot == null) return null;
  return `${MAAND_KORT[zaad.zaaiVan - 1]}–${MAAND_KORT[zaad.zaaiTot - 1]}`;
}
