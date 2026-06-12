import { describe, it, expect } from "vitest";
import { FallbackTuinOntwerpAdapter } from "./tuinontwerp-service";
import type { ITuinOntwerpService } from "./tuinontwerp-port";
import type { TuinOntwerpResultaat } from "./types";
import type { Zone } from "../../domain/tuin/types";

const LEEG_RESULTAAT: TuinOntwerpResultaat = {
  samenvatting: "test",
  suggesties: [],
  voorstellen: [],
};

const zone: Zone = {
  id: "z1",
  naam: "Testzone",
  grondsoort: "loam",
  zon: "full",
  pH: 6.5,
  drainage: "well-drained",
  gemeente: null,
  regenval_mm_7d: null,
  breedte_m: null,
  diepte_m: null,
  borders: [],
  plantPlaatsingen: [],
};

// Fakes implementeren de port — geen globale mocks nodig.
class GoedeService implements ITuinOntwerpService {
  async analyseer(): Promise<TuinOntwerpResultaat> {
    return { ...LEEG_RESULTAAT, samenvatting: "primair" };
  }
}
class FalendeService implements ITuinOntwerpService {
  async analyseer(): Promise<TuinOntwerpResultaat> {
    throw new Error("geen backend");
  }
}

describe("FallbackTuinOntwerpAdapter", () => {
  it("gebruikt de primaire bron en markeert bron='ai' bij succes", async () => {
    const reserve = new FalendeService(); // mag niet aangeroepen worden
    const adapter = new FallbackTuinOntwerpAdapter(new GoedeService(), reserve);

    const resultaat = await adapter.analyseer(zone, {}, 8, "");

    expect(resultaat.bron).toBe("ai");
    expect(resultaat.samenvatting).toBe("primair");
  });

  it("valt terug op de reserve en markeert bron='lokaal' als de primaire faalt", async () => {
    const adapter = new FallbackTuinOntwerpAdapter(new FalendeService(), new GoedeService());

    const resultaat = await adapter.analyseer(zone, {}, 8, "");

    expect(resultaat.bron).toBe("lokaal");
    expect(resultaat.samenvatting).toBe("primair");
  });
});
