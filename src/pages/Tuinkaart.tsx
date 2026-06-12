import { useMemo, useState } from "react";
import { Plus, Sun, Droplets, Layers, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ZoneFormulier } from "../components/ZoneFormulier";
import { ZoneDetailPanel } from "../components/ZoneDetailPanel";
import { MobileSheet } from "../components/MobileSheet";
import { TuinkaartSVG } from "../components/TuinkaartSVG";
import { zoneOppervlakte } from "../domain/tuin/tuin";
import { useTuinStore } from "../store/tuin-store";
import { useTakenStore } from "../store/taken-store";
import { berekenZoneAandacht } from "../domain/tuin/berekenZoneAandacht";
import type { Zone, ZoneInput } from "../domain/tuin/types";
import { Button } from "../components/ui";

// ── Overlay tab definitie ──────────────────────────────────────────────────

type OverlayTab = "kaart" | "zon" | "irrigatie" | "bodem";

const TABS: { id: OverlayTab; label: string; icoon: React.ReactNode }[] = [
  { id: "kaart",     label: "Kaart",         icoon: <Map size={14} /> },
  { id: "zon",       label: "Zon & schaduw",  icoon: <Sun size={14} /> },
  { id: "irrigatie", label: "Irrigatie",      icoon: <Droplets size={14} /> },
  { id: "bodem",     label: "Bodem",          icoon: <Layers size={14} /> },
];

// ── Legenda per overlay ────────────────────────────────────────────────────

