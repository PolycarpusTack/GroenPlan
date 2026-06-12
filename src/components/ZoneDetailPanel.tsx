import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Leaf, Pencil, ClipboardList, Plus, Check, X, ChevronDown, ChevronRight, MessageSquare, CloudRain, Sprout, BookOpen, SquarePen } from "lucide-react";
import type { Zone, Border, PlantPlaatsing } from "../domain/tuin/types";
import type { AutoFillResultaat } from "../domain/plant/types";
import { useDagboekStore, OBSERVATIE_TYPE_LABEL, OBSERVATIE_TYPE_ICOON } from "../store/dagboek-store";
import type { ObservatieType } from "../domain/dagboek/types";
import { BloomGantt } from "./BloomGantt";
import { CompanionCheckPanel } from "./CompanionCheckPanel";
import { AIArchitectPanel } from "./AIArchitectPanel";
import { ZoneCanvas } from "./ZoneCanvas";
import { berekenBegeleidersCheck } from "../domain/tuin/berekenBegeleidersCheck";
import { berekenSeizoenSuggesties } from "../services/taken/seizoensuggesties";
import { useTakenStore } from "../store/taken-store";
import { useTuinStore } from "../store/tuin-store";
import { Button, Chip } from "./ui";

interface Props {
  zone: Zone;
  plantCatalog: Record<string, AutoFillResultaat>;
  onVerwijderPlant: (plaatsingId: string) => void;
  onBewerk?: () => void;
  onPlantClick?: (wetenschappelijkeNaam: string) => void;
}

function berekenCompanionSuggesties(
  plaatsingen: PlantPlaatsing[],
  catalog: Record<string, AutoFillResultaat>,
): string[] {
  const aanwezig = new Set(plaatsingen.map((p) => p.wetenschappelijkeNaam.toLowerCase()));
  const suggesties = new Set<string>();
  for (const p of plaatsingen) {
    const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
    if (!plant) continue;
    for (const naam of plant.ecologie.begeleiders.waarde.goed) {
      if (!aanwezig.has(naam.toLowerCase())) suggesties.add(naam);
    }
  }
  return [...suggesties].slice(0, 8);
}

function NotitieInline({
  notitie,
  onOpslaan,
}: {
  notitie: string | null;
  onOpslaan: (waarde: string | null) => void;
}) {
  const [open, setOpen] = useState(!!notitie);
  const [waarde, setWaarde] = useState(notitie ?? "");

  const slaOp = () => {
    onOpslaan(waarde.trim() || null);
    if (!waarde.trim()) setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="p-1.5 opacity-50 hover:opacity-100 shrink-0"
        title="Notitie toevoegen"
        aria-label="Notitie toevoegen"
      >
        <MessageSquare size={13} aria-hidden />
      </Button>
    );
  }

  return (
    <div className="w-full px-4 pb-2">
      <textarea
        autoFocus
        value={waarde}
        onChange={(e) => setWaarde(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setWaarde(notitie ?? ""); } }}
        placeholder="Voeg een notitie toe…"
        rows={2}
        className="w-full text-caption px-2 py-1.5 border border-[var(--gp-border)] rounded resize-none
                   focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white"
      />
      <div className="flex gap-1.5 mt-1">
        <Button onClick={slaOp} className="text-caption py-0.5 px-2">Opslaan</Button>
        <Button
          variant="ghost"
          onClick={() => { setOpen(false); setWaarde(notitie ?? ""); }}
          className="text-caption py-0.5 px-2"
        >
          Annuleer
        </Button>
      </div>
    </div>
  );
}

const GROND_LABEL: Record<string, string> = {
  clay: "Klei", sand: "Zand", loam: "Leem", chalk: "Kalk", peat: "Veen",
};
const ZON_LABEL: Record<string, string> = {
  full: "Volle zon", partial: "Halfschaduw", shade: "Schaduw",
};
const DRAINAGE_LABEL: Record<string, string> = {
  "well-drained": "Goed doorlatend", moist: "Vochtig", wet: "Nat",
};

// Kleuren voor borders — cyclisch
const BORDER_KLEUREN = [
  "bg-moss-100 border-moss-300 text-moss-800",
  "bg-bloom-50 border-bloom-200 text-bloom-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-sky-50 border-sky-200 text-sky-800",
  "bg-clay-50 border-clay-200 text-clay-800",
];

