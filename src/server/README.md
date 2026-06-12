# Server / API-laag

De AI- en externe diensten (Claude auto-fill, tuinontwerp, coach, plagen, PlantNet)
draaien server-side zodat de Anthropic SDK en API-sleutels nooit in de browser
belanden (guardrail `anti-layer-bleeding`).

## Eén bron van waarheid

`handlers/` bevat **framework-agnostische** handlers — pure functies
`(ApiVerzoek) => Promise<ApiAntwoord>`. Ze worden door twee runtimes gebruikt:

| Runtime | Waar | Gebruik |
|---|---|---|
| Vite dev-middleware | `vite.config.ts` (`configureServer`) | tijdens `npm run dev` |
| Express-server | `express-app.ts` + `main.ts` | productie (`npm run serve`) |

Een nieuwe endpoint toevoegen = één handler schrijven en in `handlers/index.ts`
aan `apiRoutes` toevoegen. Beide runtimes pikken hem automatisch op.

## Draaien

```bash
npm run build      # bouwt de SPA naar dist/
npm run serve      # start de Express-server (serveert dist/ + /api/*)
# of in één keer:
npm start
```

Vereist `ANTHROPIC_API_KEY` (en optioneel `PLANTNET_API_KEY`) in `.env`. Zonder
sleutel/verbinding degraderen de browseradapters netjes naar lokale stubs.

`PORT` (standaard 5174) stelt de poort in.

## Andere deploytargets

De handlers zijn platform-onafhankelijk. Voor serverless (Vercel/Netlify/Cloudflare)
schrijf je een dunne wrapper die het platform-`request` omzet naar `ApiVerzoek` en
`voerApiUit(route.handler, verzoek)` aanroept — de kernlogica blijft ongewijzigd.
