import { describe, it, expect } from "vitest";
import { isVeldMetBron, isAutoFillResultaat, heeftOnbekendeVelden } from "./guards";
import { lavendel, onbekendePlant } from "./fixtures";

describe("isVeldMetBron", () => {
  it("herkent een geldig veld-met-bron object", () => {
    expect(isVeldMetBron({ waarde: "full", bron: "RHS" })).toBe(true);
  });

  it("verwerpt null", () => {
    expect(isVeldMetBron(null)).toBe(false);
  });

  it("verwerpt object zonder bron", () => {
    expect(isVeldMetBron({ waarde: "full" })).toBe(false);
  });

  it("verwerpt primitieve waarden", () => {
    expect(isVeldMetBron("full")).toBe(false);
    expect(isVeldMetBron(42)).toBe(false);
  });
});

describe("isAutoFillResultaat", () => {
  it("herkent een volledig lavendel resultaat", () => {
    expect(isAutoFillResultaat(lavendel)).toBe(true);
  });

  it("herkent een onbekende plant als geldig resultaat", () => {
    expect(isAutoFillResultaat(onbekendePlant)).toBe(true);
  });

  it("verwerpt null", () => {
    expect(isAutoFillResultaat(null)).toBe(false);
  });

  it("verwerpt een incompleet object zonder omstandigheden", () => {
    const incompleet = { identificatie: {}, groei: {} };
    expect(isAutoFillResultaat(incompleet)).toBe(false);
  });
});

describe("heeftOnbekendeVelden", () => {
  it("geeft een lege lijst voor lavendel (alles bekend)", () => {
    const onbekend = heeftOnbekendeVelden(lavendel);
    expect(onbekend).toEqual([]);
  });

  it("detecteert alle ontbrekende velden bij onbekende plant", () => {
    const onbekend = heeftOnbekendeVelden(onbekendePlant);
    expect(onbekend).toContain("zon");
    expect(onbekend).toContain("drainage");
    expect(onbekend).toContain("waterbehoeften");
    expect(onbekend).toContain("pH");
    expect(onbekend).toContain("hardheid");
    expect(onbekend).toContain("grondsoorten");
  });

  it("detecteert gedeeltelijk ontbrekende velden", () => {
    const gedeeltelijk = {
      ...lavendel,
      omstandigheden: {
        ...lavendel.omstandigheden,
        zon: { waarde: "unknown" as const, bron: "unknown" as const },
      },
    };
    const onbekend = heeftOnbekendeVelden(gedeeltelijk);
    expect(onbekend).toContain("zon");
    expect(onbekend).not.toContain("drainage");
  });
});
