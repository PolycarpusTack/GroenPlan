# GroenPlan — UI Component Inventory

**Versie:** 0.1
**Bron:** mockup-frames 1 + 2 (mei 2026), Design Brief v0.3
**Doel:** Volledige catalogus van UI-componenten die nodig zijn om de mockups te implementeren. Voor elk component: doel, visuele kenmerken, varianten, TypeScript-props, en welke shadcn/ui primitive (indien van toepassing) als basis dient.

Componenten zijn gegroepeerd per laag — van algemeen naar domein-specifiek.

---

## A. Design Tokens

Tokens zijn de primitieve waardes die alle componenten consumeren. Volledige implementatie staat in `tailwind.config.ts` + `tokens.css`.

### A.1 Kleurtokens

| Token | Hex | Rol |
|-------|-----|-----|
| `--gp-moss-900` | `#1F3026` | Donkergroen, body text |
| `--gp-moss-700` | `#2E5339` | Primair groen, sidebar, knoppen |
| `--gp-moss-500` | `#3D6B4D` | H3 headings, secundair |
| `--gp-moss-300` | `#A8C09A` | Hover-states groen, lichte chips |
| `--gp-moss-100` | `#DCEAD8` | Lichte achtergrond-tinten |
| `--gp-clay-600` | `#C19A6B` | Bodem-gerelateerde UI |
| `--gp-sky-500` | `#A8C8D8` | Water-gerelateerde UI (secundair) |
| `--gp-bg` | `#FAFAF4` | Pagina-achtergrond |
| `--gp-surface` | `#FFFFFF` | Card-oppervlakken |
| `--gp-surface-alt` | `#F4F1EA` | Alternating rows, subtle backgrounds |
| `--gp-amber-500` | `#D89216` | Warning (droogte, vorst nadert) |
| `--gp-rust-500` | `#9C3D2E` | Error / probleem (plagen, dood) |
| `--gp-bloom-500` | `#8F6BB8` | Bloei (bloeikalender, paarse bloemen) |
| `--gp-water-500` | `#4F8EA8` | Water-acties (water-taak, regen) |
| `--gp-mute-500` | `#808080` | Subtiele tekst, captions |
| `--gp-border` | `#E5E1D8` | Card-borders, dividers |

### A.2 Typografie

| Token | Waarde | Gebruik |
|-------|--------|---------|
| `--font-display` | `"Fraunces", serif` | H1 / H2 / brand wordmark |
| `--font-body` | `"Inter", sans-serif` | Body, UI, alle componenten |
| `--font-mono` | `"JetBrains Mono", monospace` | Wetenschappelijke namen, waardes |

| Klasse | Size / Weight / Line-height |
|--------|------------------------------|
| `text-display-lg` | 56 / 700 / 1.1 (paginatitel) |
| `text-display-md` | 32 / 700 / 1.2 (sectietitel) |
| `text-heading-lg` | 24 / 600 / 1.3 (card-title groot) |
| `text-heading-md` | 18 / 600 / 1.4 (card-title) |
| `text-heading-sm` | 14 / 600 / 1.4 (label) |
| `text-body` | 15 / 400 / 1.55 (default) |
| `text-body-sm` | 13 / 400 / 1.5 (secundair) |
| `text-caption` | 11 / 500 / 1.4 (badges, chips) |
| `text-mono` | 14 / 400 / 1.5 (wetenschappelijke namen) |

### A.3 Spacing, radii, shadows, motion

```css
/* Spacing — 4px basis */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 20px;  --space-6: 24px;  --space-8: 32px;  --space-10: 40px;
--space-12: 48px; --space-16: 64px;

/* Radius */
--radius-sm: 6px;   /* chips, inputs */
--radius-md: 10px;  /* knoppen */
--radius-lg: 16px;  /* cards */
--radius-xl: 24px;  /* mobile sheets */
--radius-full: 9999px;

/* Shadows — zachter dan default Tailwind */
--shadow-sm: 0 1px 2px rgba(31, 48, 38, 0.04);
--shadow-md: 0 4px 12px rgba(31, 48, 38, 0.06);
--shadow-lg: 0 12px 32px rgba(31, 48, 38, 0.08);

/* Motion — alles ≤ 200ms, geen elasticity */
--ease-out: cubic-bezier(0.22, 0.61, 0.36, 1);
--dur-fast: 120ms;
--dur-base: 180ms;
```

---

## B. Layout-componenten

