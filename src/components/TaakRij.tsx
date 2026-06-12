import { useState } from "react";
import { Trash2, Pencil, Check, X, Repeat2 } from "lucide-react";
import type { Taak, HerhalingConfig } from "../domain/taken/types";
import type { Zone } from "../domain/tuin/types";
import { herhalingLabel } from "../domain/taken/herhaling";
import { HerhalingEditor } from "./HerhalingEditor";
import { Button } from "./ui";

interface Props {
  taak: Taak;
  zones?: Zone[];
  zoneNaam?: string;
  onToggle: () => void;
  onVerwijder: () => void;
  onBewerk?: (updates: Partial<Pick<Taak, "titel" | "zoneId" | "vervaldatum" | "herhaling">>) => void;
  onZoneKlik?: () => void;
}

function vervaldatumLabel(datum: string): { tekst: string; verlopen: boolean } {
  const vandaag = new Date().toISOString().slice(0, 10);
  if (datum < vandaag) return { tekst: datum, verlopen: true };
  if (datum === vandaag) return { tekst: "Vandaag", verlopen: false };
  return { tekst: datum, verlopen: false };
}

export function TaakRij({ taak, zones = [], zoneNaam, onToggle, onVerwijder, onBewerk, onZoneKlik }: Props) {
  const klaar = taak.status === "klaar";
  const [bewerkModus, setBewerkModus] = useState(false);
  const [bewerkTitel, setBewerkTitel] = useState(taak.titel);
  const [bewerkZoneId, setBewerkZoneId] = useState(taak.zoneId ?? "");
  const [bewerkDatum, setBewerkDatum] = useState(taak.vervaldatum ?? "");
  const [bewerkHerhaling, setBewerkHerhaling] = useState<HerhalingConfig | null>(taak.herhaling);

  const openBewerken = () => {
    setBewerkTitel(taak.titel);
    setBewerkZoneId(taak.zoneId ?? "");
    setBewerkDatum(taak.vervaldatum ?? "");
    setBewerkHerhaling(taak.herhaling);
    setBewerkModus(true);
  };

  const opslaan = () => {
    if (!bewerkTitel.trim()) return;
    onBewerk?.({
      titel: bewerkTitel.trim(),
      zoneId: bewerkZoneId || null,
      vervaldatum: bewerkDatum || null,
      herhaling: bewerkHerhaling,
    });
    setBewerkModus(false);
  };

  const annuleer = () => setBewerkModus(false);

  if (bewerkModus) {
    return (
      <li className="p-3 rounded-md border border-moss-300 bg-moss-50 space-y-2">
        <input
          autoFocus
          type="text"
          value={bewerkTitel}
          onChange={(e) => setBewerkTitel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") opslaan(); if (e.key === "Escape") annuleer(); }}
          className="w-full px-2 py-1.5 text-body border border-[var(--gp-border)] rounded-md bg-white
                     focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          aria-label="Taakomschrijving"
        />
        <div className="flex gap-2 flex-wrap">
          {zones.length > 0 && (
            <select
              value={bewerkZoneId}
              onChange={(e) => setBewerkZoneId(e.target.value)}
              className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1 bg-white
                         focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
            >
              <option value="">– zone –</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.naam}</option>)}
            </select>
          )}
          <input
            type="date"
            value={bewerkDatum}
            onChange={(e) => setBewerkDatum(e.target.value)}
            className="text-body-sm border border-[var(--gp-border)] rounded px-2 py-1 bg-white
                       focus:outline-none focus:shadow-[var(--gp-shadow-focus)]"
          />
        </div>
        <HerhalingEditor waarde={bewerkHerhaling} onChange={setBewerkHerhaling} />
        <div className="flex gap-2 pt-1">
          <Button onClick={opslaan} className="flex items-center gap-1 text-body-sm py-1 px-3">
            <Check size={13} aria-hidden /> Opslaan
          </Button>
          <Button variant="ghost" onClick={annuleer} className="flex items-center gap-1 text-body-sm py-1 px-2">
            <X size={13} aria-hidden />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 p-3 rounded-md border border-[var(--gp-border)] bg-white group">
      <input
        type="checkbox"
        checked={klaar}
        onChange={onToggle}
        className="accent-moss-700 w-5 h-5 shrink-0 cursor-pointer"
        aria-label={klaar ? `Markeer '${taak.titel}' als open` : `Markeer '${taak.titel}' als klaar`}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-body truncate ${klaar ? "line-through text-[var(--gp-text-mute)]" : "text-moss-900"}`}>
          {taak.titel}
        </p>
        <div className="flex flex-wrap gap-2 mt-0.5">
          {zoneNaam && (
            onZoneKlik ? (
              <button onClick={onZoneKlik} className="text-caption text-moss-600 hover:underline">
                {zoneNaam}
              </button>
            ) : (
              <span className="text-caption text-[var(--gp-text-mute)]">{zoneNaam}</span>
            )
          )}
          {taak.vervaldatum && (() => {
            const { tekst, verlopen } = vervaldatumLabel(taak.vervaldatum);
            return (
              <span className={`text-caption ${verlopen && !klaar ? "text-[var(--gp-rust-700)] font-medium" : "text-[var(--gp-text-mute)]"}`}>
                {tekst}
              </span>
            );
          })()}
          {taak.herhaling && (
            <span className="flex items-center gap-1 text-caption text-moss-600 bg-moss-50 border border-moss-200 px-1.5 py-0.5 rounded-full">
              <Repeat2 size={10} aria-hidden />
              {herhalingLabel(taak.herhaling)}
            </span>
          )}
        </div>
      </div>

      {onBewerk && (
        <Button
          variant="ghost"
          onClick={openBewerken}
          className="p-1.5 text-[var(--gp-text-mute)] hover:text-moss-700 shrink-0 md:opacity-0 md:group-hover:opacity-100"
          aria-label={`Bewerk taak '${taak.titel}'`}
        >
          <Pencil size={14} aria-hidden />
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={onVerwijder}
        className="p-1.5 text-[var(--gp-rust-700)] hover:bg-[var(--gp-rust-100)] shrink-0 md:opacity-0 md:group-hover:opacity-100"
        aria-label={`Verwijder taak '${taak.titel}'`}
      >
        <Trash2 size={15} aria-hidden />
      </Button>
    </li>
  );
}
