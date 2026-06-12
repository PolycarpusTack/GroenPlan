import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { apiRoutes, voerApiUit } from "./src/server/handlers";

const projectDir = dirname(fileURLToPath(import.meta.url));

async function leesRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk as string; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// Vervangt na de build de placeholder in dist/sw.js door een echte build-id
// (pakketversie + tijdstempel), zodat elke deploy een nieuwe cache krijgt en de
// service worker de oude app-shell opruimt.
function serviceWorkerVersiePlugin(): PluginOption {
  return {
    name: "groenplan-sw-versie",
    apply: "build",
    closeBundle() {
      const swPad = resolve(projectDir, "dist/sw.js");
      if (!existsSync(swPad)) return;
      const pkg = JSON.parse(
        readFileSync(resolve(projectDir, "package.json"), "utf-8"),
      ) as { version: string };
      const buildId = `${pkg.version}-${Date.now().toString(36)}`;
      const inhoud = readFileSync(swPad, "utf-8").replace(/__BUILD_ID__/g, buildId);
      writeFileSync(swPad, inhoud);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "groenplan-api",
      // Vite dev-middleware — draait in Node.js en delegeert naar dezelfde
      // framework-agnostische handlers als de Express-productieserver
      // (src/server/handlers). Eén bron van waarheid voor /api-gedrag.
      configureServer(server) {
        for (const route of apiRoutes) {
          server.middlewares.use(
            route.pad,
            async (req: IncomingMessage, res: ServerResponse) => {
              if (req.method !== route.methode) {
                res.writeHead(405);
                res.end("Method Not Allowed");
                return;
              }

              try {
                const url = new URL(req.url ?? "", "http://localhost");
                let body: unknown;
                if (route.methode === "POST") {
                  const ruw = await leesRequestBody(req);
                  body = ruw ? JSON.parse(ruw) : {};
                }

                const antwoord = await voerApiUit(route.handler, {
                  query: url.searchParams,
                  body,
                });

                res.writeHead(antwoord.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify(antwoord.body));
              } catch (e) {
                const bericht = e instanceof Error ? e.message : "Onbekende fout";
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ fout: bericht }));
              }
            },
          );
        }
      },
    },
    serviceWorkerVersiePlugin(),
  ], // end plugins
  build: {
    rollupOptions: {
      // Anthropic SDK is server-only — nooit in browser bundle
      external: ["@anthropic-ai/sdk"],
    },
  },
});
