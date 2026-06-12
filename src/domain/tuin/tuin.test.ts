import { describe, it, expect } from "vitest";
import {
  voegZoneToe, verwijderZone, updateZone, plaatsPlant, verwijderPlant, bloeiMaandenVanZone,
  voegBorderToe, hernoemBorder, verwijderBorder, verplaatsNaarBorder, setPlantNotitie,
  setPlantPositie, setPlantGezondheid,
} from "./tuin";
import type { Tuin, PlantPlaatsing } from "./types";

const leegeTuin: Tuin = {
  id: "tuin-1",
  naam: "Achtertuin",
  eigenaarId: "gebruiker-1",
  hardheid: 8,
  zones: [],
  aangemaaktOp: new Date("2026-01-01"),
};

const zoneA = {
  id: "zone-a",
  naam: "Zonnige rand",
  grondsoort: "chalk" as const,
  zon: "full" as const,
  pH: 7.2,
  drainage: "well-drained" as const,
  gemeente: null,
  regenval_mm_7d: null,
  breedte_m: null,
  diepte_m: null,
};

function maakPlaatsing(id: string, borderId: string | null = null): PlantPlaatsing {
  return { id, plantSoortId: `ps-${id}`, wetenschappelijkeNaam: `Plant ${id}`, geplaatst: new Date(), borderId, notitie: null, x_m: null, y_m: null, gezondheid: null };
}

describe("voegZoneToe", () => {
  it("voegt een zone toe met lege plantPlaatsingen en borders", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    expect(tuin.zones[0].plantPlaatsingen).toEqual([]);
    expect(tuin.zones[0].borders).toEqual([]);
  });

  it("gooit een fout bij dubbele zone-id", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    expect(() => voegZoneToe(tuin, zoneA)).toThrow();
  });

  it("muteert de originele tuin niet", () => {
    voegZoneToe(leegeTuin, zoneA);
    expect(leegeTuin.zones).toHaveLength(0);
  });
});

describe("verwijderZone", () => {
  it("verwijdert een bestaande zone", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    expect(verwijderZone(tuin, "zone-a").zones).toHaveLength(0);
  });

  it("gooit een fout bij onbekende zone-id", () => {
    expect(() => verwijderZone(leegeTuin, "bestaat-niet")).toThrow();
  });
});

describe("plaatsPlant + verwijderPlant", () => {
  it("plaatst een plant in een zone", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    const metPlant = plaatsPlant(tuin, "zone-a", maakPlaatsing("p1"));
    expect(metPlant.zones[0].plantPlaatsingen).toHaveLength(1);
  });

  it("plaatst een plant met borderId", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    const metPlant = plaatsPlant(tuin, "zone-a", maakPlaatsing("p1", "border-1"));
    expect(metPlant.zones[0].plantPlaatsingen[0].borderId).toBe("border-1");
  });

  it("verwijdert een plant uit een zone", () => {
    const tuin = plaatsPlant(voegZoneToe(leegeTuin, zoneA), "zone-a", maakPlaatsing("p1"));
    expect(verwijderPlant(tuin, "zone-a", "p1").zones[0].plantPlaatsingen).toHaveLength(0);
  });
});

describe("voegBorderToe", () => {
  it("voegt een border toe aan een zone", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    const metBorder = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Border Noord" });
    expect(metBorder.zones[0].borders).toHaveLength(1);
    expect(metBorder.zones[0].borders[0].naam).toBe("Border Noord");
  });

  it("muteert andere zones niet", () => {
    const tuin = voegZoneToe(voegZoneToe(leegeTuin, zoneA), { ...zoneA, id: "zone-b", naam: "Zone B" });
    const metBorder = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Border" });
    expect(metBorder.zones[1].borders).toHaveLength(0);
  });
});

describe("hernoemBorder", () => {
  it("hernoemt een border", () => {
    let tuin = voegZoneToe(leegeTuin, zoneA);
    tuin = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Oud" });
    const hernoemd = hernoemBorder(tuin, "zone-a", "b1", "Nieuw");
    expect(hernoemd.zones[0].borders[0].naam).toBe("Nieuw");
  });
});

describe("verwijderBorder", () => {
  it("verwijdert de border", () => {
    let tuin = voegZoneToe(leegeTuin, zoneA);
    tuin = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Border" });
    expect(verwijderBorder(tuin, "zone-a", "b1").zones[0].borders).toHaveLength(0);
  });

  it("unassigned planten in de border (borderId → null)", () => {
    let tuin = voegZoneToe(leegeTuin, zoneA);
    tuin = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Border" });
    tuin = plaatsPlant(tuin, "zone-a", maakPlaatsing("p1", "b1"));
    const na = verwijderBorder(tuin, "zone-a", "b1");
    expect(na.zones[0].plantPlaatsingen[0].borderId).toBeNull();
  });
});

describe("verplaatsNaarBorder", () => {
  it("wijst een plant toe aan een border", () => {
    let tuin = voegZoneToe(leegeTuin, zoneA);
    tuin = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Border" });
    tuin = plaatsPlant(tuin, "zone-a", maakPlaatsing("p1", null));
    const na = verplaatsNaarBorder(tuin, "zone-a", "p1", "b1");
    expect(na.zones[0].plantPlaatsingen[0].borderId).toBe("b1");
  });

  it("kan een plant terugzetten naar geen border", () => {
    let tuin = voegZoneToe(leegeTuin, zoneA);
    tuin = voegBorderToe(tuin, "zone-a", { id: "b1", naam: "Border" });
    tuin = plaatsPlant(tuin, "zone-a", maakPlaatsing("p1", "b1"));
    const na = verplaatsNaarBorder(tuin, "zone-a", "p1", null);
    expect(na.zones[0].plantPlaatsingen[0].borderId).toBeNull();
  });
});

