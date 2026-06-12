# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CoBrain / GroenPlan** is a Dutch-language garden management SPA. Users define garden zones (soil type, sun exposure, pH, drainage) and get AI-powered plant recommendations via a scored matching algorithm. The app is **fully scaffolded and built** (React + TS + Vite 6 + Tailwind 3 + Zustand v5): all MVP + Phase 2/3 features are implemented — dashboard, zones/map, discovery, tasks, bloom calendar, journal, soil log, **seed bank (zaadbank)**, field mode, AI auto-fill, AI garden architect, AI pest/disease detection (Claude vision), PlantNet ID, weather (Open-Meteo, 5-day + wind), and offline mode (Service Worker + IndexedDB + PWA). All AI/external services use a fallback adapter that degrades to a clearly-labelled local stub when offline or without an API key.

## Development Methodology

This project follows the **Guided Partnership Model (GPM)** from `C:\Projects\ClaudeExtras\core\gpm-v2.1.md`. Current execution mode: **PROTOTYPE** (specs validated, architecture being confirmed, selective governance active).

- **Architect** owns: Domain Glossary, ADRs, ZAP/CIP prompt strategy
- **AI execution partner** (`gpm-partner-agent-v2`): code generation in TDD order, DoR/DoD enforcement, Contract Snapshots
- **Backlog** generated via `backlog-builder-agent-v2` — max 2 EPICs initially, tracer bullet first

### Prompt Types (GPM)
- **ZAP** — build one component (zero assumptions, FEATURE or REFACTORING hat only)
- **CIP** — connect validated components into an integrated flow
- **PREP** — restructure existing code before a ZAP
- **SPIKE** — time-boxed exploration, throwaway code

### Active Guardrails
These rules apply to all code and AI interactions in this project:

| Guardrail | Impact |
|---|---|
| `anti-hallucination` | Auto-fill prefers `null`/`"unknown"` over guessed values — never invent plant data |
| `anti-anemic-domain` | `PlantSoort`, `Zone`, `Tuin` must carry behavior, not only data |
| `anti-layer-bleeding` | Domain layer must not import Anthropic SDK, Prisma, or any infrastructure directly |
| `anti-false-cognate` | Dutch and English domain terms must not blur (e.g. `zone` ≠ `bed` ≠ `area`) |
| `anti-overengineering` | MVP Phase 1 component list is the boundary — no Phase 2/3 features until Phase 1 ships |
| `G-TS-01` | Mock only types you own — never mock the Anthropic SDK directly; use an adapter |
| `G-SE-01` | STRIDE-analyse required before merging any change to AI-facing endpoints |

---

## Project Bootstrap

When initializing the app for the first time:

```bash
npm create vite@latest . -- --template react-ts
npm install tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npm install lucide-react clsx recharts
npx shadcn-ui@latest init
```

Copy the existing design system files into `src/styles/`:
- `tokens.css` → `src/styles/tokens.css`
- `globals.css` → `src/styles/globals.css`
- `theme.ts` → `src/styles/theme.ts`
- `tailwind.config.ts` → project root (replaces the generated one)

