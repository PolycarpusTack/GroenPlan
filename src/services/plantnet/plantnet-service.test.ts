import { describe, it, expect } from "vitest";
import { FallbackPlantNetAdapter } from "./plantnet-service";
import type { IPlantNetService } from "./plantnet-port";
import type { PlantNetResultaat } from "./types";

const RESULTAAT: PlantNetResultaat = {
  suggesties: [
    { wetenschappelijkeNaam: "Lavandula angustifolia", zekerheid: 0.9, gewoneNaam: "Lavendel", familie: "Lamiaceae" },
  ],
  queryId: "q1",
};

// Fakes implementeren de port — geen globale fetch-mock nodig.
class GoedeService implements IPlantNetService {
  async identificeer(): Promise<PlantNetResultaat> {
    return RESULTAAT;
  }
}
class FalendeService implements IPlantNetService {
  async identificeer(): Promise<PlantNetResultaat> {
    throw new Error("geen netwerk");
  }
}

const nepFoto = new File(["x"], "blad.jpg", { type: "image/jpeg" });

describe("FallbackPlantNetAdapter", () => {
  it("gebruikt de primaire bron en markeert bron='online' bij succes", async () => {
    const adapter = new FallbackPlantNetAdapter(new GoedeService(), new FalendeService());

    const resultaat = await adapter.identificeer(nepFoto);

    expect(resultaat.bron).toBe("online");
    expect(resultaat.suggesties).toHaveLength(1);
  });

  it("valt terug op de reserve en markeert bron='lokaal' als de primaire faalt", async () => {
    const adapter = new FallbackPlantNetAdapter(new FalendeService(), new GoedeService());

    const resultaat = await adapter.identificeer(nepFoto);

    expect(resultaat.bron).toBe("lokaal");
    expect(resultaat.suggesties).toHaveLength(1);
  });
});
