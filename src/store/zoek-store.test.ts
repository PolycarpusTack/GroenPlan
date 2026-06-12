import { describe, it, expect, beforeEach } from "vitest";
import { useZoekGeschiedenisStore } from "./zoek-store";

beforeEach(() => {
  useZoekGeschiedenisStore.setState({ geschiedenis: [] });
});

describe("useZoekGeschiedenisStore", () => {
  it("voegt een zoekterm vooraan toe", () => {
    useZoekGeschiedenisStore.getState().voegToe("Lavandula");
    expect(useZoekGeschiedenisStore.getState().geschiedenis[0]).toBe("Lavandula");
  });

  it("dedupliceert hoofdletterongevoelig en zet de recentste vooraan", () => {
    const s = useZoekGeschiedenisStore.getState();
    s.voegToe("Rosa");
    s.voegToe("Salvia");
    s.voegToe("rosa");
    const g = useZoekGeschiedenisStore.getState().geschiedenis;
    expect(g[0]).toBe("rosa");
    expect(g.filter((n) => n.toLowerCase() === "rosa")).toHaveLength(1);
  });

  it("beperkt de geschiedenis tot 6 items", () => {
    const s = useZoekGeschiedenisStore.getState();
    ["a", "b", "c", "d", "e", "f", "g"].forEach((n) => s.voegToe(n));
    expect(useZoekGeschiedenisStore.getState().geschiedenis).toHaveLength(6);
    expect(useZoekGeschiedenisStore.getState().geschiedenis[0]).toBe("g");
  });

  it("negeert lege termen", () => {
    useZoekGeschiedenisStore.getState().voegToe("   ");
    expect(useZoekGeschiedenisStore.getState().geschiedenis).toHaveLength(0);
  });
});
