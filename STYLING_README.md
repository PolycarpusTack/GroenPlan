# GroenPlan — Design Tokens & Tailwind Config

Productie-klare styling-laag voor de GroenPlan-app. Drop deze vier bestanden in een Vite + React + TypeScript + Tailwind project.

## Bestanden

| Bestand | Plek in project | Wat het is |
|---------|-----------------|------------|
| `tailwind.config.ts` | project root | Tailwind config met GroenPlan-palet, fonts, spacing, shadows, motion |
| `tokens.css` | `src/styles/tokens.css` | CSS custom properties (single source of truth) |
| `globals.css` | `src/styles/globals.css` | Base styles + herbruikbare component-classes (`gp-card`, `gp-btn`, etc.) |
| `theme.ts` | `src/styles/theme.ts` | TypeScript constants voor charts/SVG/motion |

## Setup

1. **Dependencies installeren**

```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npm install lucide-react clsx
```

2. **Fonts laden** — voeg toe aan `index.html` of importeer in `tokens.css`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

3. **CSS importeren** in `src/main.tsx`:

```typescript
import "./styles/tokens.css";
import "./styles/globals.css";
```

4. **Tailwind directives** zijn al in `globals.css` opgenomen.

## Gebruik

### Met Tailwind-utilities (preferred voor de meeste componenten)

```tsx
<button className="bg-moss-700 text-white px-4 py-2 rounded-md hover:bg-moss-600 transition-colors duration-base">
  Plant toevoegen
</button>
```

### Met component-classes (voor patterns die vaak terugkomen)

```tsx
<div className="gp-card">
  <h3 className="text-heading-md mb-2">Vandaag te doen</h3>
  <span className="gp-chip gp-chip-warning">6 taken</span>
</div>
```

### Met TypeScript constants (voor SVG, charts, motion)

```tsx
import { gpColors, matchScoreColor } from "@/styles/theme";

function MatchBadge({ score }: { score: number }) {
  const { bg, fg } = matchScoreColor(score);
  return (
    <span style={{ background: bg, color: fg }} className="gp-match-badge">
      {score}% match
    </span>
  );
}
```

## Wat NIET in deze laag zit

- shadcn/ui componenten zelf — installeer met `npx shadcn@latest init` en gebruik dit palet als basis bij de config
- Daadwerkelijke componenten — die staan in de component-inventory en worden iteratief geïmplementeerd
- Iconen — `lucide-react` is de afhankelijkheid; concrete icon-mapping staat in de component-inventory

## Filosofie

Drie lagen, in volgorde van expressiviteit:

1. **CSS custom properties** (`tokens.css`) — gebruiken in custom CSS, runtime-bereikbaar via `getComputedStyle`. Single source of truth.
2. **Tailwind utilities** — meest gebruikte laag in component-code. Verwijst onder de motor naar dezelfde waardes als de tokens.
3. **TypeScript constants** (`theme.ts`) — voor plekken waar je een kleur als JS-string nodig hebt (recharts, SVG fills, framer-motion).

Verander een waarde op één plek (`tokens.css`) en de andere lagen volgen — voor zover ze er expliciet naar verwijzen. Tailwind-config en theme.ts moeten manueel mee-veranderen, maar dat is een feature: ze zijn de afnemers, niet de bron.

## Dark mode

Opt-in. Voeg `class="dark"` toe aan `<html>` om de dark-overrides in `tokens.css` te activeren. Standaard niet aan — een tuin-app voelt natuurlijk in licht-thema.

## Toegankelijkheid

- Tekst-contrast getest tegen WCAG AA op alle achtergrond-combinaties
- Focus-ring is consistent via `:focus-visible` (geen `:focus`-spam op klik)
- `prefers-reduced-motion` zet alle transitions op 0ms

## Versie

v0.1 — afgeleid uit Design Brief v0.3 + Component Inventory v0.1.
