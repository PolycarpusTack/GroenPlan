import { describe, it, expect, beforeEach } from "vitest";
import { useZaadbankStore } from "./zaadbank-store";

const basis = {
  naam: "Tomaat",
  wetenschappelijkeNaam: null,
  leverancier: null,
  aantal: 25,
  houdbaarTot: "2027-03",
  zaaiVan: 3,
  zaaiTot: 5,
  notitie: null,
};

beforeEach(() => {
  useZaadbankStore.setState({ zaden: [] });
});

describe("useZaadbankStore", () => {
  it("voegt een zaad toe met standaardstatus 'voorraad'", () => {
    useZaadbankStore.getState().voegZaadToe(basis);
    const zaden = useZaadbankStore.getState().zaden;
    expect(zaden).toHaveLength(1);
    expect(zaden[0].naam).toBe("Tomaat");
    expect(zaden[0].status).toBe("voorraad");
    expect(zaden[0].id).toBeTruthy();
  });

  it("markeert een zaad als gezaaid", () => {
    useZaadbankStore.getState().voegZaadToe(basis);
    const id = useZaadbankStore.getState().zaden[0].id;
    useZaadbankStore.getState().markeerGezaaid(id);
    expect(useZaadbankStore.getState().zaden[0].status).toBe("gezaaid");
  });

  it("werkt een zaad bij en verwijdert het", () => {
    useZaadbankStore.getState().voegZaadToe(basis);
    const id = useZaadbankStore.getState().zaden[0].id;
    useZaadbankStore.getState().updateZaad(id, { aantal: 10 });
    expect(useZaadbankStore.getState().zaden[0].aantal).toBe(10);
    useZaadbankStore.getState().verwijderZaad(id);
    expect(useZaadbankStore.getState().zaden).toHaveLength(0);
  });
});
