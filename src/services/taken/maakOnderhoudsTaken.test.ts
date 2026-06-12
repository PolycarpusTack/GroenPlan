import { describe, it, expect } from "vitest";
import { maakOnderhoudsTaken } from "./maakOnderhoudsTaken";
import type { AutoFillResultaat } from "../../domain/plant/types";

function maakPlant(overrides: {
  naam?: string;
  snoeien?: { wanneer: string; hoe: string } | null;
  bemesten?: string | null;
  overwinteren?: string | null;
}): AutoFillResultaat {
  return {
    identificatie: {
      wetenschappelijkeNaam: "Lavandula angustifolia",
      soort: "angustifolia",
      cultivar: null,
      gewoneNamen: { nl: overrides.naam ?? "Lavendel", en: "Lavender", fr: "Lavande" },
      familie: "Lamiaceae",
      type: "perennial",
    },
    groei: {
      volwassenHoogte_cm: { waarde: null, bron: "unknown" },
      volwassenBreedte_cm: { waarde: null, bron: "unknown" },
      plantafstand_cm: { waarde: null, bron: "unknown" },
      groeisnelheid: { waarde: null, bron: "unknown" },
    },
    omstandigheden: {
      zon: { waarde: "full", bron: "RHS" },
      grondsoorten: { waarde: ["sand"], bron: "RHS" },
      pH: { waarde: null, bron: "unknown" },
      drainage: { waarde: "well-drained", bron: "RHS" },
      waterbehoeften: { waarde: "low", bron: "RHS" },
      hardheid: { waarde: null, bron: "unknown" },
    },
    bloei: {
      maanden: { waarde: [6, 7, 8], bron: "RHS" },
      kleuren: { waarde: ["purple"], bron: "RHS" },
      geurig: { waarde: true, bron: "RHS" },
    },
    onderhoud: {
      snoeien: { waarde: overrides.snoeien ?? null, bron: "RHS" },
      bemesten: { waarde: overrides.bemesten ?? null, bron: "RHS" },
      overwinteren: { waarde: overrides.overwinteren ?? null, bron: "RHS" },
    },
    ecologie: {
      bestuivers: { waarde: ["bees"], bron: "RHS" },
      begeleiders: { waarde: { goed: [], slecht: [] }, bron: "unknown" },
      plagen: { waarde: [], bron: "unknown" },
      ziekten: { waarde: [], bron: "unknown" },
      inheems_belgie: { waarde: null, bron: "unknown" },
      invasief_belgie: { waarde: null, bron: "unknown" },
    },
    veiligheid: {
      giftig_huisdieren: { waarde: null, bron: "unknown" },
      giftig_mensen: { waarde: null, bron: "unknown" },
      eetbare_delen: { waarde: [], bron: "unknown" },
    },
    notities: "",
    zekerheid: { algemeen: 0.9, notities: "" },
  };
}

describe("maakOnderhoudsTaken", () => {
  it("geeft lege array als er geen onderhoudsvelden zijn", () => {
    const plant = maakPlant({});
    const taken = maakOnderhoudsTaken(plant, "zone-1");
    expect(taken).toHaveLength(0);
  });

  it("maakt een snoeitaak met wanneer en hoe", () => {
    const plant = maakPlant({ snoeien: { wanneer: "augustus", hoe: "na de bloei terugsnoeien" } });
    const taken = maakOnderhoudsTaken(plant, "zone-1");

    expect(taken).toHaveLength(1);
    expect(taken[0].titel).toBe("Lavendel snoeien (augustus) — na de bloei terugsnoeien");
    expect(taken[0].zoneId).toBe("zone-1");
    expect(taken[0].vervaldatum).toBeNull();
  });

  it("maakt een bemestingstaak", () => {
    const plant = maakPlant({ bemesten: "Weinig of geen meststof nodig" });
    const taken = maakOnderhoudsTaken(plant, "zone-2");

    expect(taken).toHaveLength(1);
    expect(taken[0].titel).toBe("Lavendel bemesten — Weinig of geen meststof nodig");
    expect(taken[0].zoneId).toBe("zone-2");
  });

  it("maakt een overwinteringstaak", () => {
    const plant = maakPlant({ overwinteren: "Bescherm met mulch bij vorst" });
    const taken = maakOnderhoudsTaken(plant, "zone-3");

    expect(taken).toHaveLength(1);
    expect(taken[0].titel).toContain("overwinteren");
  });

  it("maakt alle drie taken als alle onderhoudsvelden aanwezig zijn", () => {
    const plant = maakPlant({
      snoeien: { wanneer: "lente", hoe: "licht terugsnoeien" },
      bemesten: "Matige bemesting in april",
      overwinteren: "Niet nodig bij ons klimaat",
    });
    const taken = maakOnderhoudsTaken(plant, "zone-1");

    expect(taken).toHaveLength(3);
    const titels = taken.map((t) => t.titel);
    expect(titels.some((t) => t.includes("snoeien"))).toBe(true);
    expect(titels.some((t) => t.includes("bemesten"))).toBe(true);
    expect(titels.some((t) => t.includes("overwinteren"))).toBe(true);
  });

  it("gebruikt wetenschappelijke naam als er geen NL gewone naam is", () => {
    const plant = maakPlant({ naam: null as unknown as string, snoeien: { wanneer: "herfst", hoe: "sterk terugsnoeien" } });
    // Override gewoneNamen.nl op null
    plant.identificatie.gewoneNamen.nl = null;
    const taken = maakOnderhoudsTaken(plant, "zone-1");

    expect(taken[0].titel).toContain("Lavandula angustifolia");
  });

  it("koppelt alle taken aan de opgegeven zoneId", () => {
    const plant = maakPlant({
      snoeien: { wanneer: "augustus", hoe: "terugsnoeien" },
      bemesten: "In het voorjaar",
    });
    const taken = maakOnderhoudsTaken(plant, "mijn-zone-id");

    expect(taken.every((t) => t.zoneId === "mijn-zone-id")).toBe(true);
  });

  it("geeft onderhoudstaken geen herhaling (gebruiker stelt die handmatig in)", () => {
    const plant = maakPlant({ snoeien: { wanneer: "augustus", hoe: "terugsnoeien" } });
    const taken = maakOnderhoudsTaken(plant, "zone-1");

    expect(taken[0].herhaling).toBeNull();
  });
});
