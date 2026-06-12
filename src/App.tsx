import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavRail } from "./components/NavRail";
import { BottomNav } from "./components/BottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { Spinner } from "./components/Spinner";
import { NietGevonden } from "./pages/NietGevonden";

// Route-pagina's lazy geladen → kleinere initiële bundle + code-split per route.
// (Pagina's zijn named exports, dus mappen naar { default }.)
const DashboardPagina = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.DashboardPagina })));
const OntdekPagina = lazy(() => import("./pages/Ontdek").then((m) => ({ default: m.OntdekPagina })));
const TuinkaartPagina = lazy(() => import("./pages/Tuinkaart").then((m) => ({ default: m.TuinkaartPagina })));
const TakenPagina = lazy(() => import("./pages/Taken").then((m) => ({ default: m.TakenPagina })));
const PlantDetailPagina = lazy(() => import("./pages/PlantDetail").then((m) => ({ default: m.PlantDetailPagina })));
const CatalogusPagina = lazy(() => import("./pages/Catalogus").then((m) => ({ default: m.CatalogusPagina })));
const BloemKalenderPagina = lazy(() => import("./pages/BloemKalenderPagina").then((m) => ({ default: m.BloemKalenderPagina })));
const DagboekPagina = lazy(() => import("./pages/Dagboek").then((m) => ({ default: m.DagboekPagina })));
const BodemMetingenPagina = lazy(() => import("./pages/BodemMetingen").then((m) => ({ default: m.BodemMetingenPagina })));
const ZaadbankPagina = lazy(() => import("./pages/Zaadbank").then((m) => ({ default: m.ZaadbankPagina })));
const VeldModusPagina = lazy(() => import("./pages/VeldModus").then((m) => ({ default: m.VeldModusPagina })));
const GidsPagina = lazy(() => import("./pages/Gids").then((m) => ({ default: m.GidsPagina })));

function PaginaLader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Pagina laden">
      <Spinner size={24} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[var(--gp-bg)]">
        <NavRail />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <OfflineBanner />
          <ErrorBoundary>
            <Suspense fallback={<PaginaLader />}>
              <Routes>
                <Route path="/" element={<DashboardPagina />} />
                <Route path="/ontdek" element={<OntdekPagina />} />
                <Route path="/tuinkaart" element={<TuinkaartPagina />} />
                <Route path="/taken" element={<TakenPagina />} />
                <Route path="/plant/:wetNaam" element={<PlantDetailPagina />} />
                <Route path="/catalogus" element={<CatalogusPagina />} />
                <Route path="/kalender" element={<BloemKalenderPagina />} />
                <Route path="/dagboek" element={<DagboekPagina />} />
                <Route path="/bodem" element={<BodemMetingenPagina />} />
                <Route path="/zaadbank" element={<ZaadbankPagina />} />
                <Route path="/veld" element={<VeldModusPagina />} />
                <Route path="/gids" element={<GidsPagina />} />
                <Route path="*" element={<NietGevonden />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