describe("bloeiMaandenVanZone", () => {
  it("geeft gecombineerde bloeimaanden van alle planten in een zone", () => {
    const tuin = voegZoneToe(leegeTuin, zoneA);
    const metPlanten = plaatsPlant(
      plaatsPlant(tuin, "zone-a", maakPlaatsing("p1")),
      "zone-a", maakPlaatsing("p2"),
    );
    const bloeiMap = new Map([["ps-p1", [6, 7]], ["ps-p2", [7, 8, 9]]]);
    expect(bloeiMaandenVanZone(metPlanten, "zone-a", bloeiMap)).toEqual([6, 7, 8, 9]);
  });

  it("geeft een lege lijst voor een onbekende zone", () => {
    expect(bloeiMaandenVanZone(leegeTuin, "bestaat-niet", new Map())).toEqual([]);
  });
});

describe("invarianten: commando's falen expliciet bij onbekende doel-id's", () => {
  const tuinMetZone = voegZoneToe(leegeTuin, zoneA);

  it("updateZone gooit bij onbekende zone", () => {
    expect(() => updateZone(leegeTuin, { ...zoneA, id: "bestaat-niet" })).toThrow();
  });

  it("plaatsPlant gooit bij onbekende zone", () => {
    expect(() => plaatsPlant(leegeTuin, "bestaat-niet", maakPlaatsing("p1"))).toThrow();
  });

  it("plaatsPlant gooit bij dubbele plaatsing-id", () => {
    const metPlant = plaatsPlant(tuinMetZone, "zone-a", maakPlaatsing("p1"));
    expect(() => plaatsPlant(metPlant, "zone-a", maakPlaatsing("p1"))).toThrow();
  });

  it("verwijderPlant gooit bij onbekende zone of plant", () => {
    expect(() => verwijderPlant(leegeTuin, "bestaat-niet", "p1")).toThrow();
    expect(() => verwijderPlant(tuinMetZone, "zone-a", "bestaat-niet")).toThrow();
  });

  it("voegBorderToe gooit bij onbekende zone", () => {
    expect(() => voegBorderToe(leegeTuin, "bestaat-niet", { id: "b1", naam: "X" })).toThrow();
  });

  it("hernoemBorder en verwijderBorder gooien bij onbekende border", () => {
    expect(() => hernoemBorder(tuinMetZone, "zone-a", "geen-border", "Nieuw")).toThrow();
    expect(() => verwijderBorder(tuinMetZone, "zone-a", "geen-border")).toThrow();
  });

  it("verplaatsNaarBorder gooit bij onbekende plant of doel-border", () => {
    const metPlant = plaatsPlant(tuinMetZone, "zone-a", maakPlaatsing("p1"));
    expect(() => verplaatsNaarBorder(metPlant, "zone-a", "bestaat-niet", null)).toThrow();
    expect(() => verplaatsNaarBorder(metPlant, "zone-a", "p1", "geen-border")).toThrow();
  });

  it("setPlantNotitie gooit bij onbekende plant", () => {
    expect(() => setPlantNotitie(tuinMetZone, "zone-a", "bestaat-niet", "test")).toThrow();
  });
});

describe("setPlantPositie", () => {
  const tuinMetPlant = plaatsPlant(voegZoneToe(leegeTuin, zoneA), "zone-a", maakPlaatsing("p1"));

  it("zet x_m/y_m op de plaatsing", () => {
    const t = setPlantPositie(tuinMetPlant, "zone-a", "p1", 2.5, 1.25);
    const p = t.zones[0].plantPlaatsingen[0];
    expect(p.x_m).toBe(2.5);
    expect(p.y_m).toBe(1.25);
  });

  it("kan de positie terug wissen met null/null", () => {
    const geplaatst = setPlantPositie(tuinMetPlant, "zone-a", "p1", 2, 2);
    const gewist = setPlantPositie(geplaatst, "zone-a", "p1", null, null);
    expect(gewist.zones[0].plantPlaatsingen[0].x_m).toBeNull();
    expect(gewist.zones[0].plantPlaatsingen[0].y_m).toBeNull();
  });

  it("gooit bij half-ingevulde of negatieve coördinaten", () => {
    expect(() => setPlantPositie(tuinMetPlant, "zone-a", "p1", 2, null)).toThrow();
    expect(() => setPlantPositie(tuinMetPlant, "zone-a", "p1", -1, 0)).toThrow();
  });

  it("gooit bij onbekende zone of plant", () => {
    expect(() => setPlantPositie(tuinMetPlant, "bestaat-niet", "p1", 1, 1)).toThrow();
    expect(() => setPlantPositie(tuinMetPlant, "zone-a", "bestaat-niet", 1, 1)).toThrow();
  });
});

describe("setPlantGezondheid", () => {
  const tuinMetPlant = plaatsPlant(voegZoneToe(leegeTuin, zoneA), "zone-a", maakPlaatsing("p1"));

  it("zet en wist de gezondheid", () => {
    const ziek = setPlantGezondheid(tuinMetPlant, "zone-a", "p1", "zorgwekkend");
    expect(ziek.zones[0].plantPlaatsingen[0].gezondheid).toBe("zorgwekkend");
    const gewist = setPlantGezondheid(ziek, "zone-a", "p1", null);
    expect(gewist.zones[0].plantPlaatsingen[0].gezondheid).toBeNull();
  });

  it("gooit bij onbekende plant", () => {
    expect(() => setPlantGezondheid(tuinMetPlant, "zone-a", "bestaat-niet", "gezond")).toThrow();
  });
});
