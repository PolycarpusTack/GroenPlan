import "@testing-library/jest-dom";

// jsdom mist enkele browser-API's die UI-componenten gebruiken; lichte stubs
// houden route- en componenttests stabiel zonder het gedrag te beïnvloeden.
class WaarnemerStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const g = globalThis as unknown as Record<string, unknown>;
if (!("ResizeObserver" in globalThis)) g.ResizeObserver = WaarnemerStub;
if (!("IntersectionObserver" in globalThis)) g.IntersectionObserver = WaarnemerStub;

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    })) as typeof window.matchMedia;
  }
  if (!window.scrollTo) window.scrollTo = (() => {}) as typeof window.scrollTo;
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
}
