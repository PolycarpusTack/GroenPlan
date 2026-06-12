import { describe, it, expect } from "vitest";
import { bepaalTaakType } from "./taakType";

describe("bepaalTaakType", () => {
  it("herkent gangbare taaktypes uit de titel", () => {
    expect(bepaalTaakType("Snoei de rozen")).toBe("snoei");
    expect(bepaalTaakType("Geef water aan jonge planten")).toBe("water");
    expect(bepaalTaakType("Bemest de moestuin")).toBe("voeding");
    expect(bepaalTaakType("Controleer op bladluis")).toBe("controle");
    expect(bepaalTaakType("Oogst de tomaten")).toBe("oogst");
  });

  it("valt terug op overig zonder trefwoord", () => {
    expect(bepaalTaakType("Tuinmeubels schoonmaken")).toBe("overig");
  });
});
