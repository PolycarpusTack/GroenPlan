// AutoFillService — orchestrator, koppelt port + cache + foutafhandeling
// Importeert NOOIT ClaudeAutoFillAdapter — die hoort server-side (claude-adapter.ts)
import type { AutoFillPort, CachePort, AutoFillOpties } from "./port";
import type { AutoFillResultaat } from "../../domain/plant/types";
import { HttpAutoFillAdapter } from "./http-adapter";
import { StubAutoFillService } from "./stub-autofill-service";
import { MemoryCache } from "./memory-cache";
import { IndexedDbBackedCache } from "./indexeddb-cache";

// Probeert eerst de echte AI (Claude via /api/autofill). Zonder backend, sleutel
// of netwerk valt hij terug op een lege, duidelijk gelabelde lokale invulling.
// Net als de coach-/plagen-/plantnet-services degradeert auto-fill zo netjes i.p.v.
// een harde fout te gooien.
export class FallbackAutoFillAdapter implements AutoFillPort {
  constructor(
    private readonly primair: AutoFillPort = new HttpAutoFillAdapter(),
    private readonly reserve: AutoFillPort = new StubAutoFillService(),
  ) {}

  async vulAan(
    wetenschappelijkeNaam: string,
    opties: AutoFillOpties = {},
  ): Promise<AutoFillResultaat> {
    try {
      return await this.primair.vulAan(wetenschappelijkeNaam, opties);
    } catch {
      return this.reserve.vulAan(wetenschappelijkeNaam, opties);
    }
  }
}

export interface AutoFillServiceConfig {
  adapter?: AutoFillPort;
  cache?: CachePort;
  bronVersie?: string;
}

const BRON_VERSIE = "claude-sonnet-4-6-v1";

export class AutoFillService {
  private readonly adapter: AutoFillPort;
  private readonly cache: CachePort;
  private readonly bronVersie: string;

  constructor(config: AutoFillServiceConfig = {}) {
    this.adapter = config.adapter ?? new FallbackAutoFillAdapter();
    this.cache = config.cache ?? new MemoryCache();
    this.bronVersie = config.bronVersie ?? BRON_VERSIE;
  }

  async vulAan(
    wetenschappelijkeNaam: string,
    opties: AutoFillOpties = {},
  ): Promise<AutoFillResultaat> {
    const sleutel = wetenschappelijkeNaam.trim().toLowerCase();

    const gecached = this.cache.haalOp(sleutel, this.bronVersie);
    if (gecached) return gecached;

    const resultaat = await this.adapter.vulAan(wetenschappelijkeNaam, opties);

    // Lokale reserve (terugval) niet cachen: zo wordt de echte AI later alsnog
    // geprobeerd zodra er weer verbinding/sleutel is.
    if (!resultaat.zekerheid.terugval) {
      this.cache.slaOp(sleutel, resultaat, this.bronVersie);
    }
    return resultaat;
  }
}

// Singleton voor gebruik in pagina's — overschrijfbaar via setAutoFillService (tests/dev)
let _service: AutoFillService | null = null;

export function getAutoFillService(): AutoFillService {
  // IndexedDB-backed cache zodat opgehaalde plantdata offline beschikbaar blijft.
  if (!_service) _service = new AutoFillService({ cache: new IndexedDbBackedCache() });
  return _service;
}

export function setAutoFillService(service: AutoFillService): void {
  _service = service;
}