function borderKleur(index: number): string {
  return BORDER_KLEUREN[index % BORDER_KLEUREN.length];
}

interface BorderSectieProps {
  border: Border;
  kleurKlasse: string;
  actief: boolean;
  plantPlaatsingen: Zone["plantPlaatsingen"];
  catalog: Record<string, AutoFillResultaat>;
  actieveBorderId: string | null;
  onSetActief: () => void;
  onHernoem: (naam: string) => void;
  onVerwijder: () => void;
  onPlantKlik?: (wetNaam: string) => void;
  onVerwijderPlant: (id: string) => void;
  onVerplaats: (plaatsingId: string, borderId: string | null) => void;
  onSetNotitie: (plaatsingId: string, notitie: string | null) => void;
  alleBorders: Border[];
}

function BorderSectie({
  border, kleurKlasse, actief, plantPlaatsingen, catalog,
  onSetActief, onHernoem, onVerwijder, onPlantKlik, onVerwijderPlant, onVerplaats, onSetNotitie, alleBorders,
}: BorderSectieProps) {
  const [open, setOpen] = useState(true);
  const [bewerkNaam, setBewerkNaam] = useState(false);
  const [nieuweNaam, setNieuweNaam] = useState(border.naam);

  const slaOp = () => {
    if (nieuweNaam.trim()) { onHernoem(nieuweNaam.trim()); setBewerkNaam(false); }
  };

  return (
    <div className={`rounded-lg border ${kleurKlasse} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
          {open
            ? <ChevronDown size={13} aria-hidden />
            : <ChevronRight size={13} aria-hidden />}
          {bewerkNaam ? (
            <input
              autoFocus
              value={nieuweNaam}
              onChange={(e) => setNieuweNaam(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") slaOp(); if (e.key === "Escape") setBewerkNaam(false); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-body-sm font-medium bg-white border border-[var(--gp-border)] rounded px-2 py-0.5
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
          ) : (
            <span className="text-body-sm font-medium truncate">{border.naam}</span>
          )}
          <span className="text-caption opacity-60 shrink-0">· {plantPlaatsingen.length}</span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {bewerkNaam ? (
            <>
              <Button variant="ghost" onClick={slaOp} className="p-1" aria-label="Naam opslaan"><Check size={12} /></Button>
              <Button variant="ghost" onClick={() => setBewerkNaam(false)} className="p-1" aria-label="Annuleer"><X size={12} /></Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setBewerkNaam(true)}
              className="p-1 opacity-60 hover:opacity-100"
              aria-label={`Hernoem border ${border.naam}`}
            >
              <Pencil size={12} aria-hidden />
            </Button>
          )}

          {/* Actief-badge / selecteer-knop */}
          <button
            onClick={onSetActief}
            title={actief ? "Actieve border voor plant toevoegen" : "Maak actief"}
            className={`text-caption px-2 py-0.5 rounded-full border transition-colors ${
              actief
                ? "bg-moss-700 text-white border-moss-700"
                : "bg-white border-[var(--gp-border)] text-[var(--gp-text-mute)] hover:border-moss-400"
            }`}
          >
            {actief ? "Actief" : "Selecteer"}
          </button>

          <Button
            variant="ghost"
            onClick={onVerwijder}
            className="p-1 text-[var(--gp-rust-700)] opacity-60 hover:opacity-100"
            aria-label={`Verwijder border ${border.naam}`}
          >
            <Trash2 size={12} aria-hidden />
          </Button>
        </div>
      </div>

      {/* Plant lijst */}
      {open && (
        <ul className="divide-y divide-white/60 border-t border-current/10">
          {plantPlaatsingen.length === 0 ? (
            <li className="px-4 py-3 text-caption opacity-60 italic">Nog geen planten in deze border.</li>
          ) : (
            plantPlaatsingen.map((p) => {
              const plant = catalog[p.wetenschappelijkeNaam.toLowerCase()];
              const gewoneNaam = plant?.identificatie.gewoneNamen.nl;
              return (
                <li key={p.id} className="bg-white/50">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => onPlantKlik?.(p.wetenschappelijkeNaam)}
                      disabled={!onPlantKlik}
                    >
                      <p className={`gp-scientific text-body-sm text-moss-900 truncate ${onPlantKlik ? "hover:underline" : ""}`}>
                        {p.wetenschappelijkeNaam}
                      </p>
                      {gewoneNaam && <p className="text-caption text-[var(--gp-text-mute)]">{gewoneNaam}</p>}
                      {p.notitie && <p className="text-caption text-moss-600 mt-0.5 italic">{p.notitie}</p>}
                    </button>
                    <NotitieInline notitie={p.notitie} onOpslaan={(n) => onSetNotitie(p.id, n)} />
                    {alleBorders.length > 1 && (
                      <select
                        value={p.borderId ?? ""}
                        onChange={(e) => onVerplaats(p.id, e.target.value || null)}
                        className="text-caption border border-[var(--gp-border)] rounded px-1.5 py-0.5 bg-white
                                   focus:outline-none max-w-[110px] shrink-0"
                        aria-label={`Verplaats ${p.wetenschappelijkeNaam} naar border`}
                      >
                        <option value="">Geen border</option>
                        {alleBorders.map((b) => (
                          <option key={b.id} value={b.id}>{b.naam}</option>
                        ))}
                      </select>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => onVerwijderPlant(p.id)}
                      className="p-1.5 text-[var(--gp-rust-700)] hover:bg-[var(--gp-rust-100)] shrink-0"
                      aria-label={`Verwijder ${p.wetenschappelijkeNaam}`}
                    >
                      <Trash2 size={13} aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

const ZONE_LOG_TYPES: ObservatieType[] = [
  "bloei", "groei", "plaag", "ziekte", "snoei", "bemesting", "overwintering", "overig",
];
const VANDAAG_ISO = new Date().toISOString().slice(0, 10);

export function ZoneDetailPanel({ zone, plantCatalog, onVerwijderPlant, onBewerk, onPlantClick }: Props) {
  const navigate = useNavigate();
  const hardheid = useTuinStore((s) => s.tuin.hardheid);
  const actieveBorderId = useTuinStore((s) => s.actieveBorderId);
  const setActieveBorder = useTuinStore((s) => s.setActieveBorder);
  const voegBorderToe = useTuinStore((s) => s.voegBorderToe);
  const hernoemBorder = useTuinStore((s) => s.hernoemBorder);
  const verwijderBorder = useTuinStore((s) => s.verwijderBorder);
  const verplaatsPlantNaarBorder = useTuinStore((s) => s.verplaatsPlantNaarBorder);

  const setPlantNotitie = useTuinStore((s) => s.setPlantNotitie);
  const voegObservatieToe = useDagboekStore((s) => s.voegObservatieToe);
  const voegTaakToe = useTakenStore((s) => s.voegTaakToe);
  const alleObservaties = useDagboekStore((s) => s.observaties);
  const zoneObservaties = useMemo(
    () => alleObservaties.filter((o) => o.zoneId === zone.id).slice(0, 4),
    [alleObservaties, zone.id],
  );

  const [logOpen, setLogOpen] = useState(false);
  const [logType, setLogType] = useState<ObservatieType>("overig");
  const [logTekst, setLogTekst] = useState("");
  const [logDatum, setLogDatum] = useState(VANDAAG_ISO);

  const [taakOpen, setTaakOpen] = useState(false);
  const [taakTitel, setTaakTitel] = useState("");
  const [taakDatum, setTaakDatum] = useState("");

  const slaLogOp = () => {
    if (!logTekst.trim()) return;
    voegObservatieToe({
      datum: logDatum,
      type: logType,
      tekst: logTekst.trim(),
      zoneId: zone.id,
      wetenschappelijkeNaam: null,
      afbeeldingUrl: null,
    });
    setLogTekst("");
    setLogOpen(false);
  };

  const slaTaakOp = () => {
    if (!taakTitel.trim()) return;
    voegTaakToe({ titel: taakTitel.trim(), zoneId: zone.id, vervaldatum: taakDatum || null, herhaling: null });
    setTaakTitel("");
    setTaakDatum("");
    setTaakOpen(false);
  };

  const openTakenCount = useTakenStore(
    (s) => s.taken.filter((t) => t.zoneId === zone.id && t.status === "open").length,
  );

  const [nieuweBorderNaam, setNieuweBorderNaam] = useState("");
  const [borderFormulierOpen, setBorderFormulierOpen] = useState(false);

  const seizoenSuggesties = berekenSeizoenSuggesties(zone.plantPlaatsingen, plantCatalog, zone.id);
  const bestaandeTaakTitels = useTakenStore.getState().taken
    .filter((t) => t.zoneId === zone.id && t.status === "open")
    .map((t) => t.titel.toLowerCase());
  const openSeizoenSuggesties = seizoenSuggesties.filter(
    (s) => !bestaandeTaakTitels.some((t) => t.includes(s.titel.toLowerCase().slice(0, 20))),
  );

  const companionResultaten = berekenBegeleidersCheck(zone.plantPlaatsingen, plantCatalog);
  const aantalParen = zone.plantPlaatsingen.length * (zone.plantPlaatsingen.length - 1) / 2;

  const handleVoegBorderToe = () => {
    const naam = nieuweBorderNaam.trim();
    if (!naam) return;
    voegBorderToe(zone.id, naam);
    setNieuweBorderNaam("");
    setBorderFormulierOpen(false);
  };

  // Groepeer planten per border + zonder border
  const plantenPerBorder = (borderId: string | null) =>
    zone.plantPlaatsingen.filter((p) => p.borderId === borderId);

  const heeftBorders = zone.borders.length > 0;

  return (
    <div className="mt-6 border-t border-[var(--gp-border)] pt-6 space-y-6">

      {/* Zone-eigenschappen */}
      <div className="flex flex-wrap gap-2 items-center">
        {onBewerk && (
          <Button
            variant="ghost"
            onClick={onBewerk}
            className="p-1.5 text-[var(--gp-text-mute)] hover:text-moss-700"
            aria-label={`Bewerk zone ${zone.naam}`}
          >
            <Pencil size={15} aria-hidden />
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => { setLogOpen((v) => !v); setTaakOpen(false); }}
          className={`p-1.5 hover:text-moss-700 ${logOpen ? "text-moss-700" : "text-[var(--gp-text-mute)]"}`}
          aria-label={`Log observatie voor ${zone.naam}`}
          title="Log observatie"
        >
          <BookOpen size={15} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          onClick={() => { setTaakOpen((v) => !v); setLogOpen(false); }}
          className={`p-1.5 hover:text-moss-700 ${taakOpen ? "text-moss-700" : "text-[var(--gp-text-mute)]"}`}
          aria-label={`Taak toevoegen voor ${zone.naam}`}
          title="Taak toevoegen"
        >
          <SquarePen size={15} aria-hidden />
        </Button>
        <Chip tone="good">{GROND_LABEL[zone.grondsoort] ?? zone.grondsoort}</Chip>
        <Chip tone="good">{ZON_LABEL[zone.zon] ?? zone.zon}</Chip>
        <Chip tone="good">{DRAINAGE_LABEL[zone.drainage] ?? zone.drainage}</Chip>
        {zone.pH != null && <Chip tone="good">pH {zone.pH}</Chip>}
        {zone.gemeente && (
          <Chip tone="good" className="flex items-center gap-1">
            <CloudRain size={10} aria-hidden />
            {zone.gemeente}{zone.regenval_mm_7d != null ? ` · ${zone.regenval_mm_7d} mm` : ""}
          </Chip>
        )}
        {openTakenCount > 0 && (
          <span className="flex items-center gap-1 text-caption text-moss-700 bg-moss-50 border border-moss-200 rounded-full px-2.5 py-0.5">
            <ClipboardList size={11} aria-hidden />
            {openTakenCount} open {openTakenCount === 1 ? "taak" : "taken"}
          </span>
        )}
      </div>

      {/* Zone canvas */}
      {zone.plantPlaatsingen.length > 0 && (
        <div>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-3">Indeling</p>
          <ZoneCanvas
            plaatsingen={zone.plantPlaatsingen}
            catalog={plantCatalog}
            borders={zone.borders}
            onPlantClick={onPlantClick}
          />
        </div>
      )}

      {/* Bloeigantt */}
      {(() => {
        const ganttRijen = zone.plantPlaatsingen
          .map((p) => {
            const plant = plantCatalog[p.wetenschappelijkeNaam.toLowerCase()];
            return { naam: p.wetenschappelijkeNaam, gewoneNaam: plant?.identificatie.gewoneNamen.nl, maanden: plant?.bloei.maanden.waarde ?? [] };
          })
          .filter((r) => r.maanden.length > 0);
        return ganttRijen.length > 0 ? (
          <div className="p-3 border border-[var(--gp-border)] rounded-md bg-[var(--gp-surface-alt)]">
            <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-3">Bloeiperiodes</p>
            <BloomGantt rijen={ganttRijen} />
          </div>
        ) : null;
      })()}

      {/* Borders + planten */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-heading-sm text-[var(--gp-text-mute)] uppercase tracking-wide">
            {heeftBorders ? "Borders" : `Planten in ${zone.naam}`}
          </h3>
          <Button
            variant="ghost"
            onClick={() => setBorderFormulierOpen((v) => !v)}
            className="text-caption text-moss-600 flex items-center gap-1 py-1"
          >
            <Plus size={13} aria-hidden />
            Border toevoegen
          </Button>
        </div>

        {/* Nieuw-border formulier */}
        {borderFormulierOpen && (
          <div className="flex gap-2 mb-3">
            <input
              autoFocus
              type="text"
              value={nieuweBorderNaam}
              onChange={(e) => setNieuweBorderNaam(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleVoegBorderToe(); if (e.key === "Escape") setBorderFormulierOpen(false); }}
              placeholder="bijv. Border Noord"
              className="flex-1 px-3 py-1.5 text-body-sm border border-[var(--gp-border)] rounded-md
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
            <Button onClick={handleVoegBorderToe} className="text-body-sm py-1.5 px-3">
              Toevoegen
            </Button>
            <Button variant="ghost" onClick={() => setBorderFormulierOpen(false)} className="p-1.5">
              <X size={15} aria-hidden />
            </Button>
          </div>
        )}

        {/* Borders */}
        {heeftBorders ? (
          <div className="space-y-3">
            {zone.borders.map((border, i) => (
              <BorderSectie
                key={border.id}
                border={border}
                kleurKlasse={borderKleur(i)}
                actief={actieveBorderId === border.id}
                plantPlaatsingen={plantenPerBorder(border.id)}
                catalog={plantCatalog}
                actieveBorderId={actieveBorderId}
                onSetActief={() => setActieveBorder(actieveBorderId === border.id ? null : border.id)}
                onHernoem={(naam) => hernoemBorder(zone.id, border.id, naam)}
                onVerwijder={() => verwijderBorder(zone.id, border.id)}
                onPlantKlik={onPlantClick}
                onVerwijderPlant={onVerwijderPlant}
                onVerplaats={(plaatsingId, borderId) => verplaatsPlantNaarBorder(zone.id, plaatsingId, borderId)}
                onSetNotitie={(plaatsingId, notitie) => setPlantNotitie(zone.id, plaatsingId, notitie)}
                alleBorders={zone.borders}
              />
            ))}

            {/* Planten zonder border */}
            {plantenPerBorder(null).length > 0 && (
              <div className="rounded-lg border border-[var(--gp-border)] overflow-hidden">
                <p className="px-3 py-2 text-body-sm font-medium text-[var(--gp-text-mute)] border-b border-[var(--gp-border)]">
                  Zonder border · {plantenPerBorder(null).length}
                </p>
                <ul className="divide-y divide-[var(--gp-border)]">
                  {plantenPerBorder(null).map((p) => {
                    const plant = plantCatalog[p.wetenschappelijkeNaam.toLowerCase()];
                    const gewoneNaam = plant?.identificatie.gewoneNamen.nl;
                    return (
                      <li key={p.id} className="flex items-center gap-2 px-4 py-2 bg-white">
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => onPlantClick?.(p.wetenschappelijkeNaam)}
                          disabled={!onPlantClick}
                        >
                          <p className={`gp-scientific text-body-sm text-moss-900 truncate ${onPlantClick ? "hover:underline" : ""}`}>
                            {p.wetenschappelijkeNaam}
                          </p>
                          {gewoneNaam && <p className="text-caption text-[var(--gp-text-mute)]">{gewoneNaam}</p>}
                          {p.notitie && <p className="text-caption text-moss-600 mt-0.5 italic">{p.notitie}</p>}
                        </button>
                        <NotitieInline notitie={p.notitie} onOpslaan={(n) => setPlantNotitie(zone.id, p.id, n)} />
                        <select
                          value=""
                          onChange={(e) => verplaatsPlantNaarBorder(zone.id, p.id, e.target.value || null)}
                          className="text-caption border border-[var(--gp-border)] rounded px-1.5 py-0.5 bg-white
                                     focus:outline-none max-w-[110px] shrink-0"
                          aria-label={`Wijs ${p.wetenschappelijkeNaam} toe aan border`}
                        >
                          <option value="">Wijs toe…</option>
                          {zone.borders.map((b) => (
                            <option key={b.id} value={b.id}>{b.naam}</option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          onClick={() => onVerwijderPlant(p.id)}
                          className="p-1.5 text-[var(--gp-rust-700)] hover:bg-[var(--gp-rust-100)] shrink-0"
                          aria-label={`Verwijder ${p.wetenschappelijkeNaam}`}
                        >
                          <Trash2 size={13} aria-hidden />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Geen borders — flat lijst (origineel gedrag) */
          zone.plantPlaatsingen.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center border-2 border-dashed border-[var(--gp-border)] rounded-xl">
              <Leaf size={28} className="text-[var(--gp-mute)] mb-2" aria-hidden />
              <p className="text-body text-[var(--gp-text-mute)]">
                Nog geen planten. Ontdek planten en voeg ze toe aan deze zone.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {zone.plantPlaatsingen.map((p) => {
                const plant = plantCatalog[p.wetenschappelijkeNaam.toLowerCase()];
                const gewoneNaam = plant?.identificatie.gewoneNamen.nl;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-4 p-3 rounded-md border border-[var(--gp-border)] bg-white">
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => onPlantClick?.(p.wetenschappelijkeNaam)}
                      disabled={!onPlantClick}
                    >
                      <p className={`gp-scientific text-body text-moss-900 truncate ${onPlantClick ? "hover:underline cursor-pointer" : ""}`}>
                        {p.wetenschappelijkeNaam}
                      </p>
                      {gewoneNaam && <p className="text-body-sm text-[var(--gp-text-mute)]">{gewoneNaam}</p>}
                      <p className="text-caption text-[var(--gp-text-mute)]">
                        {p.geplaatst.toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {p.notitie && <p className="text-caption text-moss-600 mt-0.5 italic">{p.notitie}</p>}
                    </button>
                    <NotitieInline notitie={p.notitie} onOpslaan={(n) => setPlantNotitie(zone.id, p.id, n)} />
                    <Button
                      variant="ghost"
                      onClick={() => onVerwijderPlant(p.id)}
                      className="p-1.5 text-[var(--gp-rust-700)] hover:bg-[var(--gp-rust-100)] shrink-0"
                      aria-label={`Verwijder ${p.wetenschappelijkeNaam} uit zone`}
                    >
                      <Trash2 size={16} aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )
        )}
      </div>

      {/* Inline observatie log */}
      {logOpen && (
        <div className="p-3 rounded-md border border-moss-300 bg-moss-50 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={logDatum}
              onChange={(e) => setLogDatum(e.target.value)}
              className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value as ObservatieType)}
              className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            >
              {ZONE_LOG_TYPES.map((t) => (
                <option key={t} value={t}>{OBSERVATIE_TYPE_ICOON[t]} {OBSERVATIE_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <textarea
            autoFocus
            value={logTekst}
            onChange={(e) => setLogTekst(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setLogOpen(false); }}
            placeholder={`Observatie voor ${zone.naam}…`}
            rows={2}
            className="w-full px-2 py-1.5 text-body-sm border border-[var(--gp-border)] rounded resize-none
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)] bg-white"
          />
          <div className="flex gap-2">
            <Button onClick={slaLogOp} className="text-body-sm py-1 px-3 flex items-center gap-1">
              <Check size={13} aria-hidden /> Opslaan
            </Button>
            <Button variant="ghost" onClick={() => setLogOpen(false)} className="text-body-sm py-1 px-2">
              <X size={13} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/dagboek")}
              className="text-body-sm py-1 px-2 text-moss-600 ml-auto"
            >
              Alle observaties →
            </Button>
          </div>
        </div>
      )}

      {/* Snelle taak toevoegen */}
      {taakOpen && (
        <div className="p-3 rounded-md border border-moss-300 bg-moss-50 space-y-2">
          <p className="text-caption font-medium text-moss-800">Taak voor {zone.naam}</p>
          <div className="flex gap-2 flex-wrap">
            <input
              autoFocus
              type="text"
              value={taakTitel}
              onChange={(e) => setTaakTitel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") slaTaakOp(); if (e.key === "Escape") setTaakOpen(false); }}
              placeholder="bijv. Lavendel snoeien"
              className="flex-1 min-w-40 text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
            <input
              type="date"
              value={taakDatum}
              onChange={(e) => setTaakDatum(e.target.value)}
              className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1.5 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={slaTaakOp} className="text-body-sm py-1 px-3 flex items-center gap-1">
              <Check size={13} aria-hidden /> Opslaan
            </Button>
            <Button variant="ghost" onClick={() => setTaakOpen(false)} className="text-body-sm py-1 px-2">
              <X size={13} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Zone observaties */}
      {zoneObservaties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen size={11} aria-hidden />
              Recente observaties
            </p>
            <button onClick={() => navigate("/dagboek")} className="text-caption text-moss-600 hover:underline">
              Alle →
            </button>
          </div>
          <ul className="space-y-1.5">
            {zoneObservaties.map((o) => (
              <li key={o.id} className="flex gap-2 px-3 py-2 rounded-md border border-[var(--gp-border)] bg-white text-body-sm">
                <span className="shrink-0" aria-hidden>{OBSERVATIE_TYPE_ICOON[o.type]}</span>
                <span className="flex-1 truncate text-moss-900">{o.tekst}</span>
                {o.wetenschappelijkeNaam && (
                  <button
                    onClick={() => onPlantClick?.(o.wetenschappelijkeNaam!)}
                    className="gp-scientific text-caption text-moss-600 shrink-0 hover:underline truncate max-w-[120px]"
                  >
                    {o.wetenschappelijkeNaam}
                  </button>
                )}
                <span className="text-caption text-[var(--gp-text-mute)] shrink-0">{o.datum}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seizoenssuggesties */}
      {openSeizoenSuggesties.length > 0 && (
        <div>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ClipboardList size={11} aria-hidden />
            Seizoenstaken ({new Date().toLocaleDateString("nl-BE", { month: "long" })})
          </p>
          <ul className="space-y-1.5">
            {openSeizoenSuggesties.map((s) => (
              <li
                key={`${s.wetenschappelijkeNaam}-${s.titel}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--gp-border)] bg-amber-50 border-amber-200"
              >
                <span className="flex-1 text-body-sm text-amber-900 truncate">{s.titel}</span>
                <Button
                  variant="ghost"
                  onClick={() => voegTaakToe({ titel: s.titel, zoneId: zone.id, vervaldatum: null, herhaling: null })}
                  className="text-caption text-moss-700 border border-moss-300 hover:bg-moss-50 py-0.5 px-2 shrink-0"
                  aria-label={`Voeg taak toe: ${s.titel}`}
                >
                  + Taak
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Companion suggesties */}
      {zone.plantPlaatsingen.length > 0 && (() => {
        const suggesties = berekenCompanionSuggesties(zone.plantPlaatsingen, plantCatalog);
        if (suggesties.length === 0) return null;
        return (
          <div>
            <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Sprout size={11} aria-hidden />
              Goede begeleiders voor deze zone
            </p>
            <div className="flex flex-wrap gap-2">
              {suggesties.map((naam) => (
                <button
                  key={naam}
                  onClick={() => navigate(`/ontdek?zoek=${encodeURIComponent(naam)}`)}
                  className="gp-scientific text-caption px-2.5 py-1 rounded-full border border-moss-300
                             bg-moss-50 text-moss-800 hover:bg-moss-100 hover:border-moss-400 transition-colors"
                  title={`Zoek ${naam} in Ontdek`}
                >
                  {naam}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Begeleiderscheck */}
      {zone.plantPlaatsingen.length >= 2 && (
        <div>
          <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Begeleiderscheck</p>
          <CompanionCheckPanel resultaten={companionResultaten} aantalParen={aantalParen} />
        </div>
      )}

      {/* AI tuinadvies */}
      <AIArchitectPanel zone={zone} plantCatalog={plantCatalog} hardheid={hardheid} />
    </div>
  );
}
