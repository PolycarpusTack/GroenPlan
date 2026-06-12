// Registreert de Service Worker — alleen in productie, om stale caching tijdens
// `vite dev` te vermijden (Vite serveert daar onversiede modules via HMR).
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* stil falen — offline-ondersteuning is progressieve verbetering */
    });
  });
}
