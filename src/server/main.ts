import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { maakApiApp } from "./express-app";

// Productieserver: serveert de gebouwde SPA (dist/) én de AI/externe API-routes
// vanuit één Node-proces. Draai met `npm run serve` (na `npm run build`).
const poort = Number(process.env.PORT ?? 5174);
const hier = path.dirname(fileURLToPath(import.meta.url));
const distMap = path.resolve(hier, "../../dist");

const app = maakApiApp();

// Statische SPA-assets + client-side routing fallback naar index.html.
app.use(express.static(distMap));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distMap, "index.html"));
});

app.listen(poort, () => {
  console.log(`GroenPlan draait op http://localhost:${poort}`);
});
