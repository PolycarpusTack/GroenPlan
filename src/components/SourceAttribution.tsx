import type { AutoFillBron } from "../domain/plant/types";

interface Props {
  bron: AutoFillBron;
  terugval?: boolean;
}

const BRONLABEL: Record<AutoFillBron, string> = {
  RHS: "RHS",
  Trefle: "Trefle",
  GBIF: "GBIF",
  Wikipedia: "Wikipedia",
  USDA: "USDA",
  Velt: "Velt",
  "AI-knowledge": "AI",
  handmatig: "handmatig",
  unknown: "onbekend",
};

export function SourceAttribution({ bron, terugval }: Props) {
  const needsReview = bron === "unknown" || bron === "AI-knowledge" || terugval;

  return (
    <span className={`gp-source ${needsReview ? "gp-source-review" : ""}`}>
      via {BRONLABEL[bron]}
      {terugval && " (soort)"}
    </span>
  );
}
