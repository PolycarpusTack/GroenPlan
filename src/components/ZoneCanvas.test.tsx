import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ZoneCanvas } from "./ZoneCanvas";
import type { PlantPlaatsing } from "../domain/tuin/types";
import type { AutoFillResultaat } from "../domain/plant/types";

function maakPlant(naam: string, breedteCm: number | null): AutoFillResultaat {
  return {
    identificatie: {
      wetenschappelijkeNaam: naam,
      soort: naam,
      cultivar: null,
      gewoneNamen: { nl: naam, en: null, fr: null },
      familie: "Testaceae",
      type: "perennial",
    },
    groei: {
      volwassenHoogte_cm: { waarde: null, bron: "unknown" },
      volwassenBreedte_cm: { waarde: breedteCm !== null ? { min: breedteCm, max: breedteCm } : null, bron: breedteCm !== null ? "ai" : "unknown" },
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

function maakPlaatsing(id: string, naam: string, x_m: number | null = null, y_m: number | null = null, gezondheid: PlantPlaatsing["gezondheid"] = null): PlantPlaatsing {
  return {
    id, plantSoortId: `ps-${id}`, wetenschappelijkeNaam: naam,
    geplaatst: new Date("2026-01-01"), borderId: null, notitie: null,
    x_m, y_m, gezondheid,
  };
}

const catalog = {
  "lavandula angustifolia": maakPlant("Lavandula angustifolia", 60),
  "salvia nemorosa": maakPlant("Salvia nemorosa", 40),
};

describe("ZoneCanvas op schaal", () => {
  it("toont de zone-omtrek met meterraster en de overlap-legenda", () => {
    render(
      <ZoneCanvas
        plaatsingen={[maakPlaatsing("p1", "Lavandula angustifolia", 1, 1)]}
        catalog={catalog}
        zoneBreedteM={4}
        zoneDiepteM={2}
      />,
    );
    expect(screen.getByText(/4 × 2 m · raster = 1 m/)).toBeTruthy();
    expect(screen.getByText(/Geen overlap/)).toBeTruthy();
    expect(screen.getByText(/Cirkel = volwassen breedte/)).toBeTruthy();
  });

  it("telt overlappende volwassen-breedte-cirkels in de legenda", () => {
    // Twee planten van 60/40 cm breed op 10 cm van elkaar → te dicht (ernstig).
    render(
      <ZoneCanvas
        plaatsingen={[
          maakPlaatsing("p1", "Lavandula angustifolia", 1, 1),
          maakPlaatsing("p2", "Salvia nemorosa", 1.1, 1),
        ]}
        catalog={catalog}
        zoneBreedteM={4}
        zoneDiepteM={2}
      />,
    );
    expect(screen.getByText(/Te dicht \(1\)/)).toBeTruthy();
    expect(screen.getByText(/Licht \(0\)/)).toBeTruthy();
  });

  it("markeert een zorgwekkende plant met een statusring (title)", () => {
    render(
      <ZoneCanvas
        plaatsingen={[maakPlaatsing("p1", "Lavandula angustifolia", 1, 1, "zorgwekkend")]}
        catalog={catalog}
        zoneBreedteM={4}
        zoneDiepteM={2}
      />,
    );
    expect(screen.getByTitle(/zorgwekkend/)).toBeTruthy();
  });

  it("valt zonder zone-afmetingen terug op de schematische weergave", () => {
    render(
      <ZoneCanvas
        plaatsingen={[maakPlaatsing("p1", "Lavandula angustifolia")]}
        catalog={catalog}
      />,
    );
    expect(screen.queryByText(/raster = 1 m/)).toBeNull();
    expect(screen.getByText("Sleep om te herpositioneren")).toBeTruthy();
  });
});
