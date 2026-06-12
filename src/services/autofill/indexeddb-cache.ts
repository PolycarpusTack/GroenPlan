// IndexedDB-backed implementatie van CachePort. De CachePort is synchroon, dus
// een in-memory Map is de bron van waarheid; IndexedDB hydrateert die bij start
// en wordt write-through bijgewerkt. Zonder IndexedDB (bv. in tests/jsdom) gedraagt
// de cache zich als een gewone in-memory TTL-cache.
import type { CachePort } from "./port";
import type { AutoFillResultaat } from "../../domain/plant/types";

interface CacheEntry {
  resultaat: AutoFillResultaat;
  versie: string;
  gecacheAt: number;
}

const DB_NAAM = "groenplan-autofill";
const STORE = "planten";

export class IndexedDbBackedCache implements CachePort {
  private readonly mem = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly db: Promise<IDBDatabase | null>;

  // Plantdata verandert traag → ruime TTL (standaard 30 dagen).
  constructor(ttlUren = 24 * 30) {
    this.ttlMs = ttlUren * 60 * 60 * 1000;
    this.db = this.openDb();
    void this.hydrate();
  }

  private heeftIdb(): boolean {
    return typeof indexedDB !== "undefined";
  }

  private normaliseer(sleutel: string): string {
    return sleutel.trim().toLowerCase();
  }

  private openDb(): Promise<IDBDatabase | null> {
    if (!this.heeftIdb()) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAAM, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async hydrate(): Promise<void> {
    const db = await this.db;
    if (!db) return;
    try {
      const cursor = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return;
        const entry = c.value as CacheEntry;
        if (Date.now() - entry.gecacheAt <= this.ttlMs) {
          this.mem.set(String(c.key), entry);
        }
        c.continue();
      };
    } catch {
      /* hydratatie is best-effort */
    }
  }

  private async persist(sleutel: string, entry: CacheEntry): Promise<void> {
    const db = await this.db;
    if (!db) return;
    try {
      db.transaction(STORE, "readwrite").objectStore(STORE).put(entry, sleutel);
    } catch {
      /* schrijven is best-effort */
    }
  }

  private async verwijderUitDb(sleutel: string): Promise<void> {
    const db = await this.db;
    if (!db) return;
    try {
      db.transaction(STORE, "readwrite").objectStore(STORE).delete(sleutel);
    } catch {
      /* negeer */
    }
  }

  haalOp(sleutel: string, verwachteVersie?: string): AutoFillResultaat | null {
    const k = this.normaliseer(sleutel);
    const entry = this.mem.get(k);
    if (!entry) return null;
    if (Date.now() - entry.gecacheAt > this.ttlMs) {
      this.mem.delete(k);
      void this.verwijderUitDb(k);
      return null;
    }
    // Verouderde bron-versie (nieuw model/prompt) → invalideer (spec §6).
    if (verwachteVersie !== undefined && entry.versie !== verwachteVersie) {
      this.mem.delete(k);
      void this.verwijderUitDb(k);
      return null;
    }
    return entry.resultaat;
  }

  slaOp(sleutel: string, resultaat: AutoFillResultaat, versie: string): void {
    const k = this.normaliseer(sleutel);
    const entry: CacheEntry = { resultaat, versie, gecacheAt: Date.now() };
    this.mem.set(k, entry);
    void this.persist(k, entry);
  }
}