## Commands (post-bootstrap)

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run Vitest tests
npm run test:watch   # Vitest watch mode
npm run lint         # ESLint
```

To run a single test file:
```bash
npx vitest run src/match/score.test.ts
```

---

## Domain Model (DDD)

### Core Domain vs Subdomains

| Subdomain | Type | Reden |
|---|---|---|
| Aanbevelingen (match score + ranking) | **Core** | Unieke waarde, onderscheidend ten opzichte van concurrenten |
| Tuinontwerp (zones, SVG-kaart, plaatsing) | **Core** | Unieke UX, moeilijk te kopiëren |
| Plantencatalogus (auto-fill, bronvermelding) | Supporting | Kritisch maar vervangbaar door externe databank |
| Takenbeheer (taken, kalender) | Generic | Commodity — geen concurrentievoordeel |
| Veldmodus (PlantNet, camera, offline) | Supporting | Versterkt Core maar is geen Core zelf |

### Bounded Contexts & Integraties

```
Plantencatalogus ──→ Aanbevelingen
Plantencatalogus ──→ Tuinontwerp
Tuinontwerp      ──→ Aanbevelingen (zone-eigenschappen)
Tuinontwerp      ──→ Takenbeheer
Veldmodus        ──→ Plantencatalogus (foto → wetenschappelijke naam)
```

### Domain Glossary (Dutch — canonical)

| Term | Type | Omschrijving |
|---|---|---|
| `Tuin` | Aggregate Root | Top-level tuin; bevat Zones, geeft toegang tot Taken |
| `Zone` | Entity (root binnen Tuin) | Tuinzone met grondsoort, zon, pH, drainage |
| `PlantSoort` | Aggregate Root | Plantensoort met auto-filled velden + bronvermelding |
| `PlantPlaatsing` | Entity | Concrete plaatsing van PlantSoort in Zone |
| `Taak` | Entity | Uitvoerbare actie gekoppeld aan Zone of PlantPlaatsing |
| `MatchScore` | Value Object | Score (0–1) + breakdown + motivatie-strings |
| `Bloeiperiode` | Value Object | Maanden waarop een plant bloeit |
| `Grondsoort` | Enum | `clay` \| `sand` \| `loam` \| `chalk` \| `peat` |
| `Zonlichtniveau` | Enum | `full` \| `partial` \| `shade` |
| `Waterbehoeften` | Enum | `low` \| `medium` \| `high` \| `unknown` |
| `Drainage` | Enum | `well-drained` \| `moist` \| `wet` \| `unknown` |
| `Bronvermelding` | Value Object | `source: Source`, optioneel `fallback`, `note` |

---

## Architecture

### Source Layout

```
src/
  components/    # React UI components (see UI Component Inventory)
  match/         # Pure scoring algorithm (soil, sun, pH, water, hardiness, bloomGap)
  services/      # autofill.ts (Claude API adapter), plantnet.ts, weather.ts
  pages/         # Route-level components
  styles/        # tokens.css, globals.css, theme.ts
  db/            # SQLite cache schema and migrations
