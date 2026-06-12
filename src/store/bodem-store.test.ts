import { describe, it, expect, beforeEach } from "vitest";
import { useBodemStore } from "./bodem-store";

beforeEach(() => {
  useBodemStore.setState({ metingen: [] });
});

describe("useBodemStore", () => {
  it("voegt een meting toe met gegenereerd id", () => {
    useBodemStore.getState().voegMetingToe({ zoneId: "z1", ph: 6.5, datum: "2026-05-01", notitie: null });
    const m = useBodemStore.getState().metingen;
    expect(m).toHaveLength(1);
    expect(m[0].id).toBeTruthy();
    expect(m[0].ph).toBe(6.5);
  });

  it("sorteert metingen op datum, nieuwste eerst", () => {
    const s = useBodemStore.getState();
    s.voegMetingToe({ zoneId: "z1", ph: 6, datum: "2026-01-01", notitie: null });
    s.voegMetingToe({ zoneId: "z1", ph: 7, datum: "2026-06-01", notitie: null });
    const m = useBodemStore.getState().metingen;
    expect(m[0].datum).toBe("2026-06-01");
    expect(m[1].datum).toBe("2026-01-01");
  });

  it("verwijdert een meting op id", () => {
    useBodemStore.getState().voegMetingToe({ zoneId: "z1", ph: 6.5, datum: "2026-05-01", notitie: null });
    const id = useBodemStore.getState().metingen[0].id;
    useBodemStore.getState().verwijderMeting(id);
    expect(useBodemStore.getState().metingen).toHaveLength(0);
  });
});
