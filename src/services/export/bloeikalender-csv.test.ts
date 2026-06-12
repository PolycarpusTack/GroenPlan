import { describe, it, expect } from "vitest";
import { bloeiKalenderCsv } from "./bloeikalender-csv";

describe("bloeiKalenderCsv", () => {
  it("bouwt puntkomma-CSV met BOM, kopregel en gesorteerde maanden", () => {
    const csv = bloeiKalenderCsv([
      {
        wetNaam: "Lavandula angustifolia",
        gewoneNaam: 'Echte "lavendel"',
        zoneNamen: ["Achterborder", "Voortuin"],
        bloeiMaanden: new Set([8, 6, 7]),
      },
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [kop, rij] = csv.slice(1).split("\r\n");
    expect(kop).toBe('"Wetenschappelijke naam";"Gewone naam";"Zones";"Bloeimaanden"');
    expect(rij).toBe('"Lavandula angustifolia";"Echte ""lavendel""";"Achterborder, Voortuin";"jun, jul, aug"');
  });

  it("geeft alleen de kopregel bij nul rijen", () => {
    const csv = bloeiKalenderCsv([]);
    expect(csv.slice(1).split("\r\n")).toHaveLength(1);
  });
});
