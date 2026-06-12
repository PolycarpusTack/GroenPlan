import { describe, it, expect, vi } from "vitest";
import { AutoFillService, FallbackAutoFillAdapter } from "./autofill-service";
import { MemoryCache } from "./memory-cache";
import { StubAutoFillService, maakLokaleReserve } from "./stub-autofill-service";
import { parseAutoFillJson, valideerAutoFillResultaat, AutoFillValidatieFout } from "./validator";
import { bouwGebruikersBericht } from "./prompt";
import type { AutoFillPort } from "./port";
import { lavendel } from "../../domain/plant/fixtures";

// ─── Mock adapter — eigentype, nooit Anthropic SDK (G-TS-01) ─────────────────

function maakMockAdapter(resultaat = lavendel): AutoFillPort {
  return {
    vulAan: vi.fn().mockResolvedValue(resultaat),
  };
}

// ─── bouwGebruikersBericht ────────────────────────────────────────────────────

describe("bouwGebruikersBericht", () => {
  it("bevat de plantnaam op de eerste regel", () => {
    const bericht = bouwGebruikersBericht("Lavandula angustifolia");
    expect(bericht).toContain("PLANT: Lavandula angustifolia");
  });

  it("gebruikt nl en BE-VL als standaard", () => {
    const bericht = bouwGebruikersBericht("Rosa canina");
    expect(bericht).toContain("TAAL: nl");
    expect(bericht).toContain("REGIO: BE-VL");
  });

  it("neemt een fotoHint op als opgegeven", () => {
    const bericht = bouwGebruikersBericht("Rosa canina", { fotoHint: "plantnet-id-abc" });
    expect(bericht).toContain("FOTO_HINT: plantnet-id-abc");
  });
});

// ─── valideerAutoFillResultaat ────────────────────────────────────────────────

describe("valideerAutoFillResultaat", () => {
  it("accepteert het lavendel fixture als geldig", () => {
    expect(() => valideerAutoFillResultaat(lavendel)).not.toThrow();
  });

  it("gooit AutoFillValidatieFout als identificatie ontbreekt", () => {
    const ongeldig = { ...lavendel, identificatie: null };
    expect(() => valideerAutoFillResultaat(ongeldig)).toThrow(AutoFillValidatieFout);
  });

  it("gooit AutoFillValidatieFout als wetenschappelijkeNaam leeg is", () => {
    const ongeldig = {
      ...lavendel,
      identificatie: { ...lavendel.identificatie, wetenschappelijkeNaam: "" },
    };
    expect(() => valideerAutoFillResultaat(ongeldig)).toThrow(AutoFillValidatieFout);
  });

  it("gooit AutoFillValidatieFout als bron ongeldig is", () => {
    const ongeldig = {
      ...lavendel,
      omstandigheden: {
        ...lavendel.omstandigheden,
        zon: { waarde: "full", bron: "OnbekendeBron" },
      },
    };
    expect(() => valideerAutoFillResultaat(ongeldig)).toThrow(AutoFillValidatieFout);
  });

  it("gooit AutoFillValidatieFout als zekerheid buiten 0–1 valt", () => {
    const ongeldig = { ...lavendel, zekerheid: { algemeen: 1.5, notities: "" } };
    expect(() => valideerAutoFillResultaat(ongeldig)).toThrow(AutoFillValidatieFout);
  });

  it("gooit AutoFillValidatieFout voor ongeldige grondsoort", () => {
    const ongeldig = {
      ...lavendel,
      omstandigheden: {
        ...lavendel.omstandigheden,
        grondsoorten: { waarde: ["gravel"], bron: "RHS" },
      },
    };
    expect(() => valideerAutoFillResultaat(ongeldig)).toThrow(AutoFillValidatieFout);
  });
});

// ─── parseAutoFillJson ────────────────────────────────────────────────────────

describe("parseAutoFillJson", () => {
  it("parseert geldige JSON naar AutoFillResultaat", () => {
    const json = JSON.stringify(lavendel);
    expect(() => parseAutoFillJson(json)).not.toThrow();
  });

  it("gooit AutoFillValidatieFout bij ongeldige JSON string", () => {
    expect(() => parseAutoFillJson("dit is geen json")).toThrow(AutoFillValidatieFout);
  });
});

// ─── AutoFillService ──────────────────────────────────────────────────────────