### B.1 `<NavRail>` — primaire navigatie

**Doel:** verticale navigatie aan de linkerkant van de bureau-modus. Logo bovenaan, sectie-items in het midden, gebruikersprofiel onderaan.

**Visueel:**
- Breedte 240 px, volledige hoogte
- Achtergrond `--gp-moss-700`, tekst `#FFFFFF` (actieve item heeft een lichtere balk)
- Logo + brand-naam "GroenPlan" bovenaan, met tagline "Beheer je tuin als een levend systeem" eronder in mute-tekst
- Sectie-items: icon (16 px) + label, padding 12 px verticaal
- Actieve item: lichter groen achtergrond (`--gp-moss-500`) + witte tekst + 3 px linker accent-balk in `--gp-moss-300`

**Props:**
```typescript
type NavRailProps = {
  items: { id: string; label: string; icon: LucideIcon; href: string }[];
  activeId: string;
  user: { name: string; tuin: string; avatarUrl?: string };
  onItemClick: (id: string) => void;
};
```

**Basis:** custom; geen shadcn equivalent. Mobile collapse via `<Sheet>` (shadcn).

### B.2 `<TopBar>` — header op dashboard

**Doel:** groet + datum links, weer-widget rechts.

**Props:**
```typescript
type TopBarProps = {
  greeting: string;          // "Goedemorgen, Jeroen"
  subtitle?: string;         // "Dit is er vandaag te doen in je tuin."
  weather: {
    temperatureC: number;
    condition: string;       // "Bewolkt"
    high: number; low: number;
    precipitationChance: number;
    wind?: { directionLabel: string; speedKmh: number };
  };
  onForecastClick?: () => void;
};
```

### B.3 `<PageHeader>` — pagina-header binnen secties

**Doel:** terug-knop + titel + meta (subtitel of breadcrumb) + acties rechts.

**Varianten:**
- Standaard (Zone Designer, Plantdetail)
- Met tabs (geïntegreerde tab-balk eronder)

**Props:**
```typescript
type PageHeaderProps = {
  backHref?: string;
  title: string;
  meta?: string;             // "145 m² · Border"
  actions?: ReactNode;       // knoppen rechts
  tabs?: TabsConfig;         // optioneel
};
```

---

## C. Surface-componenten

### C.1 `<Card>` — basisoppervlak

**Doel:** generieke container met witte achtergrond, ronde hoeken, zachte schaduw.

**Varianten:**
- `default`: witte achtergrond
- `subtle`: `--gp-surface-alt` achtergrond, geen schaduw
- `bordered`: 1 px border in `--gp-border`, geen schaduw
- `elevated`: zwaardere schaduw (`--shadow-lg`), voor mobile floating-elementen

**Props:**
```typescript
type CardProps = {
  variant?: "default" | "subtle" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
};
```

**Basis:** shadcn `<Card>` met aangepaste varianten.

### C.2 `<StatCard>` — grote stat-card

**Doel:** één belangrijk getal met label en optionele subtitle. Gebruikt in de 4-cijfer stats-strip (zones, planten, biodiversiteit, onderhoudsdruk).

**Props:**
```typescript
type StatCardProps = {
  value: string | number;
  label: string;
  suffix?: string;           // "/100"
  trend?: { delta: number; direction: "up" | "down" };
  icon?: LucideIcon;
  tone?: "neutral" | "good" | "warning";
};
```

### C.3 `<InfoCard>` — card met titel + body

**Doel:** standaard dashboard-blok (Vandaag te doen, Zones met aandacht, Quick Actions, Tuin gezondheid).

**Props:**
```typescript
type InfoCardProps = {
  title: string;
  badge?: string;            // "6 taken"
  action?: { label: string; onClick: () => void };  // optionele "Alle ... bekijken"
  children: ReactNode;
};
```

---

## D. Data-display

### D.1 `<DonutChart>` — Tuin gezondheid

**Doel:** circulaire voortgangs-indicator met centraal getal.

**Visueel:** dikke ring (12 px) met `--gp-moss-700` als gevulde sector, lichte ring als achtergrond. Centraal: groot getal + "/ 100" + één-regel-label.

**Props:**
```typescript
type DonutChartProps = {
  value: number;             // 0-100
  label?: string;            // "Biodiversiteit goed"
  subLabel?: string;         // "Bodem gezond"
  size?: "sm" | "md" | "lg";
  color?: string;
};
```

