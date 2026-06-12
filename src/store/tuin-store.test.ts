import { describe, it, expect, beforeEach } from "vitest";
import { useTuinStore, selectActieveZone } from "./tuin-store";
import type { Zone } from "../domain/tuin/types";
import { lavendel } from "../domain/plant/fixtures";

const zoneA: Omit<Zone, "plantPlaatsingen"> = {
  id: "zone-a",
  naam: "Zonnige rand",
  grondsoort: "chalk",
  zon: "full",
  pH: 7.2,
  drainage: "well-drained",
  gemeente: null,
  regenval_mm_7d: null,
  breedte_m: null,
  diepte_m: null,
  borders: [],
};

const zoneB: Omit<Zone, "plantPlaatsingen"> = {
  id: "zone-b",
  naam: "Schaduwhoek",
  grondsoort: "loam",
  zon: "shade",
  pH: 6.0,
  drainage: "moist",
  gemeente: null,
  regenval_mm_7d: null,
  breedte_m: null,
  diepte_m: null,
  borders: [],
};

beforeEach(() => {
  // Reset store naar begintoestand vóór elke test
  useTuinStore.setState({
    tuin: {
      id: "tuin-hoofd",
      naam: "Mijn tuin",
      eigenaarId: "gebruiker-1",
      hardheid: 8,
      zones: [],
      aangemaaktOp: new Date(),
    },
    actieveZoneId: null,
  });
});

describe("voegZoneToe", () => {
  it("voegt een zone toe aan de tuin", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    expect(useTuinStore.getState().tuin.zones).toHaveLength(1);
    expect(useTuinStore.getState().tuin.zones[0].id).toBe("zone-a");
  });

  it("zet de actieve zone op de eerste toegevoegde zone", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    expect(useTuinStore.getState().actieveZoneId).toBe("zone-a");
  });

  it("behoudt de actieve zone als er al een actieve is", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegZoneToe(zoneB);
    expect(useTuinStore.getState().actieveZoneId).toBe("zone-a");
  });
});

describe("verwijderZone", () => {
  it("verwijdert een bestaande zone", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().verwijderZone("zone-a");
    expect(useTuinStore.getState().tuin.zones).toHaveLength(0);
  });

  it("wist de actieve zone als die verwijderd wordt", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().verwijderZone("zone-a");
    expect(useTuinStore.getState().actieveZoneId).toBeNull();
  });

  it("behoudt de actieve zone als een andere zone verwijderd wordt", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegZoneToe(zoneB);
    useTuinStore.getState().setActieveZone("zone-a");
    useTuinStore.getState().verwijderZone("zone-b");
    expect(useTuinStore.getState().actieveZoneId).toBe("zone-a");
  });
});

describe("setActieveZone", () => {
  it("selecteert een zone", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegZoneToe(zoneB);
    useTuinStore.getState().setActieveZone("zone-b");
    expect(useTuinStore.getState().actieveZoneId).toBe("zone-b");
  });
});

describe("selectActieveZone", () => {
  it("geeft null terug als er geen actieve zone is", () => {
    expect(selectActieveZone(useTuinStore.getState())).toBeNull();
  });

  it("geeft de actieve zone terug", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    const zone = selectActieveZone(useTuinStore.getState());
    expect(zone?.id).toBe("zone-a");
    expect(zone?.naam).toBe("Zonnige rand");
  });
});

describe("hernoem", () => {
  it("hernoemt de tuin", () => {
    useTuinStore.getState().hernoem("Achtertuin");
    expect(useTuinStore.getState().tuin.naam).toBe("Achtertuin");
  });
});

describe("voegPlantToeAanZone", () => {
  it("voegt een plant toe aan een zone", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);

    const zone = useTuinStore.getState().tuin.zones[0];
    expect(zone.plantPlaatsingen).toHaveLength(1);
    expect(zone.plantPlaatsingen[0].wetenschappelijkeNaam).toBe("Lavandula angustifolia");
    expect(zone.plantPlaatsingen[0].geplaatst).toBeInstanceOf(Date);
  });

  it("slaat de plantdata op in plantCatalog", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);

    const catalog = useTuinStore.getState().plantCatalog;
    expect(catalog["lavandula angustifolia"]).toBeDefined();
    expect(catalog["lavandula angustifolia"].zekerheid.algemeen).toBe(0.92);
  });

  it("dezelfde plant kan meerdere keren geplaatst worden (verschillende plaatsingId)", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);

    const zone = useTuinStore.getState().tuin.zones[0];
    expect(zone.plantPlaatsingen).toHaveLength(2);
    expect(zone.plantPlaatsingen[0].id).not.toBe(zone.plantPlaatsingen[1].id);
  });

  it("voegt plant toe aan de juiste zone", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegZoneToe(zoneB);
    useTuinStore.getState().voegPlantToeAanZone("zone-b", lavendel);

    expect(useTuinStore.getState().tuin.zones[0].plantPlaatsingen).toHaveLength(0);
    expect(useTuinStore.getState().tuin.zones[1].plantPlaatsingen).toHaveLength(1);
  });
});

describe("verwijderPlantUitZone", () => {
  it("verwijdert een plant uit de zone", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);

    const plaatsingId = useTuinStore.getState().tuin.zones[0].plantPlaatsingen[0].id;
    useTuinStore.getState().verwijderPlantUitZone("zone-a", plaatsingId);

    expect(useTuinStore.getState().tuin.zones[0].plantPlaatsingen).toHaveLength(0);
  });

  it("verwijdert alleen de juiste plaatsing bij meerdere planten", () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);
    useTuinStore.getState().voegPlantToeAanZone("zone-a", lavendel);

    const plaatsingen = useTuinStore.getState().tuin.zones[0].plantPlaatsingen;
    useTuinStore.getState().verwijderPlantUitZone("zone-a", plaatsingen[0].id);

    expect(useTuinStore.getState().tuin.zones[0].plantPlaatsingen).toHaveLength(1);
    expect(useTuinStore.getState().tuin.zones[0].plantPlaatsingen[0].id).toBe(plaatsingen[1].id);
  });
});
