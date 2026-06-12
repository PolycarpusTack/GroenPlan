import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

// Slanke, app-brede melding wanneer er geen netwerk is. Lokale data (tuin, zones,
// taken, dagboek) blijft beschikbaar; netwerkfuncties wachten op verbinding.
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-100 border-b border-amber-200 text-caption text-amber-800"
    >
      <WifiOff size={13} aria-hidden />
      Offline — je tuin en taken blijven beschikbaar; AI-, weer- en herkenningsfuncties wachten op verbinding.
    </div>
  );
}
