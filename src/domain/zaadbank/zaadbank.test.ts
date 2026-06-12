import { describe, it, expect } from "vitest";
import { isZaaibaarInMaand, isVerlopen, isBijnaVerlopen, zaaivensterLabel } from "./zaadbank";
import type { Zaad } from "./types";

function maakZaad(overrides: Partial<Zaad> = {}): Zaad {
  return {
    id: "z1",
    naam: "Tomaat",
    wetenschappelijkeNaam: null,
    leverancier: null,
    aantal: null,
    houdbaarTot: null,
    zaaiVan: null,
    zaaiTot: null,
    status: "voorraad",
    notitie: null,
    aangemaakt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("isZaaibaarInMaand", () => {
  it("is false zonder zaaivenster", () => {
    expect(isZaaibaarInMaand(maakZaad(), 4)).toBe(false);
  });

  it("herkent een normaal venster (mrt–mei)", () => {
    const z = maakZaad({ zaaiVan: 3, zaaiTot: 5 });
    expect(isZaaibaarInMaand(z, 2)).toBe(false);
    expect(isZaaibaarInMaand(z, 3)).toBe(true);
    expect(isZaaibaarInMaand(z, 5)).toBe(true);
    expect(isZaaibaarInMaand(z, 6)).toBe(false);
  });

  it("herkent een venster over de jaarwisseling (nov–feb)", () => {
    const z = maakZaad({ zaaiVan: 11, zaaiTot: 2 });
    expect(isZaaibaarInMaand(z, 12)).toBe(true);
    expect(isZaaibaarInMaand(z, 1)).toBe(true);
    expect(isZaaibaarInMaand(z, 2)).toBe(true);
    expect(isZaaibaarInMaand(z, 3)).toBe(false);
    expect(isZaaibaarInMaand(z, 10)).toBe(false);
  });
});

describe("isVerlopen", () => {
  it("is false zonder houdbaarheidsdatum", () => {
    expect(isVerlopen(maakZaad(), "2026-05-31")).toBe(false);
  });

  it("vergelijkt op jaar-maand", () => {
    expect(isVerlopen(maakZaad({ houdbaarTot: "2026-04" }), "2026-05-31")).toBe(true);
    expect(isVerlopen(maakZaad({ houdbaarTot: "2026-05" }), "2026-05-31")).toBe(false);
    expect(isVerlopen(maakZaad({ houdbaarTot: "2026-06" }), "2026-05-31")).toBe(false);
  });
});

describe("isBijnaVerlopen", () => {
  it("is true binnen 2 maanden, false daarbuiten of indien verlopen", () => {
    expect(isBijnaVerlopen(maakZaad({ houdbaarTot: "2026-07" }), "2026-05-31")).toBe(true);
    expect(isBijnaVerlopen(maakZaad({ houdbaarTot: "2026-05" }), "2026-05-31")).toBe(true);
    expect(isBijnaVerlopen(maakZaad({ houdbaarTot: "2026-08" }), "2026-05-31")).toBe(false);
    expect(isBijnaVerlopen(maakZaad({ houdbaarTot: "2026-04" }), "2026-05-31")).toBe(false);
  });
});

describe("zaaivensterLabel", () => {
  it("geeft null zonder venster", () => {
    expect(zaaivensterLabel(maakZaad())).toBeNull();
  });

  it("formatteert het venster met korte maandnamen", () => {
    expect(zaaivensterLabel(maakZaad({ zaaiVan: 3, zaaiTot: 5 }))).toBe("mrt–mei");
    expect(zaaivensterLabel(maakZaad({ zaaiVan: 11, zaaiTot: 2 }))).toBe("nov–feb");
  });
});
