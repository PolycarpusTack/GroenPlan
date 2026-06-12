import { useState, useEffect } from "react";

// Volgt de online/offline-status van de browser. Veilig bij SSR/tests
// (navigator kan ontbreken) → standaard online.
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const aan = () => setOnline(true);
    const uit = () => setOnline(false);
    window.addEventListener("online", aan);
    window.addEventListener("offline", uit);
    return () => {
      window.removeEventListener("online", aan);
      window.removeEventListener("offline", uit);
    };
  }, []);

  return online;
}
