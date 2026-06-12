import { useState, useRef } from "react";
import { Camera, Loader2, CheckCircle2, ChevronRight, X } from "lucide-react";
import { getPlantNetService } from "../services/plantnet/plantnet-service";
import { valideerAfbeelding, BEELD_PRIVACY_NOTE } from "../services/media/afbeelding";
import type { PlantNetSuggestie } from "../services/plantnet/types";
import { Button } from "./ui";

interface Props {
  onSelecteer: (wetenschappelijkeNaam: string) => void;
  onSluit: () => void;
}

function ZekerheidBalk({ waarde }: { waarde: number }) {
  const pct = Math.round(waarde * 100);
  const kleur =
    pct >= 80 ? "bg-moss-600" : pct >= 60 ? "bg-moss-400" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--gp-border)]">
        <div className={`h-full rounded-full ${kleur}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-caption text-[var(--gp-text-mute)] w-8 text-right">{pct}%</span>
    </div>
  );
}

export function FotoIdentificatiePanel({ onSelecteer, onSluit }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [suggesties, setSuggesties] = useState<PlantNetSuggestie[]>([]);
  const [bron, setBron] = useState<"online" | "lokaal" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const verwerkBestand = async (bestand: File) => {
    const validatieFout = valideerAfbeelding(bestand);
    if (validatieFout) {
      setFout(validatieFout);
      return;
    }

    const url = URL.createObjectURL(bestand);
    setPreview(url);
    setSuggesties([]);
    setBron(null);
    setFout(null);
    setLaden(true);

    try {
      const service = getPlantNetService();
      const resultaat = await service.identificeer(bestand);
      setSuggesties(resultaat.suggesties);
      setBron(resultaat.bron ?? null);
    } catch {
      setFout("Identificatie mislukt. Probeer een scherpere foto.");
    } finally {
      setLaden(false);
    }
  };

  const handleBestandsKeuze = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bestand = e.target.files?.[0];
    if (bestand) verwerkBestand(bestand);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const bestand = e.dataTransfer.files[0];
    if (bestand) verwerkBestand(bestand);
  };

  const reset = () => {
    setPreview(null);
    setSuggesties([]);
    setFout(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="border border-[var(--gp-border)] rounded-lg bg-[var(--gp-surface-alt)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gp-border)] bg-white">
        <div className="flex items-center gap-2">
          <Camera size={15} className="text-moss-600" aria-hidden />
          <span className="text-body-sm font-medium text-moss-900">Identificeer via foto</span>
        </div>
        <Button
          variant="ghost"
          onClick={onSluit}
          className="p-1 text-[var(--gp-text-mute)]"
          aria-label="Sluit foto-identificatie"
        >
          <X size={15} aria-hidden />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload zone */}
        {!preview && (
          <div
            className="border-2 border-dashed border-[var(--gp-border)] rounded-lg p-8 text-center cursor-pointer
                       hover:border-moss-400 hover:bg-white transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label="Kies of sleep een plantfoto"
          >
            <Camera size={28} className="text-[var(--gp-mute)] mx-auto mb-2" aria-hidden />
            <p className="text-body-sm text-moss-700 font-medium mb-1">Kies een foto</p>
            <p className="text-caption text-[var(--gp-text-mute)]">of sleep een afbeelding hierheen</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleBestandsKeuze}
              className="sr-only"
              aria-hidden
            />
          </div>
        )}

        {!preview && (
          <p className="text-caption text-[var(--gp-text-mute)]">{BEELD_PRIVACY_NOTE}</p>
        )}

        {/* Preview + reset */}
        {preview && (
          <div className="flex items-start gap-3">
            <img
              src={preview}
              alt="Geüploade plantfoto"
              className="w-20 h-20 rounded-md object-cover border border-[var(--gp-border)] shrink-0"
            />
            <div className="flex-1 min-w-0">
              {laden && (
                <div className="flex items-center gap-2 text-body-sm text-moss-600">
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                  Bezig met identificeren…
                </div>
              )}
              {!laden && suggesties.length > 0 && (
                <div className="flex items-center gap-1.5 text-body-sm text-moss-700 mb-1">
                  <CheckCircle2 size={14} className="text-moss-600" aria-hidden />
                  {suggesties.length} mogelijke{suggesties.length === 1 ? " plant" : " planten"} gevonden
                </div>
              )}
              <button
                onClick={reset}
                className="text-caption text-[var(--gp-text-mute)] hover:text-moss-700 underline underline-offset-2"
              >
                Andere foto kiezen
              </button>
            </div>
          </div>
        )}

        {/* Fout */}
        {fout && (
          <p role="alert" className="text-body-sm text-[var(--gp-rust-700)] bg-[var(--gp-rust-100)] px-3 py-2 rounded-md">
            {fout}
          </p>
        )}

        {/* Lokale-reserve melding — eerlijk dat dit geen echte PlantNet-respons is */}
        {bron === "lokaal" && suggesties.length > 0 && (
          <p className="text-caption text-amber-700 mb-2">
            Lokaal demo-resultaat — geen PlantNet-verbinding. Deze suggesties zijn een voorbeeld, geen echte herkenning.
          </p>
        )}

        {/* Suggesties */}
        {suggesties.length > 0 && (
          <ul className="space-y-2" aria-label="Identificatiesuggesties">
            {suggesties.map((s) => (
              <li key={s.wetenschappelijkeNaam}>
                <button
                  onClick={() => onSelecteer(s.wetenschappelijkeNaam)}
                  className="w-full text-left p-3 rounded-md border border-[var(--gp-border)] bg-white
                             hover:border-moss-400 hover:bg-moss-50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0">
                      <p className="gp-scientific text-body-sm text-moss-900 truncate">{s.wetenschappelijkeNaam}</p>
                      {s.gewoneNaam && (
                        <p className="text-caption text-[var(--gp-text-mute)]">{s.gewoneNaam}</p>
                      )}
                    </div>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-[var(--gp-mute)] group-hover:text-moss-600 ml-2"
                      aria-hidden
                    />
                  </div>
                  <ZekerheidBalk waarde={s.zekerheid} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-caption text-[var(--gp-text-mute)]">
          Identificatie via PlantNet · max. 5 resultaten
        </p>
      </div>
    </div>
  );
}
