import type { ApiHandler } from "./types";

// Rapporteert per externe dienst of de server-side sleutel is geconfigureerd.
// Uitsluitend booleans — sleutelmateriaal verlaat de server nooit.
export interface ServiceStatus {
  anthropic: boolean;
  plantnet: boolean;
}

export const statusHandler: ApiHandler = async () => {
  const status: ServiceStatus = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    plantnet: Boolean(process.env.PLANTNET_API_KEY),
  };
  return { status: 200, body: status };
};
