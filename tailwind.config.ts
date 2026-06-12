// tailwind.config.ts
// GroenPlan — Tailwind configuration derived from Design Brief v0.3 + Component Inventory v0.1
// Drop into project root, install peer deps: tailwindcss, @tailwindcss/forms, @tailwindcss/typography

import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,html}",
    "./index.html",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // Mosgroen scale — primary brand
        moss: {
          50:  "#F4F8F1",
          100: "#DCEAD8",
          200: "#BCD4B3",
          300: "#A8C09A",
          400: "#7FA078",
          500: "#3D6B4D",
          600: "#326045",
          700: "#2E5339",  // brand primary
          800: "#264432",
          900: "#1F3026",  // body text
          950: "#13201A",
        },
        // Klei (clay) — soil/earth accents
        clay: {
          50:  "#FAF6F0",
          100: "#F2E9DA",
          200: "#E5D3B8",
          300: "#D6BA8E",
          400: "#C19A6B",  // base
          500: "#A8814F",
          600: "#8B6840",
          700: "#6E5234",
          800: "#523D27",
          900: "#36281A",
        },
        // Sky — water/secondary accents
        sky: {
          50:  "#F1F6F8",
          100: "#DAE7EE",
          200: "#A8C8D8",  // base, hemel
          300: "#7FAFC4",
          400: "#5F95AC",
          500: "#4F8EA8",  // water actions
          600: "#3D7388",
          700: "#2F5A6B",
          800: "#234455",
          900: "#162D3A",
        },
        // Status: amber (warning)
        amber: {
          50:  "#FDF6E8",
          100: "#FAE9C5",
          200: "#F4D389",
          300: "#EBB851",
          400: "#E2A02C",
          500: "#D89216",  // base
          600: "#B5790F",
          700: "#8E5E0C",
          800: "#684509",
          900: "#422C06",
        },
        // Status: rust (problem/error)
        rust: {
          50:  "#FAF1EE",
          100: "#F2DDD6",
          200: "#E0B0A4",
          300: "#CB816F",
          400: "#B45A45",
          500: "#9C3D2E",  // base
          600: "#7F3024",
          700: "#62251C",
          800: "#481B14",
          900: "#2E110D",
        },
        // Bloei (bloom) — purple
        bloom: {
          50:  "#F5F1F9",
          100: "#E5DCEF",
          200: "#C9B7DD",
          300: "#AB8FC9",
          400: "#8F6BB8",  // base
          500: "#7A53A4",
          600: "#603F87",
          700: "#4A3169",
          800: "#34234B",
          900: "#1E152C",
        },

        // Neutral surface scale (slightly warm gray)
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F4F1EA",
          bg: "#FAFAF4",          // page background
          border: "#E5E1D8",
          mute: "#808080",
        },

        // Semantic shortcuts (so you can write `bg-primary`, `text-primary`)
        primary: {
          DEFAULT: "#2E5339",
          fg: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F4F1EA",
          fg: "#2E5339",
        },
        accent: {
          DEFAULT: "#A8C8D8",
          fg: "#1F3026",
        },
        warning: {
          DEFAULT: "#D89216",
          fg: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#9C3D2E",
          fg: "#FFFFFF",
        },
      },

      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // [size, { lineHeight, letterSpacing, fontWeight }]
        "caption":     ["11px",  { lineHeight: "1.4",  letterSpacing: "0.02em", fontWeight: "500" }],
        "body-sm":     ["13px",  { lineHeight: "1.5" }],
        "body":        ["15px",  { lineHeight: "1.55" }],
        "heading-sm":  ["14px",  { lineHeight: "1.4",  fontWeight: "600" }],
        "heading-md":  ["18px",  { lineHeight: "1.4",  fontWeight: "600" }],
        "heading-lg":  ["24px",  { lineHeight: "1.3",  fontWeight: "600" }],
        "display-md":  ["32px",  { lineHeight: "1.2",  fontWeight: "700" }],
        "display-lg":  ["56px",  { lineHeight: "1.1",  fontWeight: "700", letterSpacing: "-0.01em" }],
      },

      spacing: {
        // 4px base; extends Tailwind defaults
        "0.5": "2px",
        "1.5": "6px",
        "2.5": "10px",
        "13":  "52px",
        "15":  "60px",
        "18":  "72px",
        "22":  "88px",
      },

      borderRadius: {
        "sm":   "6px",
        "md":   "10px",
        "lg":   "16px",
        "xl":   "24px",
        "2xl":  "32px",
      },

      boxShadow: {
        // Soft, low-contrast shadows tuned for warm background
        "sm": "0 1px 2px rgba(31, 48, 38, 0.04)",
        "md": "0 4px 12px rgba(31, 48, 38, 0.06)",
        "lg": "0 12px 32px rgba(31, 48, 38, 0.08)",
        "xl": "0 24px 48px rgba(31, 48, 38, 0.10)",
        "focus": "0 0 0 3px rgba(46, 83, 57, 0.20)",
      },

      transitionDuration: {
        "fast":  "120ms",
        "base":  "180ms",
        "slow":  "240ms",
      },

      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },

      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
      },

      animation: {
        "fade-in":      "fade-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        "slide-up":     "slide-up 180ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        "pulse-subtle": "pulse-subtle 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      backgroundImage: {
        // Subtle paper-like texture for surfaces if needed
        "paper": "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.0) 100%)",
      },
    },
  },
  plugins: [
    forms({ strategy: "class" }),
    typography,
  ],
};

export default config;
