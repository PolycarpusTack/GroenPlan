import { describe, it, expect } from "vitest";
import { schatKosten } from "./kosten";

describe("schatKosten", () => {
  it("geeft een brede band per plant", () => {
    expect(schatKosten(8)).toEqual({ min: 48, max: 96 });
  });

  it("geeft null bij nul of ongeldige aantallen", () => {
    expect(schatKosten(0)).toBeNull();
    expect(schatKosten(-3)).toBeNull();
    expect(schatKosten(NaN)).toBeNull();
  });
});
