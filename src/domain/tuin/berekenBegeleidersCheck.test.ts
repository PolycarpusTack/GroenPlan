import { describe, it, expect } from "vitest";
import { berekenBegeleidersCheck } from "./berekenBegeleidersCheck";
import type { PlantPlaatsing } from "./types";
import type { AutoFillResultaat } from "../plant/types";

function maakPlaatsing(naam: string): PlantPlaatsing {
  return { id: naam, plantSoortId: `ps-${naam}`, wetenschappelijkeNaam: naam, geplaatst: new Date("2026-01-01"), borderId: null, notitie: null };
}

function maakPlant(
  naam: string,
  goed: string[] = [],
  slecht: string[] = [],
): AutoFillResultaat {
  return {
    identificatie: {
      wetenschappelijkeNaam: naam,
      soort: naam,
      cultivar: null,
      gewoneNamen: { nl: null, en: null, fr: null },
      familie: "Testaceae",
      type: "perennial",
    },
    groei: {
      volwassenHoogte_cm: { waarde: null, bron: "unknown" },
      volwassenBreedte_cm: { waarde: null, bron: "unknown" },
      plantafstand_cm: { waarde: null, bron: "unknown" },
      groeisnelheid: { waarde: null, bron: "unknown" },
    },
    omstandigheden: {
      zon: { waarde: "full", bron: "unknown" },
      grondsoorten: { waarde: [], bron: "unknown" },
      pH: { waarde: null, bron: "unknown" },
      drainage: { waarde: "well-drained", bron: "unknown" },
      waterbehoeften: { waarde: "medium", bron: "unknown" },
      hardheid: { waarde: null, bron: "unknown" },
    },
    bloei: {
      maanden: { waarde: [], bron: "unknown" },
      kleuren: { waarde: [], bron: "unknown" },
      geurig: { waarde: null, bron: "unknown" },
    },
    onderhoud: {
      snoeien: { waarde: null, bron: "unknown" },
      bemesten: { waarde: null, bron: "unknown" },
      overwinteren: { waarde: null, bron: "unknown" },
    },
    ecologie: {
      bestuivers: { waarde: [], bron: "unknown" },
      begeleiders: { waarde: { goed, slecht }, bron: "unknown" },
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

describe("berekenBegeleidersCheck", () => {
  it("geeft lege array bij minder dan 2 planten", () => {
    const catalog = { "rosa canina": maakPlant("Rosa canina") };
    expect(berekenBegeleidersCheck([maakPlaatsing("Rosa canina")], catalog)).toHaveLength(0);
  });

  it("geeft lege array als er geen begeleiderdata is", () => {
    const catalog = {
      "rosa canina": maakPlant("Rosa canina"),
      "lavandula angustifolia": maakPlant("Lavandula angustifolia"),
    };
    const plaatsingen = [maakPlaatsing("Rosa canina"), maakPlaatsing("Lavandula angustifolia")];
    expect(berekenBegeleidersCheck(plaatsingen, catalog)).toHaveLength(0);
  });

  it("detecteert een goede combinatie via plant A", () => {
    const catalog = {
      "rosa canina": maakPlant("Rosa canina", ["Lavandula angustifolia"], []),
      "lavandula angustifolia": maakPlant("Lavandula angustifolia"),
    };
    const plaatsingen = [maakPlaatsing("Rosa canina"), maakPlaatsing("Lavandula angustifolia")];
    const resultaten = berekenBegeleidersCheck(plaatsingen, catalog);

    expect(resultaten).toHaveLength(1);
    expect(resultaten[0].relatie).toBe("goed");
  });

  it("detecteert een goede combinatie via plant B (wederkerig)", () => {
    const catalog = {
      "rosa canina": maakPlant("Rosa canina"),
      "lavandula angustifolia": maakPlant("Lavandula angustifolia", ["Rosa canina"], []),
    };
    const plaatsingen = [maakPlaatsing("Rosa canina"), maakPlaatsing("Lavandula angustifolia")];
    const resultaten = berekenBegeleidersCheck(plaatsingen, catalog);

    expect(resultaten).toHaveLength(1);
    expect(resultaten[0].relatie).toBe("goed");
  });

  it("detecteert een slechte combinatie", () => {
    const catalog = {
      "allium ursinum": maakPlant("Allium ursinum", [], ["Rosa canina"]),
      "rosa canina": maakPlant("Rosa canina"),
    };
    const plaatsingen = [maakPlaatsing("Allium ursinum"), maakPlaatsing("Rosa canina")];
    const resultaten = berekenBegeleidersCheck(plaatsingen, catalog);

    expect(resultaten).toHaveLength(1);
    expect(resultaten[0].relatie).toBe("slecht");
  });

  it("slecht wint boven goed bij conflicterende signalen", () => {
    const catalog = {
      "plant-a": maakPlant("Plant-A", ["Plant-B"], []),
      "plant-b": maakPlant("Plant-B", [], ["Plant-A"]),
    };
    const plaatsingen = [maakPlaatsing("Plant-A"), maakPlaatsing("Plant-B")];
    const resultaten = berekenBegeleidersCheck(plaatsingen, catalog);

    expect(resultaten).toHaveLength(1);
    expect(resultaten[0].relatie).toBe("slecht");
  });

  it("sorteert slechte combinaties voor goede", () => {
    const catalog = {
      "plant-a": maakPlant("Plant-A", ["Plant-B"], ["Plant-C"]),
      "plant-b": maakPlant("Plant-B"),
      "plant-c": maakPlant("Plant-C"),
    };
    const plaatsingen = [
      maakPlaatsing("Plant-A"),
      maakPlaatsing("Plant-B"),
      maakPlaatsing("Plant-C"),
    ];
    const resultaten = berekenBegeleidersCheck(plaatsingen, catalog);

    expect(resultaten[0].relatie).toBe("slecht");
    expect(resultaten[1].relatie).toBe("goed");
  });

  it("is niet hoofdlettergevoelig bij naamvergelijking", () => {
    const catalog = {
      "rosa canina": maakPlant("Rosa canina", ["LAVANDULA ANGUSTIFOLIA"], []),
      "lavandula angustifolia": maakPlant("Lavandula angustifolia"),
    };
    const plaatsingen = [maakPlaatsing("Rosa canina"), maakPlaatsing("Lavandula angustifolia")];
    const resultaten = berekenBegeleidersCheck(plaatsingen, catalog);

    expect(resultaten).toHaveLength(1);
    expect(resultaten[0].relatie).toBe("goed");
  });
});
