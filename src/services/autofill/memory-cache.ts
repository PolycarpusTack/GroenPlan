// In-memory cache — prototype implementatie van CachePort
// Vervang door SQLite-backed implementatie in productie
import type { CachePort } from "./port";
import type { AutoFillResultaat } from "../../domain/plant/types";

interface CacheEntry {
  resultaat: AutoFillResultaat;
  versie: string;
  gecacheAt: number;
}

export class MemoryCache implements CachePort {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlUren = 24) {
    this.ttlMs = ttlUren * 60 * 60 * 1000;
  }

  private normaliseerSleutel(sleutel: string): string {
    return sleutel.trim().toLowerCase();
  }

  haalOp(sleutel: string, verwachteVersie?: string): AutoFillResultaat | null {
    const k = this.normaliseerSleutel(sleutel);
    const entry = this.cache.get(k);
    if (!entry) return null;
    if (Date.now() - entry.gecacheAt > this.ttlMs) {
      this.cache.delete(k);
      return null;
    }
    // Verouderde bron-versie (nieuw model/prompt) → invalideer.
    if (verwachteVersie !== undefined && entry.versie !== verwachteVersie) {
      this.cache.delete(k);
      return null;
    }
    return entry.resultaat;
  }

  slaOp(sleutel: string, resultaat: AutoFillResultaat, versie: string): void {
    this.cache.set(this.normaliseerSleutel(sleutel), {
      resultaat,
      versie,
      gecacheAt: Date.now(),
    });
  }

  get grootte(): number {
    return this.cache.size;
  }

  leeg(): void {
    this.cache.clear();
  }
}
