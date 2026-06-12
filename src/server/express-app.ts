import express, { type Express, type Request, type Response } from "express";
import { apiRoutes, voerApiUit } from "./handlers";

// Bouwt een Express-app met enkel de /api-routes. Static serving van de gebouwde
// SPA zit in main.ts, zodat deze app ook los herbruikbaar is (bv. achter een
// aparte reverse proxy of in tests).
export function maakApiApp(): Express {
  const app = express();
  // De foto-endpoints (plagen, plantnet) sturen base64-afbeeldingen → ruime limiet.
  app.use(express.json({ limit: "12mb" }));

  for (const route of apiRoutes) {
    // app.all + expliciete methodecheck → 405 bij verkeerde methode, net als de
    // Vite dev-middleware (i.p.v. een generieke 404).
    app.all(route.pad, async (req: Request, res: Response): Promise<void> => {
      if (req.method !== route.methode) {
        res.status(405).json({ fout: "Methode niet toegestaan" });
        return;
      }
      const query = new URLSearchParams(req.query as Record<string, string>);
      const antwoord = await voerApiUit(route.handler, { query, body: req.body as unknown });
      res.status(antwoord.status).json(antwoord.body);
    });
  }

  return app;
}