```

### Styling System (Three-Layer)

| Layer | File | Purpose |
|-------|------|---------|
| CSS tokens | `tokens.css` | Source of truth — all colors, spacing, font, motion as CSS custom properties |
| Tailwind config | `tailwind.config.ts` | Extends Tailwind with GroenPlan palette |
| TS constants | `theme.ts` | Same values re-exported for recharts/SVG/framer-motion |
| Global CSS | `globals.css` | Base resets + component pattern classes |

Always edit `tokens.css` first; sync `tailwind.config.ts` and `theme.ts` when needed in JS contexts.

### Key Algorithms & Specs

- **Match Score** (`GroenPlan_MatchScore_Algorithm.md`) — Pure TS functions, zero side effects. Six weighted criteria: soil (0.25), sun (0.25), pH (0.15), water (0.15), hardiness (0.10), bloomGap (0.10). Missing data redistributes weights; never zeros the score. All logic must remain testable with Vitest without mocks.

- **AI Auto-fill** (`GroenPlan_AutoFill_Prompt_Spec.md`) — Claude Sonnet with prompt caching. Every field carries `FieldWithSource<T>` with `source`, optional `fallback` flag, and `note`. SQLite cache keyed on scientific name (case-insensitive). Targets: ≥90% accuracy, p95 ≤4s, ≈0.4¢/plant.

### AI Integration

| Gebruik | Model | Waarom |
|---|---|---|
| Plant auto-fill | `claude-sonnet-4-6` + prompt caching | Snelheid + kostprijs; systeem-prompt gecached |
| Tuinontwerp suggesties | `claude-opus-4-7` | Complexe redenering over begeleidingsplanten |
| Foto-herkenning | PlantNet API → auto-fill confidence | Externe specialist; voedt zekerheidscore |

The Claude API must always be wrapped in an adapter (`src/services/autofill.ts`) — domain code must never import `@anthropic-ai/sdk` directly (guardrail `anti-layer-bleeding` + `G-TS-01`).

### Component Inventory

`GroenPlan_UI_Component_Inventory.md` catalogs 40+ components in priority tiers:
- **MVP (Phase 1):** NavRail, TopBar, Card, StatCard, PlantCard, ZoneCard, TaskRow, MatchScoreBadge, TuinkaartPolygon, ZoneCanvas (2D), SourceAttribution
- **Phase 2:** Mobile (BottomNav, MobileSheet, FieldTaskCard, CameraView), charts (BloomGantt, DonutChart)
- **Phase 3:** AI features (AIArchitectPanel, CompanionCheck, ZoneCanvas 3D/seasons)

Use `shadcn/ui` as the headless primitive layer; map GroenPlan components onto it per the inventory's "shadcn mapping" column.

---

## AI Agent Usage (ClaudeExtras)

Agent library: `C:\Projects\ClaudeExtras\`

### Model-toewijzing

| Model | Taken |
|---|---|
| **Opus** | Domain modeling, ADRs, Context Map, match score algoritmische beslissingen, backlog generatie, architectuurreview |
| **Sonnet** | Code generatie, auto-fill service, component implementatie, test schrijven, refactoring |
| **Haiku** | DoR/DoD checklists, lint verificatie, glossary lookups, cache-hit rate monitoring |

### Veelgebruikte Agent-ketens

| Situatie | Ketting |
|---|---|
| Nieuwe feature | `backlog-health-advisor` → `gpm-partner-agent` (ZAP) → `tdd-practitioner` → `code-smell-detector` |
| AI-service wijziging | `threat-model-facilitator` → `secure-design-reviewer` → `contract-test-advisor` |
| Refactoring | `fowler-smell-detector` → `two-hats-enforcer` → `refactoring-catalog-advisor` |
| Pre-ship check | `output-evaluation-prompt` → `current-state-evaluator-agent` → `slo-advisor` |
| Domeinmodel review | `ubiquitous-language-guard` → `building-block-classifier` → `aggregate-design-reviewer` |

### Tracer Bullet ZAP-volgorde (EPIC 1)

Dunne E2E-slice: plantnaam → auto-fill → matchScore → PlantCard in Zone

| ZAP | Hat | Deliverable |
|---|---|---|
| ZAP-01 | PREPARATORY | Project scaffold + src/styles/ setup |
| ZAP-02 | FEATURE | `PlantSoort` entity + `AutoFillResult` schema + types |
| ZAP-03 | FEATURE | `autofill.ts` adapter + SQLite cache + unit tests |
| ZAP-04 | FEATURE | `matchScore()` + 6 criterium-functies + Vitest golden set |
| ZAP-05 | FEATURE | `Zone` entity + `Tuin` aggregate root |
| ZAP-06 | FEATURE | `PlantCard` + `MatchScoreBadge` + `SourceAttribution` |
| ZAP-07 | FEATURE | Health check + CI pipeline |

---

## Design Tokens Quick Reference

Colors: `moss` (primary green), `clay` (soil), `sky` (water), `amber` (warning), `rust` (error), `bloom` (purple/flowers)

Typography: Fraunces (display headings), Inter (body), JetBrains Mono (scientific plant names)

Motion: 120ms (micro), 200ms (standard), 240ms (page); easing `cubic-bezier(0.22, 0.61, 0.36, 1)`

## Language

UI, variable names, en domein-termen zijn **Nederlands** (bijv. `tuin`, `grond`, `zon`, `zone`, `taak`, `bloei`, `grondsoort`). Wetenschappelijke namen zijn Latijn. Gewone plantnamen verschijnen in NL, FR en EN als aparte velden.