**Basis:** recharts `<PieChart>` met custom rendering.

### D.2 `<BloomGantt>` — bloeikalender

**Doel:** gantt-stijl tijdlijn die toont wanneer planten bloeien, per zone of per plant.

**Visueel:**
- Y-as: lijst van zones (of planten)
- X-as: maanden (jan-dec) of dagen (afhankelijk van zoom)
- Bars in `--gp-bloom-500` of plant-specifieke bloemkleur
- Hover: tooltip met plantnaam + bloeiperiode

**Props:**
```typescript
type BloomGanttProps = {
  rows: { id: string; label: string }[];
  bars: { rowId: string; startMonth: number; endMonth: number; color: string; tooltip: string }[];
  range?: { startMonth: number; endMonth: number };  // default: jan-dec
};
```

### D.3 `<KeyValueList>` — plantdetail key-value

**Doel:** lijst van eigenschap-waarde paren met icon links.

**Visueel:**
- Eén rij per item: icon (16 px) + label + value (rechts uitgelijnd, of na de :)
- Bron-chip naast value indien aanwezig
- Dividers tussen rijen (subtiel)

**Props:**
```typescript
type KeyValueListProps = {
  items: {
    icon?: LucideIcon;
    label: string;
    value: ReactNode;
    source?: SourceAttribution;
  }[];
};
```

### D.4 `<StatStrip>` — horizontale 4-cijfer-strip

**Doel:** vier samenvattings-cijfers naast elkaar (zones, planten, biodiv, onderhoudsdruk).

**Props:**
```typescript
type StatStripProps = {
  stats: StatCardProps[];    // typisch 3-5
};
```

### D.5 `<ActivityFeed>` — Recent actief

**Doel:** chronologische lijst van recente acties (plant toegevoegd, taak voltooid, observatie).

**Props:**
```typescript
type ActivityFeedProps = {
  items: {
    id: string;
    icon?: LucideIcon;
    avatar?: string;
    text: string;            // markup-vrij; gebruik chunks voor bold
    chunks?: { text: string; bold?: boolean }[];
    timestamp: string;       // "Vandaag", "Gisteren", "2 dagen geleden"
  }[];
};
```

---

## E. Input-componenten

### E.1 `<Button>` — basisknop

**Varianten:**
- `primary`: `--gp-moss-700` achtergrond, witte tekst
- `secondary`: witte achtergrond, `--gp-moss-700` border en tekst
- `ghost`: geen achtergrond/border, alleen tekst
- `destructive`: `--gp-rust-500` achtergrond

**Sizes:** `sm` / `md` / `lg`

**Basis:** shadcn `<Button>` met custom varianten.

### E.2 `<IconButton>` — icoon-only knop

**Doel:** quick-actions, toolbar-acties.

### E.3 `<Chip>` — tag of badge

**Varianten:**
- `tone="neutral"`: grijs
- `tone="good"`: lichtgroen (`--gp-moss-100`)
- `tone="warning"`: lichtamber
- `tone="problem"`: lichtrust
- `tone="bloom"`: lichtbloem
- `tone="water"`: lichtsky

**Props:**
```typescript
type ChipProps = {
  label: string;
  icon?: LucideIcon;
  tone?: "neutral" | "good" | "warning" | "problem" | "bloom" | "water";
  size?: "sm" | "md";
  onRemove?: () => void;     // toont x-knop indien gezet
};
```

### E.4 `<Checkbox>` — taakvinkje

**Visueel:** afgerond vierkant (radius-sm), `--gp-border` border in lege staat, gevuld `--gp-moss-700` + wit vinkje wanneer aangevinkt.

**Basis:** shadcn `<Checkbox>`.

### E.5 `<Select>` / `<Dropdown>` — keuzemenu

**Basis:** shadcn `<Select>`.

### E.6 `<SearchInput>` — zoekveld

**Doel:** zoekbalk in Ontdek-sectie.

**Visueel:** witte achtergrond, lichte border, search-icon links, optioneel filter-icon rechts. Placeholder: "Zoek plant (NL, EN, wetenschappelijk)".

### E.7 `<FilterChipBar>` — horizontale filter-chips

**Doel:** snelfilter-balk onder zoek (zon, grond, bloeiperiode, ...).

**Props:**
```typescript
type FilterChipBarProps = {
  filters: {
    id: string;
    label: string;            // "Zon: Half - Vol"
    value: string | string[];
    options: { label: string; value: string }[];
  }[];
  onChange: (filterId: string, value: any) => void;
};
```

