# STRIDE-analyse — `/api/plagen` (plagen- & ziektedetectie)

Vereist door guardrail **G-SE-01** (STRIDE vóór merge van elke wijziging aan AI-facing endpoints).

**Endpoint:** `POST /api/plagen` (Vite dev-middleware) → `analyseerPlagen(base64, mimeType, plantNaam, queryId)` → Claude-vision (`claude-opus-4-7`).
**Datastroom:** browser-foto → base64 → backend → Anthropic API → JSON-diagnose → browser.
**Context:** lokale single-user prototype-app; geen DB-writes, geen persistente opslag van de foto.

| Dreiging | Analyse | Mitigatie | Restrisico |
|---|---|---|---|
| **S**poofing | Geen auth op `/api/*` (zoals alle endpoints — lokale single-user app). | Lokaal gebonden in dev. | ⚠️ Auth verplicht bij productiedeploy. |
| **T**ampering | `plantNaam` en het beeld gaan in de prompt → prompt-injection mogelijk (vooral via adversariële tekst in de foto). | Strikte JSON-systeemprompt; antwoord wordt veld-voor-veld genormaliseerd/geclamped (`normaliseerBevinding`) vóór gebruik. Geen code-uitvoering op basis van het antwoord. | Laag. |
| **R**epudiation | Geen audit-log. | Acceptabel voor prototype (geen multi-user, geen mutaties). | Laag. |
| **I**nformation disclosure | Foto verlaat het toestel naar Anthropic. `ANTHROPIC_API_KEY` mag niet lekken. | Key alleen server-side: `@anthropic-ai/sdk` staat `external` in de rollup-config en wordt enkel via dynamische import in de middleware geladen — nooit in de browser bundle. Foutmeldingen naar de client zijn gesaneerde strings. | ⚠️ Gebruiker informeren dat foto's naar Anthropic gaan; overweeg EXIF/GPS-stripping. |
| **D**enial of service | Grote afbeeldingen → kosten/latency. | `max_tokens` begrensd op 1024; max. 3 bevindingen. | ⚠️ Beeldgrootte-limiet (bv. weiger > 5 MB) toevoegen vóór productie. |
| **E**levation of privilege | Geen rollen/rechten. SDK draait server-side. | n.v.t. | — |

## Openstaande acties vóór productie
- [ ] Authenticatie op `/api/*` (geldt voor alle AI-endpoints, niet alleen plagen). **Deploy-infra-werk:** de huidige endpoints zijn Vite dev-middleware voor een lokale single-user app; echte auth vereist een productie-backend + gebruikersmodel en valt buiten deze prototype-opzet.
- [x] Maximale beeldgrootte afdwingen → `services/media/afbeelding.ts` (`MAX_AFBEELDING_MB = 8`), gevalideerd in de UI vóór upload (PlantNet + plagen).
- [x] Privacy-melding → `BEELD_PRIVACY_NOTE` getoond bij foto-upload in `FotoIdentificatiePanel` en `VeldModus`. (EXIF/GPS-stripping blijft een aanbeveling.)

## In deze wijziging afgedekt
- Key blijft server-side (anti-layer-bleeding / G-TS-01); browser praat enkel met `/api/plagen`.
- LLM-uitvoer wordt defensief genormaliseerd vóór rendering — een afwijkend antwoord kan de UI niet breken.
- Anti-hallucinatie in de systeemprompt; UI labelt **eerlijk** AI vs. lokale reserve (`bron`-veld).
- Graceful fallback (`FallbackPlagenAdapter`) voorkomt harde fout zonder backend/sleutel.
