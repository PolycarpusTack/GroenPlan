import { describe, it, expect, vi } from "vitest";
import { IndexedDbBackedCache } from "./indexeddb-cache";
import type { AutoFillResultaat } from "../../domain/plant/types";

// In jsdom is `indexedDB` niet beschikbaar → de cache valt terug op pure
// in-memory werking. Deze tests dekken het CachePort-contract in die modus.
function nepResultaat(naam: string): AutoFillResultaat {
  return { identificatie: { wetenschappelijkeNaam: naam } } as unknown as AutoFillResultaat;
}

describe("IndexedDbBackedCache (zonder IndexedDB → in-memory)", () => {
  it("slaat op en haalt op", () => {
    const cache = new IndexedDbBackedCache();
    cache.slaOp("Lavandula angustifolia", nepResultaat("Lavandula angustifolia"), "v1");
    expect(cache.haalOp("Lavandula angustifolia")?.identificatie.wetenschappelijkeNaam)
      .toBe("Lavandula angustifolia");
  });

  it("geeft null voor een onbekende sleutel", () => {
    const cache = new IndexedDbBackedCache();
    expect(cache.haalOp("Rosa canina")).toBeNull();
  });

  it("normaliseert de sleutel (hoofdletterongevoelig, trimt spaties)", () => {
    const cache = new IndexedDbBackedCache();
    cache.slaOp("Salvia officinalis", nepResultaat("Salvia officinalis"), "v1");
    expect(cache.haalOp("  SALVIA OFFICINALIS  ")).not.toBeNull();
  });

  it("verloopt na de TTL", () => {
    vi.useFakeTimers();
    try {
      const cache = new IndexedDbBackedCache(1); // TTL van 1 uur
      cache.slaOp("Taxus baccata", nepResultaat("Taxus baccata"), "v1");
      expect(cache.haalOp("Taxus baccata")).not.toBeNull();
      vi.advanceTimersByTime(2 * 60 * 60 * 1000); // +2 uur
      expect(cache.haalOp("Taxus baccata")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("werpt geen fout zonder IndexedDB", () => {
    expect(() => {
      const cache = new IndexedDbBackedCache();
      cache.slaOp("Buddleja davidii", nepResultaat("Buddleja davidii"), "v1");
      cache.haalOp("Buddleja davidii");
    }).not.toThrow();
  });
});