### E.8 `<Tabs>` — tabsysteem

**Varianten:**
- Standaard horizontale tabs (Plantdetail)
- Zone Designer-stijl (met icons + label, breder)
- Mobile bottom-nav-stijl

**Basis:** shadcn `<Tabs>` met custom styling.

---

## F. Domein-componenten

### F.1 `<TaskRow>` — taakregel

**Visueel:** checkbox + plant-icon + titel + locatie (zone-naam) + tag (rechts).

**States:** todo, done (strikethrough + lichte tekst), overdue (amber pill links).

**Props:**
```typescript
type TaskRowProps = {
  task: {
    id: string;
    title: string;
    location: string;
    icon?: LucideIcon;       // plant-type icon
    tag?: { label: string; tone: ChipTone };
    status: "todo" | "done" | "overdue";
    priority?: "low" | "medium" | "high";
  };
  onToggle: (id: string) => void;
  onClick?: (id: string) => void;
};
```

### F.2 `<ZoneCard>` — zone-sneak-peek

**Visueel:** mini-foto links (60×60), zone-naam + status-tekst, status-indicator rechts (icon in tone-kleur).

**Props:**
```typescript
type ZoneCardProps = {
  zone: {
    id: string;
    name: string;
    photoUrl: string;
    statusText: string;        // "Droogte-alert"
    statusTone: ChipTone;
    statusIcon: LucideIcon;
  };
  onClick: () => void;
};
```

### F.3 `<PlantCard>` — Ontdek-laag plant-kaart

**Visueel:**
- Foto bovenaan (4:3 ratio, ronde hoeken)
- Match-score badge linksonder op foto (`94% match` in groen pill)
- Naam (Latijn) + cultivar in regular weight eronder
- Volksnaam in `--gp-mute-500` daaronder (optioneel)
- 2-3 motivatie-chips (zon, bloei, droogtetolerant)

**Props:**
```typescript
type PlantCardProps = {
  plant: {
    id: string;
    photoUrl: string;
    scientificName: string;
    cultivar?: string;
    commonName?: string;
    matchScore?: number;       // 0-100
    chips: { icon?: LucideIcon; label: string; tone: ChipTone }[];
    bloomMonths?: number[];
  };
  onAdd?: () => void;
  onSave?: () => void;
  onCompare?: () => void;
};
```

### F.4 `<TuinkaartPolygon>` — interactieve tuinkaart

**Doel:** topdown-view van hele tuin met zones als polygonen.

**Implementatie:** SVG met polygon-elementen, fill = zone-type-kleur (subtiel), hover = highlight, click = open zone-detail-paneel.

**Props:**
```typescript
type TuinkaartProps = {
  zones: {
    id: string;
    name: string;
    area: number;
    polygon: { x: number; y: number }[];  // in meter-coordinaten
    type: ZoneType;
  }[];
  overlay: "default" | "sun" | "irrigation" | "soil";
  selectedZoneId?: string;
  onZoneClick: (id: string) => void;
  showLabels?: boolean;
  showAreas?: boolean;
};
```

### F.5 `<ZoneCanvas>` — Zone Designer 2D

**Doel:** topdown-canvas met planten als cirkels op eindbreedte-schaal.

**Visueel:**
- Achtergrond: licht groen-grijs of luchtfoto (toggleable)
- Planten als gevulde cirkels met initiaal-letters (bv. "Lv" voor Lavendel)
- Cirkel-grootte = eindbreedte plant (geschaald)
- Cirkel-kleur = bloeikleur (uit PlantSoort)
- Overlap-zones in 3 kleuren: geen / licht / te dicht (transparante overlay)
- Statusring rond cirkel (groen/amber/rust)

**Props:**
```typescript
type ZoneCanvasProps = {
  zoneSize: { width_m: number; height_m: number };
  plants: {
    id: string;
    x_m: number; y_m: number;
    diameter_m: number;
    color: string;
    initials: string;
    status: "healthy" | "concerning" | "dead";
  }[];
  mode: "2d" | "3d" | "seasons" | "companions" | "analyse";
  seasonMonth?: number;     // 1-12, voor seasons mode
  selectedPlantId?: string;
  onPlantSelect?: (id: string) => void;
  onPlantMove?: (id: string, x_m: number, y_m: number) => void;
  showGrid?: boolean;
  showLabels?: boolean;
  editable?: boolean;
};
```

