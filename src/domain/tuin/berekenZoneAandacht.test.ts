import { describe, it, expect } from "vitest";
import { berekenZoneAandacht } from "./berekenZoneAandacht";
import type { Zone } from "./types";
import type { Taak } from "../taken/types";

function maakZone(id: string, regenval: number | null): Zone {
  return {
    id, naam: id, grondsoort: "loam", zon: "full", pH: null, drainage: "well-drained",
    gemeente: null, regenval_mm_7d: regenval, breedte_m: null, diepte_m: null,
    borders: [], plantPlaatsingen: [],
  };
}

function maakTaak(zoneId: string | null, vervaldatum: string | null, status: Taak["status"] = "open"): Taak {
  return {
    id: crypto.randomUUID(), titel: "Test", zoneId, vervaldatum, status,
    aangemaakt: new Date("2026-01-01"), herhaling: null,
  };
}

describe("berekenZoneAandacht", () => {
  const VANDAAG = "2026-06-12";

  it("meldt droogte onder de grens en telt achterstallige taken", () => {
    const droog = maakZone("droog", 2);
    const aandacht = berekenZoneAandacht(
      [droog],
      [maakTaak("droog", "2026-06-01"), maakTaak("droog", "2026-06-05")],
      VANDAAG,
    );
    expect(aandacht["droog"]).toHaveLength(2);
    expect(aandacht["droog"][0]).toMatch(/Droogte: 2 mm/);
    expect(aandacht["droog"][1]).toMatch(/2 achterstallige taken/);
  });

  it("negeert natte zones, voltooide en toekomstige taken", () => {
    const nat = maakZone("nat", 25);
    const aandacht = berekenZoneAandacht(
      [nat],
      [maakTaak("nat", "2026-06-01", "klaar"), maakTaak("nat", "2026-07-01")],
      VANDAAG,
    );
    expect(aandacht["nat"]).toBeUndefined();
  });

  it("meldt niets bij onbekende neerslag (null)", () => {
    const onbekend = maakZone("onbekend", null);
    expect(berekenZoneAandacht([onbekend], [], VANDAAG)["onbekend"]).toBeUndefined();
  });
});