function OverlayLegenda({ overlay }: { overlay: OverlayTab }) {
  if (overlay === "kaart") return null;

  const items =
    overlay === "zon"
      ? [
          { dot: "bg-amber-400", label: "Volle zon" },
          { dot: "bg-amber-200", label: "Halfschaduw" },
          { dot: "bg-slate-300", label: "Schaduw" },
        ]
      : overlay === "irrigatie"
      ? [
          { dot: "bg-moss-400",  label: "Goed doorlatend" },
          { dot: "bg-sky-400",   label: "Vochtig" },
          { dot: "bg-blue-500",  label: "Nat" },
        ]
      : [
          { dot: "bg-amber-400", label: "Klei" },
          { dot: "bg-yellow-300",label: "Zand" },
          { dot: "bg-moss-400",  label: "Leem" },
          { dot: "bg-slate-400", label: "Kalk" },
          { dot: "bg-clay-500",  label: "Veen" },
        ];

  return (
    <div className="flex flex-wrap gap-3 mb-4 p-3 bg-[var(--gp-surface-alt)] rounded-lg border border-[var(--gp-border)]">
      {items.map(({ dot, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-caption text-[var(--gp-text-mute)]">
          <span className={`inline-block w-3 h-3 rounded-full ${dot}`} aria-hidden />
          {label}
        </span>
      ))}
      {overlay === "bodem" && (
        <span className="text-caption text-[var(--gp-text-mute)] italic ml-auto">
          Klik een zone voor pH-detail
        </span>
      )}
    </div>
  );
}

const GROND_LABEL: Record<string, string> = { clay: "Klei", sand: "Zand", loam: "Leem", chalk: "Kalk", peat: "Veen" };
const ZON_LABEL: Record<string, string> = { full: "Volle zon", partial: "Halfschaduw", shade: "Schaduw" };
const DRAIN_LABEL: Record<string, string> = { "well-drained": "Goed doorlatend", moist: "Vochtig", wet: "Nat" };

// ── Pagina ─────────────────────────────────────────────────────────────────

export function TuinkaartPagina() {
  const navigate = useNavigate();
  const {
    tuin, actieveZoneId, plantCatalog,
    voegZoneToe, updateZone, verwijderZone, setActieveZone, verwijderPlantUitZone,
  } = useTuinStore();
  const actieveZone = tuin.zones.find((z) => z.id === actieveZoneId) ?? null;
  const taken = useTakenStore((s) => s.taken);

  // Aandachtspunten per zone: droogte + achterstallige taken (begeleiders-
  // conflicten berekent TuinkaartSVG zelf).
  const aandacht = useMemo(
    () => berekenZoneAandacht(tuin.zones, taken, new Date().toISOString().slice(0, 10)),
    [tuin.zones, taken],
  );

  const totaleOppervlakte = useMemo(() => {
    const opps = tuin.zones.map(zoneOppervlakte);
    return opps.length > 0 && opps.every((o) => o !== null)
      ? Math.round(opps.reduce((a, b) => a! + b!, 0)! )
      : null;
  }, [tuin.zones]);

  const [formulierOpen, setFormulierOpen] = useState(false);
  const [bewerkZone, setBewerkZone] = useState<Zone | null>(null);
  const [actieveTab, setActieveTab] = useState<OverlayTab>("kaart");
  const [bevestigVerwijder, setBevestigVerwijder] = useState<string | null>(null);

  const handleNieuweZone = (zone: ZoneInput) => { voegZoneToe(zone); setFormulierOpen(false); };
  const handleUpdateZone = (zone: ZoneInput) => { updateZone(zone); setBewerkZone(null); };
  const openBewerkFormulier = (zone: Zone) => { setFormulierOpen(false); setBewerkZone(zone); };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-display-md text-moss-900">{tuin.naam}</h1>
          <p className="text-body text-moss-500">
            {tuin.zones.length} zone{tuin.zones.length !== 1 ? "s" : ""}
            {totaleOppervlakte !== null && ` · ${totaleOppervlakte} m²`} · hardheidszone {tuin.hardheid}
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => { setBewerkZone(null); setFormulierOpen(true); }}
        >
          <Plus size={16} aria-hidden />
          Zone toevoegen
        </Button>
      </div>

      {/* Overlay-tabs */}
      {tuin.zones.length > 0 && (
        <div className="flex gap-1 mb-5 p-1 bg-[var(--gp-surface-alt)] rounded-lg border border-[var(--gp-border)] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActieveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors
                ${actieveTab === tab.id
                  ? "bg-white text-moss-900 shadow-sm"
                  : "text-[var(--gp-text-mute)] hover:text-moss-700"}`}
            >
              {tab.icoon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Formulieren */}
      <MobileSheet open={formulierOpen} onSluit={() => setFormulierOpen(false)}>
        <div className="mb-8 md:mb-8">
          <ZoneFormulier onOpslaan={handleNieuweZone} onAnnuleer={() => setFormulierOpen(false)} />
        </div>
      </MobileSheet>
      <MobileSheet open={!!bewerkZone} onSluit={() => setBewerkZone(null)}>
        {bewerkZone && (
          <div className="mb-8 md:mb-8">
            <ZoneFormulier bestaandeZone={bewerkZone} onOpslaan={handleUpdateZone} onAnnuleer={() => setBewerkZone(null)} />
          </div>
        )}
      </MobileSheet>

      {/* Plattegrond + zone-detail */}
      {tuin.zones.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--gp-border)] rounded-xl">
          <p className="text-body text-[var(--gp-text-mute)] mb-4">Nog geen zones. Voeg je eerste zone toe.</p>
          <Button variant="secondary" className="flex items-center gap-2 mx-auto" onClick={() => setFormulierOpen(true)}>
            <Plus size={16} aria-hidden /> Zone toevoegen
          </Button>
        </div>
      ) : (
        <>
          {actieveTab !== "kaart" && <OverlayLegenda overlay={actieveTab} />}

          <TuinkaartSVG
            zones={tuin.zones}
            overlay={actieveTab}
            actieveZoneId={actieveZoneId}
            catalog={plantCatalog}
            aandacht={aandacht}
            onZoneClick={(id) => { setActieveZone(id === actieveZoneId ? null : id); setBevestigVerwijder(null); }}
          />

          {/* Geselecteerde zone — volledige detail in kaartmodus */}
          {actieveZone && actieveTab === "kaart" && (
            <div className="mt-4">
              <div className="flex items-center justify-end mb-2">
                {bevestigVerwijder === actieveZone.id ? (
                  <span className="flex items-center gap-2 text-caption">
                    <span className="text-[var(--gp-rust-700)] font-medium">Zone + planten verwijderen?</span>
                    <Button
                      variant="ghost"
                      className="text-caption text-[var(--gp-rust-700)] py-1 px-2"
                      onClick={() => { verwijderZone(actieveZone.id); setBevestigVerwijder(null); }}
                    >
                      Ja, verwijder
                    </Button>
                    <Button variant="ghost" className="text-caption py-1 px-2" onClick={() => setBevestigVerwijder(null)}>
                      Annuleer
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-body-sm text-[var(--gp-rust-700)]"
                    onClick={() => setBevestigVerwijder(actieveZone.id)}
                  >
                    Verwijder zone
                  </Button>
                )}
              </div>
              <ZoneDetailPanel
                zone={actieveZone}
                plantCatalog={plantCatalog}
                onVerwijderPlant={(id) => verwijderPlantUitZone(actieveZone.id, id)}
                onBewerk={() => openBewerkFormulier(actieveZone)}
                onPlantClick={(wetNaam) => navigate(`/plant/${encodeURIComponent(wetNaam)}`)}
              />
            </div>
          )}

          {/* Geselecteerde zone — compacte property-lijst in overlay-modus (read-only) */}
          {actieveZone && actieveTab !== "kaart" && (
            <div className="mt-6 border-t border-[var(--gp-border)] pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-heading-lg text-moss-900">{actieveZone.naam}</h2>
                <Button variant="secondary" onClick={() => setActieveTab("kaart")} className="text-body-sm">
                  Kaartweergave + bewerken →
                </Button>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-body-sm">
                {[
                  { label: "Grondsoort", waarde: GROND_LABEL[actieveZone.grondsoort] ?? actieveZone.grondsoort },
                  { label: "Zonlicht", waarde: ZON_LABEL[actieveZone.zon] ?? actieveZone.zon },
                  { label: "Drainage", waarde: DRAIN_LABEL[actieveZone.drainage] ?? actieveZone.drainage },
                  ...(actieveZone.breedte_m != null && actieveZone.diepte_m != null
                    ? [{ label: "Afmetingen", waarde: `${actieveZone.breedte_m} × ${actieveZone.diepte_m} m (${Math.round(actieveZone.breedte_m * actieveZone.diepte_m * 10) / 10} m²)` }]
                    : []),
                  ...(actieveZone.pH != null ? [{ label: "pH", waarde: String(actieveZone.pH) }] : []),
                  ...(actieveZone.gemeente ? [{ label: "Gemeente", waarde: actieveZone.gemeente }] : []),
                  ...(actieveZone.regenval_mm_7d != null ? [{ label: "Neerslag (7d)", waarde: `${actieveZone.regenval_mm_7d} mm` }] : []),
                ].map(({ label, waarde }) => (
                  <div key={label} className="gp-card-bordered py-2">
                    <dt className="text-caption text-[var(--gp-text-mute)]">{label}</dt>
                    <dd className="font-medium text-moss-900 mt-0.5">{waarde}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-caption text-[var(--gp-text-mute)]">
                {actieveZone.plantPlaatsingen.length} plant{actieveZone.plantPlaatsingen.length !== 1 ? "en" : ""} · Overlay-tabs zijn read-only. Gebruik Kaartweergave om planten te bewerken.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
