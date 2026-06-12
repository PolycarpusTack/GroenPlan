import { describe, it, expect, beforeEach } from "vitest";
import { useTakenStore } from "./taken-store";

const BASIS_TAAK = { titel: "Snoeien", zoneId: null as string | null, vervaldatum: null as string | null, herhaling: null as null };

beforeEach(() => {
  useTakenStore.setState({ taken: [] });
});

describe("voegTaakToe", () => {
  it("voegt een taak toe met status open", () => {
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Snoeien" });

    const taken = useTakenStore.getState().taken;
    expect(taken).toHaveLength(1);
    expect(taken[0].titel).toBe("Snoeien");
    expect(taken[0].status).toBe("open");
    expect(taken[0].aangemaakt).toBeInstanceOf(Date);
    expect(taken[0].herhaling).toBeNull();
  });

  it("genereert een uniek id per taak", () => {
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Taak A" });
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Taak B" });

    const taken = useTakenStore.getState().taken;
    expect(taken[0].id).not.toBe(taken[1].id);
  });

  it("bewaart zoneId en vervaldatum", () => {
    useTakenStore.getState().voegTaakToe({
      titel: "Bemesten",
      zoneId: "zone-a",
      vervaldatum: "2026-06-01",
      herhaling: null,
    });

    const taak = useTakenStore.getState().taken[0];
    expect(taak.zoneId).toBe("zone-a");
    expect(taak.vervaldatum).toBe("2026-06-01");
  });

  it("bewaart herhalingsconfig", () => {
    useTakenStore.getState().voegTaakToe({
      titel: "Gieten",
      zoneId: null,
      vervaldatum: "2026-06-01",
      herhaling: { type: "wekelijks", interval: 1, weekdagen: [0] },
    });

    const taak = useTakenStore.getState().taken[0];
    expect(taak.herhaling).toEqual({ type: "wekelijks", interval: 1, weekdagen: [0] });
  });
});

describe("toggleStatus", () => {
  it("zet open naar klaar (niet-herhalend)", () => {
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Gieten" });
    const id = useTakenStore.getState().taken[0].id;

    useTakenStore.getState().toggleStatus(id);
    expect(useTakenStore.getState().taken[0].status).toBe("klaar");
  });

  it("zet klaar terug naar open (niet-herhalend)", () => {
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Gieten" });
    const id = useTakenStore.getState().taken[0].id;

    useTakenStore.getState().toggleStatus(id);
    useTakenStore.getState().toggleStatus(id);
    expect(useTakenStore.getState().taken[0].status).toBe("open");
  });

  it("herhalende taak voltooien: markeert klaar en spawnt volgende taak", () => {
    useTakenStore.getState().voegTaakToe({
      titel: "Bemesten",
      zoneId: null,
      vervaldatum: "2026-06-01",
      herhaling: { type: "maandelijks", interval: 1, regel: { soort: "dag", dagNummer: 1 } },
    });
    const id = useTakenStore.getState().taken[0].id;

    useTakenStore.getState().toggleStatus(id);

    const taken = useTakenStore.getState().taken;
    expect(taken).toHaveLength(2);

    const voltooide = taken.find((t) => t.id === id)!;
    expect(voltooide.status).toBe("klaar");

    const volgende = taken.find((t) => t.id !== id)!;
    expect(volgende.status).toBe("open");
    expect(volgende.titel).toBe("Bemesten");
    expect(volgende.herhaling).toEqual({ type: "maandelijks", interval: 1, regel: { soort: "dag", dagNummer: 1 } });
    expect(volgende.vervaldatum).toBe("2026-07-01");
  });

  it("herhalende taak zonder vervaldatum: gewoon toggle, geen spawn", () => {
    useTakenStore.getState().voegTaakToe({
      titel: "Mulchen",
      zoneId: null,
      vervaldatum: null,
      herhaling: { type: "jaarlijks", interval: 1, maand: 3, regel: { soort: "dag", dagNummer: 1 } },
    });
    const id = useTakenStore.getState().taken[0].id;

    useTakenStore.getState().toggleStatus(id);

    const taken = useTakenStore.getState().taken;
    expect(taken).toHaveLength(1);
    expect(taken[0].status).toBe("klaar");
  });
});

describe("verwijderTaak", () => {
  it("verwijdert de taak", () => {
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Wieden" });
    const id = useTakenStore.getState().taken[0].id;

    useTakenStore.getState().verwijderTaak(id);
    expect(useTakenStore.getState().taken).toHaveLength(0);
  });

  it("verwijdert alleen de opgegeven taak", () => {
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Taak A" });
    useTakenStore.getState().voegTaakToe({ ...BASIS_TAAK, titel: "Taak B" });
    const idA = useTakenStore.getState().taken[0].id;

    useTakenStore.getState().verwijderTaak(idA);
    const remaining = useTakenStore.getState().taken;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].titel).toBe("Taak B");
  });
});
