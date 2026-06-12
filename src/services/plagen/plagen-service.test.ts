import { describe, it, expect } from "vitest";
import { FallbackPlagenAdapter } from "./plagen-service";
import type { IPlagenService } from "./plagen-port";
import type { PlagenResultaat } from "./types";

const RESULTAAT: PlagenResultaat = {
  bevindingen: [
    {
      naam: "Bladluis", type: "plaag", wetenschappelijkeNaam: "Aphidoidea", zekerheid: 0.8,
      ernst: "midden", symptomen: "luizen op scheuten", aanbevolenActie: "afspuiten", biologisch: true,
    },
  ],
  samenvatting: "primair",
  queryId: "q1",
};

// Fakes implementeren de port — geen globale fetch-mock nodig.
class GoedeService implements IPlagenService {
  async analyseer(): Promise<PlagenResultaat> {
    return RESULTAAT;
  }
}
class FalendeService implements IPlagenService {
  async analyseer(): Promise<PlagenResultaat> {
    throw new Error("geen backend");
  }
}

const nepFoto = new File(["x"], "blad.jpg", { type: "image/jpeg" });

describe("FallbackPlagenAdapter", () => {
  it("gebruikt de primaire bron en markeert bron='ai' bij succes", async () => {
    const adapter = new FallbackPlagenAdapter(new GoedeService(), new FalendeService());

    const resultaat = await adapter.analyseer(nepFoto, "Rosa canina");

    expect(resultaat.bron).toBe("ai");
    expect(resultaat.samenvatting).toBe("primair");
    expect(resultaat.bevindingen).toHaveLength(1);
  });

  it("valt terug op de reserve en markeert bron='lokaal' als de primaire faalt", async () => {
    const adapter = new FallbackPlagenAdapter(new FalendeService(), new GoedeService());

    const resultaat = await adapter.analyseer(nepFoto);

    expect(resultaat.bron).toBe("lokaal");
    expect(resultaat.samenvatting).toBe("primair");
  });
});
