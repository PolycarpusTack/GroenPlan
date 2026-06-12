// theme.ts — GroenPlan theme constants for use in TypeScript / React code
// Where CSS variables aren't ergonomic (charts, SVG canvas, motion configs).

export const gpColors = {
  moss: {
    50:  "#F4F8F1",
    100: "#DCEAD8",
    200: "#BCD4B3",
    300: "#A8C09A",
    400: "#7FA078",
    500: "#3D6B4D",
    600: "#326045",
    700: "#2E5339",
    800: "#264432",
    900: "#1F3026",
    950: "#13201A",
  },
  clay:  { 400: "#C19A6B", 500: "#A8814F", 700: "#6E5234" },
  sky:   { 200: "#A8C8D8", 500: "#4F8EA8" },
  amber: { 100: "#FAE9C5", 500: "#D89216", 700: "#8E5E0C" },
  rust:  { 100: "#F2DDD6", 500: "#9C3D2E", 700: "#62251C" },
  bloom: { 100: "#E5DCEF", 400: "#8F6BB8", 700: "#4A3169" },

  bg:          "#FAFAF4",
  surface:     "#FFFFFF",
  surfaceAlt:  "#F4F1EA",
  border:      "#E5E1D8",
  mute:        "#808080",
  text:        "#1F3026",
} as const;

export const gpRadius = {
  sm: 6, md: 10, lg: 16, xl: 24, full: 9999,
} as const;

export const gpSpace = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

export const gpMotion = {
  durFast: 120,
  durBase: 180,
  durSlow: 240,
  ease: [0.22, 0.61, 0.36, 1] as const,
  easeString: "cubic-bezier(0.22, 0.61, 0.36, 1)",
} as const;

export const gpFonts = {
  display: '"Fraunces", Georgia, serif',
  body:    '"Inter", system-ui, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
} as const;

export type ChipTone = "neutral" | "good" | "warning" | "problem" | "bloom" | "water";

export const chipToneClass: Record<ChipTone, string> = {
  neutral: "gp-chip",
  good:    "gp-chip gp-chip-good",
  warning: "gp-chip gp-chip-warning",
  problem: "gp-chip gp-chip-problem",
  bloom:   "gp-chip gp-chip-bloom",
  water:   "gp-chip gp-chip-water",
};

export type MatchTier = "excellent" | "good" | "fair" | "poor";

export const matchScoreColor = (score: number): { bg: string; fg: string; tier: MatchTier } => {
  if (score >= 85) return { bg: gpColors.moss[700],  fg: "#FFFFFF", tier: "excellent" };
  if (score >= 70) return { bg: gpColors.moss[500],  fg: "#FFFFFF", tier: "good"      };
  if (score >= 50) return { bg: gpColors.amber[500], fg: "#FFFFFF", tier: "fair"      };
  return            { bg: gpColors.rust[500],  fg: "#FFFFFF", tier: "poor"      };
};

export const soilTypeColor = {
  clay:  "#9C7E5A",
  sand:  "#E0CBA2",
  loam:  "#A8814F",
  chalk: "#E8E4D4",
  peat:  "#3D2F1F",
} as const;

export const sunOverlayColor = {
  full:    "rgba(216, 146, 22, 0.45)",
  partial: "rgba(168, 200, 216, 0.40)",
  shade:   "rgba(31, 48, 38, 0.35)",
} as const;

export const plantStatusRing = {
  healthy:    gpColors.moss[500],
  concerning: gpColors.amber[500],
  dead:       gpColors.rust[500],
} as const;

export const monthLabelNL = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
] as const;
