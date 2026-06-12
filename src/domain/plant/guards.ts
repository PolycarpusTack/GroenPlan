import type { AutoFillResultaat, VeldMetBron } from "./types";

export function isVeldMetBron<T>(waarde: unknown): waarde is VeldMetBron<T> {
  if (typeof waarde !== "object" || waarde === null) return false;
  return "waarde" in waarde && "bron" in waarde;
}

export function isAutoFillResultaat(obj: unknown): obj is AutoFillResultaat {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.identificatie === "object" &&
    typeof r.groei === "object" &&
    typeof r.omstandigheden === "object" &&
    typeof r.bloei === "object" &&
    typeof r.onderhoud === "object" &&
    typeof r.ecologie === "object" &&
    typeof r.veiligheid === "object" &&
    typeof r.notities === "string" &&
    typeof r.zekerheid === "object"
  );
}

export function heeftOnbekendeVelden(resultaat: AutoFillResultaat): string[] {
  const onbekend: string[] = [];
  const { omstandigheden } = resultaat;

  if (omstandigheden.zon.waarde === "unknown") onbekend.push("zon");
  if (omstandigheden.drainage.waarde === "unknown") onbekend.push("drainage");
  if (omstandigheden.waterbehoeften.waarde === "unknown") onbekend.push("waterbehoeften");
  if (omstandigheden.pH.waarde === null) onbekend.push("pH");
  if (omstandigheden.hardheid.waarde === null) onbekend.push("hardheid");
  if (omstandigheden.grondsoorten.waarde.length === 0) onbekend.push("grondsoorten");

  return onbekend;
}
