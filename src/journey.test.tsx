import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OntdekPagina } from "./pages/Ontdek";
import { TakenPagina } from "./pages/Taken";
import { TuinkaartPagina } from "./pages/Tuinkaart";
import { useTuinStore } from "./store/tuin-store";
import { useTakenStore } from "./store/taken-store";
import { AutoFillService, setAutoFillService } from "./services/autofill/autofill-service";
import { MemoryCache } from "./services/autofill/memory-cache";
import { lavendel } from "./domain/plant/fixtures";
import type { AutoFillPort } from "./services/autofill/port";

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

beforeEach(() => {
  localStorage.clear();
  const t = useTuinStore.getState().tuin;
  useTuinStore.setState({
    tuin: { ...t, naam: "Mijn tuin", zones: [] },
    actieveZoneId: null,
    actieveBorderId: null,
    plantCatalog: {},
  });
  useTakenStore.setState({ taken: [] });
});

afterEach(cleanup);

describe("journey: zone aanmaken → plant zoeken → match-score zien", () => {
  it("toont een match-score voor een gezochte plant in de actieve zone", async () => {
    // 1. Zone aanmaken en activeren
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().setActieveZone(zoneA.id);

    // 2. AI-autofill mocken — geen netwerk of API-sleutel nodig
    const mock: AutoFillPort = { vulAan: async () => lavendel };
    setAutoFillService(new AutoFillService({ adapter: mock, cache: new MemoryCache() }));

    // 3. Ontdek renderen en zoeken
    render(
      <MemoryRouter>
        <OntdekPagina />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Zoek plant op naam"), {
      target: { value: "Lavandula angustifolia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zoek" }));

    // 4. Resultaatkaart met match-score verschijnt
    expect(await screen.findByText(/Lavandula angustifolia/)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Match score:/)).toBeInTheDocument();
  });
});

describe("journey: taak afvinken", () => {
  it("markeert een open taak als klaar via de checkbox", async () => {
    useTakenStore.getState().voegTaakToe({
      titel: "Lavendel snoeien",
      zoneId: null,
      vervaldatum: null,
      herhaling: null,
    });

    render(
      <MemoryRouter>
        <TakenPagina />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText("Markeer 'Lavendel snoeien' als klaar"));

    expect(
      await screen.findByLabelText("Markeer 'Lavendel snoeien' als open"),
    ).toBeInTheDocument();
  });
});

describe("journey: zone-eerst aanbevelingen zonder zoeken", () => {
  it("beveelt catalogusplanten aan die bij de actieve zone passen", async () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().setActieveZone(zoneA.id);
    // Plant zit in de catalogus maar staat (nog) niet in de zone.
    useTuinStore.getState().voegPlantToeAanCatalogus(lavendel);

    render(
      <MemoryRouter>
        <OntdekPagina />
      </MemoryRouter>,
    );

    // Geen zoekopdracht — toch verschijnt de plant als zone-eerst aanbeveling met score.
    expect(await screen.findByText(/Lavandula angustifolia/)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Match score:/)).toBeInTheDocument();
  });
});

describe("journey: interactieve tuinplattegrond", () => {
  it("toont zones als klikbare tegels en opent zone-detail bij selectie", async () => {
    useTuinStore.getState().voegZoneToe(zoneA);
    useTuinStore.getState().voegZoneToe({ ...zoneA, id: "zone-b", naam: "Schaduwhoek" });
    // voegZoneToe auto-selecteert de eerste zone — start hier bewust zonder selectie.
    useTuinStore.setState({ actieveZoneId: null });

    render(
      <MemoryRouter>
        <TuinkaartPagina />
      </MemoryRouter>,
    );

    // Beide zones verschijnen als klikbare tegels op de SVG-plattegrond.
    const tegelA = await screen.findByRole("button", { name: "Zone Zonnige rand" });
    expect(screen.getByRole("button", { name: "Zone Schaduwhoek" })).toBeInTheDocument();

    // Klik selecteert de zone → detail + verwijder-knop verschijnen.
    fireEvent.click(tegelA);
    expect(await screen.findByRole("button", { name: "Verwijder zone" })).toBeInTheDocument();
  });
});