### F.6 `<SourceAttribution>` — bron-chip

**Doel:** kleine chip naast AI-ingevulde velden.

**Visueel:** klein, witgrijs (`--gp-mute-500` tekst), prefix "via" + bronnaam ("via RHS"), optionele chevron voor "klik voor meer". Voor lage-confidence: amber accent met "te controleren" suffix.

**Props:**
```typescript
type SourceAttributionProps = {
  source: "RHS" | "Trefle" | "GBIF" | "Wikipedia" | "USDA" | "Velt" | "AI-knowledge" | "unknown";
  fallback?: boolean;
  needsReview?: boolean;    // toont amber accent
  onClick?: () => void;
};
```

### F.7 `<StatusIndicator>` — status-druppel/punt

**Doel:** kleine status-marker in zone-cards en plantdetail.

**Varianten:** druppel (water), punt (gezondheid), uitroepteken (probleem), sneeuwvlok (vorstgevoelig), bloem (bloei).

**Props:**
```typescript
type StatusIndicatorProps = {
  kind: "drop" | "dot" | "exclamation" | "snow" | "flower";
  tone: ChipTone;
  size?: "sm" | "md";
  label?: string;            // optionele tekst eronder
};
```

### F.8 `<MatchScoreBadge>` — percentage-pill

**Doel:** badge op plant-foto in Ontdek-laag.

**Visueel:** afgerond pill, achtergrond `--gp-moss-700` met witte tekst voor ≥80%, amber voor 60-79%, rust voor <60%.

**Props:**
```typescript
type MatchScoreBadgeProps = {
  score: number;          // 0-100
  showLabel?: boolean;    // "94% match" of "94%"
};
```

### F.9 `<CompanionCheck>` — companion-resultaat-blok

**Doel:** binnen AI Tuin Architect tonen welke combinaties goed/slecht zijn.

**Visueel:** twee rijen — "X waarschuwingen" (amber) en "Y goede combinaties" (groen). Klikbaar voor details.

### F.10 `<AIDisclaimer>` — AI-suggestie banner

**Doel:** rustige disclaimer onderaan AI-output.

**Visueel:** lichte balk in `--gp-surface-alt`, klein AI-icoon + tekst.

**Tekst voorbeeld:** "AI-suggestie. Controleer altijd of planten geschikt zijn voor jouw exacte omstandigheden."

---

## G. Mobile / veld-modus componenten

### G.1 `<MobileSheet>` — modal-sheet onderaan

**Doel:** modal voor veld-acties (taakdetail, foto-bevestiging).

**Basis:** shadcn `<Sheet>` met side="bottom".

### G.2 `<FieldTaskCard>` — uitvergrote taakkaart

**Doel:** taak op veld-modus 'Vandaag' scherm. Eén per scherm.

**Visueel:** card met icon + titel + locatie + prioriteit, twee grote knoppen onderaan (primair: 'Markeer als gedaan', secundair: 'Overslaan (regen gevallen)').

**Props:**
```typescript
type FieldTaskCardProps = {
  task: {
    title: string;
    locationLabel: string;
    icon: LucideIcon;
    priority: "low" | "medium" | "high";
  };
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
};
```

### G.3 `<BottomNav>` — mobile bottom-navigatie

**Doel:** 5 sectie-tabs onderaan in veld-modus.

**Visueel:** witte achtergrond, items als icon + label. Centrale knop visueel verhoogd (FAB-stijl, primair groen).

**Props:**
```typescript
type BottomNavProps = {
  items: { id: string; label: string; icon: LucideIcon; isCenter?: boolean }[];
  activeId: string;
  onItemClick: (id: string) => void;
};
```

### G.4 `<CameraView>` — plant-toevoegen camera

**Doel:** full-screen camera-view met centerframe en AI-herkenning-card.

**Visueel:**
- Live camera-feed full-screen
- Centerframe-indicator (hoekjes in wit, "Zet de plant centraal" label)
- Bottom-strip: galerij-icon · ronde shutter-knop (groot) · camera-flip-icon
- AI-herkenning-card schuift omhoog na foto: thumbnail + plantnaam + confidence + 'Details bekijken'-knop

### G.5 `<ConnectionPill>` — Online/Offline indicator

**Doel:** kleine pill bovenaan veld-modus die verbindings-status toont.

**Varianten:** Online (groen) / Offline (grijs) / Sync... (amber animated)

---

