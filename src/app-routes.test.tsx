import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import App from "./App";
import { useTuinStore } from "./store/tuin-store";
import { useTakenStore } from "./store/taken-store";
import { lavendel } from "./domain/plant/fixtures";

const zoneA = {
  id: "zone-a",
  naam: "Zonnige rand",
  grondsoort: "chalk" as const,
  zon: "full" as const,
  pH: 7.2,
  drainage: "well-drained" as const,
  gemeente: null,
  regenval_mm_7d: null,
  breedte_m: null,
  diepte_m: null,
};

function renderRoute(pad: string) {
  window.history.pushState({}, "", pad);
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
  useTakenStore.setState({ taken: [] });
  const t = useTuinStore.getState().tuin;
  useTuinStore.setState({
    tuin: { ...t, naam: "Mijn tuin", zones: [] },
    actieveZoneId: null,
    actieveBorderId: null,
    plantCatalog: {},
  });
  // Eén zone + één plant zodat datagestuurde pagina's (Ontdek, Bloeikalender)
  // hun normale weergave tonen i.p.v. de onboarding-/lege staat.
  useTuinStore.getState().voegZoneToe(zoneA);
  useTuinStore.getState().setActieveZone(zoneA.id);
  useTuinStore.getState().voegPlantToeAanZone(zoneA.id, lavendel);
});

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
});

// Elke hoofdroute moet lazy laden en zijn pagina-kop tonen (geen crash, geen 404).
const ROUTES: Array<[string, string]> = [
  ["/ontdek", "Ontdek planten"],
  ["/tuinkaart", "Mijn tuin"],
  ["/taken", "Taken"],
  ["/catalogus", "Plantencatalogus"],
  ["/kalender", "Bloeikalender"],
  ["/dagboek", "Groeidagboek"],
  ["/bodem", "Bodem & Metingen"],
  ["/zaadbank", "Zaadbank"],
  ["/gids", "Gids"],
  ["/veld", "Veld-modus"],
  ["/instellingen", "Instellingen"],
];

describe("routes — lazy-loading & navigatie", () => {
  // Ruime timeouts: het koud lazy-laden + transformeren van een zware route-chunk
  // (bv. Ontdek met camerapaneel, Bloeikalender met gantt) kan in de testworker
  // meer dan de standaard 5s duren. De test-timeout (4e arg) staat daarom hoger
  // dan de findBy-timeout.
  it.each(ROUTES)(
    "rendert %s met de juiste pagina-kop",
    async (pad, kop) => {
      renderRoute(pad);
      expect(
        await screen.findByRole("heading", { level: 1, name: kop }, { timeout: 8000 }),
      ).toBeInTheDocument();
    },
    10000,
  );

  it("toont de 404-pagina voor een onbekende route", async () => {
    renderRoute("/bestaat-echt-niet");
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Pagina niet gevonden" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });
});

describe("offline-melding", () => {
  it("toont de offline-banner wanneer de browser offline is", async () => {
    const origineel = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    try {
      renderRoute("/bodem");
      expect(await screen.findByText(/^Offline —/)).toBeInTheDocument();
    } finally {
      if (origineel) Object.defineProperty(navigator, "onLine", origineel);
      else Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    }
  });
});
