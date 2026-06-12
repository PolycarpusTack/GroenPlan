import { useState, useEffect } from "react";
import { Droplets, Wind, ChevronDown } from "lucide-react";
import { haalWeerVoorspellingOp, type WeerVoorspelling } from "../services/weather/weather-service";
import { BELGISCHE_GEMEENTEN } from "../services/weather/belgische-gemeenten";

const BRUSSEL = { lat: 50.8503, lng: 4.3517 };

interface Props {
  gemeente?: string | null;
}

export function WeerWidget({ gemeente }: Props) {
  const [weer, setWeer] = useState<WeerVoorspelling | null>(null);
  const [fout, setFout] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const coords = gemeente
      ? (BELGISCHE_GEMEENTEN.find((g) => g.naam.toLowerCase() === gemeente.toLowerCase()) ?? BRUSSEL)
      : BRUSSEL;

    let afgebroken = false;
    haalWeerVoorspellingOp(coords.lat, coords.lng)
      .then((data) => { if (!afgebroken) setWeer(data); })
      .catch(() => { if (!afgebroken) setFout(true); });

    return () => { afgebroken = true; };
  }, [gemeente]);

  if (fout) return null;

  if (!weer) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-moss-100" />
        <div className="space-y-1">
          <div className="w-16 h-3 bg-moss-100 rounded" />
          <div className="w-24 h-2.5 bg-moss-100 rounded" />
        </div>
      </div>
    );
  }

  const { vandaag, dagen } = weer;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Weersvoorspelling tonen"
        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 border border-[var(--gp-border)] backdrop-blur-sm hover:bg-white/80 transition-colors"
      >
        <span className="text-2xl leading-none" aria-hidden>{vandaag.icoon}</span>
        <div className="text-left">
          <p className="text-body-sm font-semibold text-moss-900 leading-tight">
            {vandaag.hoog}° <span className="font-normal text-[var(--gp-text-mute)]">/ {vandaag.laag}°</span>
          </p>
          <p className="text-caption text-[var(--gp-text-mute)] leading-tight">{vandaag.conditie}</p>
        </div>
        {vandaag.neerslagKans > 0 && (
          <div className="flex items-center gap-1 text-caption text-sky-700 pl-1 border-l border-[var(--gp-border)]">
            <Droplets size={12} aria-hidden />
            {vandaag.neerslagKans}%
          </div>
        )}
        <div className="flex items-center gap-1 text-caption text-[var(--gp-text-mute)] pl-1 border-l border-[var(--gp-border)]">
          <Wind size={12} aria-hidden />
          {vandaag.windRichting} {vandaag.windSnelheid} km/u
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--gp-text-mute)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <>
          {/* klik-buiten sluit het paneel */}
          <button
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 p-3 rounded-xl bg-white border border-[var(--gp-border)] shadow-lg min-w-[18rem]">
            <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">5-daagse voorspelling</p>
            <div className="flex gap-1.5">
              {dagen.map((d) => (
                <div
                  key={d.datum}
                  className="flex-1 flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg bg-[var(--gp-surface-alt)] border border-[var(--gp-border)]"
                  title={`${d.conditie} · neerslag ${d.neerslagKans}%`}
                >
                  <span className="text-caption font-medium text-moss-800 capitalize">{d.weekdag}</span>
                  <span className="text-lg leading-none" aria-hidden>{d.icoon}</span>
                  <span className="text-caption font-semibold text-moss-900">{d.hoog}°</span>
                  <span className="text-caption text-[var(--gp-text-mute)]">{d.laag}°</span>
                  <span className="flex items-center gap-0.5 text-caption text-sky-700 min-h-[14px]">
                    {d.neerslagKans > 0 && (<><Droplets size={9} aria-hidden />{d.neerslagKans}</>)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-caption text-[var(--gp-text-mute)] mt-2 flex items-center gap-1">
              <Wind size={11} aria-hidden />
              Wind {vandaag.windRichting} {vandaag.windSnelheid} km/u · via Open-Meteo
            </p>
          </div>
        </>
      )}
    </div>
  );
}
