import { describe, it, expect } from "vitest";
import { haversineKm, dichtstbijzijndeGemeente } from "./dichtstbijzijndeGemeente";

describe("haversineKm", () => {
  it("is 0 voor identieke punten", () => {
    expect(haversineKm(51, 4, 51, 4)).toBe(0);
  });

  it("benadert de afstand Gent–Brussel (~50 km)", () => {
    const d = haversineKm(51.0543, 3.7174, 50.8503, 4.3517);
    expect(d).toBeGreaterThan(40);
    expect(d).toBeLessThan(60);
  });
});

describe("dichtstbijzijndeGemeente", () => {
  it("vindt Gent vanuit een nabije coördinaat", () => {
    const { gemeente } = dichtstbijzijndeGemeente(51.05, 3.72);
    expect(gemeente.naam).toBe("Gent");
  });

  it("vindt Antwerpen vanuit een nabije coördinaat", () => {
    const { gemeente } = dichtstbijzijndeGemeente(51.22, 4.40);
    expect(gemeente.naam).toBe("Antwerpen");
  });

  it("geeft een afgeronde afstand terug", () => {
    const { afstandKm } = dichtstbijzijndeGemeente(51.05, 3.72);
    expect(afstandKm).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(afstandKm)).toBe(true);
  });
});