## H. Specifieke compositie-componenten

### H.1 `<QuickActionsPanel>` — dashboard quick actions

**Doel:** vertikale stack van 4-5 actie-knoppen in dashboard-zijbalk.

**Visueel:** primaire knop bovenaan ('Plant toevoegen' groen gevuld), daaronder secundaire knoppen (witte achtergrond, icon + label).

### H.2 `<ZoneDesignerToolbar>` — toolbar boven zone canvas

**Visueel:** horizontale balk met: Selecteer · Plant toevoegen · Verplaatsen · Meten · ⋯

**Props:**
```typescript
type ZoneDesignerToolbarProps = {
  activeTool: "select" | "add" | "move" | "measure";
  onToolChange: (tool: string) => void;
  onOverflowClick?: () => void;
};
```

### H.3 `<AIArchitectPanel>` — AI Tuin Architect

**Doel:** ontwerp-paneel met wens-input, voorstellen-paginering, en details.

**Layout:**
- Bovenaan: titel "AI Tuin Architect" + meta "Nieuw ontwerp"
- Tekstgebied: "Beschrijf je wensen"
- Knop: "Genereer ontwerp" (primair)
- Onder genereren: paginering "Voorstel 1 van 3" met ←/→
- Per voorstel: mini-preview + cijfers (oppervlakte, planten, bloei, onderhoud)
- Companion check ingebed (waarschuwingen + goede combinaties)
- Knoppen: 'Plantenlijst bekijken' / 'Bloeikalender' / 'Kostprijs indicatie'
- Onderaan: AI-disclaimer

### H.4 `<WeatherWidget>` — weer in TopBar

**Visueel:** icoon + grote temp + condities-tekst + hoge/lage + wind. Klikbaar voor volledige weersverwachting.

---

## I. Icon-set

GroenPlan gebruikt `lucide-react`. Aanbevolen icon-mapping:

| Concept | Lucide icoon |
|---------|-------------|
| Dashboard | `LayoutDashboard` |
| Mijn Tuin | `Map` |
| Zones | `Grid3X3` |
| Planten | `Leaf` |
| Ontdek | `Compass` |
| Taken | `CheckSquare` |
| Kalender | `Calendar` |
| Journal | `BookOpen` |
| AI Coach | `Sparkles` |
| Bodem & Metingen | `TestTube` |
| Zaadbank | `Package` |
| Instellingen | `Settings` |
| Water-taak | `Droplets` |
| Snoei-taak | `Scissors` |
| Bemesting | `Sprout` |
| Plagen-detectie | `Bug` |
| Vorst-alarm | `Snowflake` |
| Droogte | `Sun` |
| Foto | `Camera` |
| Bron-chip | `ExternalLink` |
| Companion goed | `Heart` |
| Companion slecht | `X` |

---

## J. Componenten-prioriteit voor MVP

Onder elke fase: welke componenten zijn nodig om die fase te leveren.

### MVP (fase 1)
NavRail · TopBar · PageHeader · Card · StatCard · InfoCard · Button · IconButton · Chip · Checkbox · Select · Tabs · TaskRow · ZoneCard · PlantCard · TuinkaartPolygon · ZoneCanvas (2D-mode only) · SourceAttribution · StatusIndicator · MatchScoreBadge · WeatherWidget · ActivityFeed · KeyValueList · StatStrip · QuickActionsPanel · ZoneDesignerToolbar

### Fase 2
BottomNav · MobileSheet · FieldTaskCard · CameraView · ConnectionPill · BloomGantt · DonutChart · SearchInput · FilterChipBar

### Fase 3
ZoneCanvas (3D / seasons / companions / analyse modes) · AIArchitectPanel · CompanionCheck · AIDisclaimer

---

## K. Componenten die NIET nodig zijn

Bewust uitgesloten om scope te bewaren:

- Carousel / image gallery (foto's worden in een eenvoudige grid getoond)
- Toast / Notification system buiten standaard browser/PWA push
- Rich text editor (alle notes zijn plain text)
- Drag-and-drop bestandsupload (foto's via `<input type="file">` of camera-API)
- Sidebar collapse-animation in bureau-modus (op desktop blijft de NavRail altijd zichtbaar)
- Modal overlays voor confirmaties (gebruik inline confirmaties of MobileSheet op mobile)

---

**Einde inventory. Volgende stap:** `tailwind.config.ts` + `tokens.css` + `globals.css` afgeleid uit deze tokens.