describe("AutoFillService", () => {
  it("roept de adapter aan bij een cache-miss", async () => {
    const adapter = maakMockAdapter();
    const service = new AutoFillService({ adapter, cache: new MemoryCache() });

    const resultaat = await service.vulAan("Lavandula angustifolia");

    expect(adapter.vulAan).toHaveBeenCalledOnce();
    expect(resultaat.identificatie.wetenschappelijkeNaam).toBe("Lavandula angustifolia");
  });

  it("slaat resultaat op in de cache na eerste aanroep", async () => {
    const adapter = maakMockAdapter();
    const cache = new MemoryCache();
    const service = new AutoFillService({ adapter, cache });

    await service.vulAan("Lavandula angustifolia");
    await service.vulAan("Lavandula angustifolia");

    // Adapter slechts één keer aangeroepen — tweede keer uit cache
    expect(adapter.vulAan).toHaveBeenCalledOnce();
  });

  it("is case-insensitief voor cache-sleutels", async () => {
    const adapter = maakMockAdapter();
    const service = new AutoFillService({ adapter, cache: new MemoryCache() });

    await service.vulAan("Lavandula angustifolia");
    await service.vulAan("LAVANDULA ANGUSTIFOLIA");

    expect(adapter.vulAan).toHaveBeenCalledOnce();
  });

  it("gooit bij een adapter-fout (geïnjecteerde adapter zonder fallback)", async () => {
    const adapter: AutoFillPort = {
      vulAan: vi.fn().mockRejectedValue(new Error("API fout")),
    };
    const service = new AutoFillService({ adapter });

    await expect(service.vulAan("Onbekende plant")).rejects.toThrow("API fout");
  });

  it("cachet een lokale reserve (terugval) niet zodat de AI later opnieuw probeert", async () => {
    const reserve = maakLokaleReserve("Rosa canina");
    const adapter: AutoFillPort = { vulAan: vi.fn().mockResolvedValue(reserve) };
    const cache = new MemoryCache();
    const service = new AutoFillService({ adapter, cache });

    await service.vulAan("Rosa canina");
    await service.vulAan("Rosa canina");

    // Niet gecachet → adapter wordt elke keer opnieuw aangeroepen.
    expect(adapter.vulAan).toHaveBeenCalledTimes(2);
  });
});

// ─── StubAutoFillService + FallbackAutoFillAdapter ───────────────────────────

describe("StubAutoFillService", () => {
  it("levert een geldig, leeg resultaat dat als terugval is gemarkeerd", async () => {
    const stub = new StubAutoFillService();
    const r = await stub.vulAan("Rosa canina");

    expect(() => valideerAutoFillResultaat(r)).not.toThrow();
    expect(r.identificatie.wetenschappelijkeNaam).toBe("Rosa canina");
    expect(r.zekerheid.terugval).toBe(true);
    expect(r.zekerheid.algemeen).toBe(0);
  });

  it("verzint geen plantgegevens (alle velden unknown/null)", async () => {
    const r = await new StubAutoFillService().vulAan("Rosa canina");
    expect(r.omstandigheden.zon.waarde).toBe("unknown");
    expect(r.omstandigheden.zon.bron).toBe("unknown");
    expect(r.omstandigheden.grondsoorten.waarde).toEqual([]);
    expect(r.bloei.maanden.waarde).toEqual([]);
  });
});

describe("FallbackAutoFillAdapter", () => {
  it("gebruikt het AI-resultaat als de primaire adapter slaagt", async () => {
    const primair: AutoFillPort = { vulAan: vi.fn().mockResolvedValue(lavendel) };
    const reserve: AutoFillPort = { vulAan: vi.fn() };
    const adapter = new FallbackAutoFillAdapter(primair, reserve);

    const r = await adapter.vulAan("Lavandula angustifolia");

    expect(r).toBe(lavendel);
    expect(reserve.vulAan).not.toHaveBeenCalled();
  });

  it("valt terug op de lokale reserve als de primaire adapter faalt", async () => {
    const primair: AutoFillPort = {
      vulAan: vi.fn().mockRejectedValue(new Error("geen backend")),
    };
    const adapter = new FallbackAutoFillAdapter(primair, new StubAutoFillService());

    const r = await adapter.vulAan("Rosa canina");

    expect(r.zekerheid.terugval).toBe(true);
    expect(r.identificatie.wetenschappelijkeNaam).toBe("Rosa canina");
  });
});

// ─── MemoryCache ──────────────────────────────────────────────────────────────

describe("MemoryCache", () => {
  it("geeft null terug bij cache-miss", () => {
    const cache = new MemoryCache();
    expect(cache.haalOp("onbekend")).toBeNull();
  });

  it("slaat op en haalt op", () => {
    const cache = new MemoryCache();
    cache.slaOp("lavandula angustifolia", lavendel, "v1");
    expect(cache.haalOp("lavandula angustifolia")).toBe(lavendel);
  });

  it("normaliseert sleutels naar lowercase", () => {
    const cache = new MemoryCache();
    cache.slaOp("Lavandula Angustifolia", lavendel, "v1");
    expect(cache.haalOp("lavandula angustifolia")).toBe(lavendel);
  });
});
