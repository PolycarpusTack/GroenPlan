import { describe, it, expect } from "vitest";
import { FallbackCoachAdapter } from "./coach-service";
import type { ICoachService } from "./coach-port";
import type { CoachAntwoord } from "./types";

class GoedeService implements ICoachService {
  async vraag(): Promise<CoachAntwoord> {
    return { antwoord: "primair antwoord" };
  }
}
class FalendeService implements ICoachService {
  async vraag(): Promise<CoachAntwoord> {
    throw new Error("geen backend");
  }
}

describe("FallbackCoachAdapter", () => {
  it("gebruikt de primaire bron en markeert bron='ai' bij succes", async () => {
    const adapter = new FallbackCoachAdapter(new GoedeService(), new FalendeService());
    const res = await adapter.vraag("Wanneer snoei ik lavendel?");
    expect(res.bron).toBe("ai");
    expect(res.antwoord).toBe("primair antwoord");
  });

  it("valt terug op de reserve en markeert bron='lokaal' als de primaire faalt", async () => {
    const adapter = new FallbackCoachAdapter(new FalendeService(), new GoedeService());
    const res = await adapter.vraag("Wanneer snoei ik lavendel?");
    expect(res.bron).toBe("lokaal");
    expect(res.antwoord).toBe("primair antwoord");
  });
});
