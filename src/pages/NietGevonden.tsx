import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "../components/ui";

export function NietGevonden() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <MapPin size={40} className="text-[var(--gp-mute)] mb-4" aria-hidden />
      <h1 className="font-display text-display-md text-moss-900 mb-2">Pagina niet gevonden</h1>
      <p className="text-body text-moss-500 mb-6 max-w-sm">
        Deze pagina bestaat niet of is verplaatst.
      </p>
      <Button onClick={() => navigate("/")}>
        Terug naar Dashboard
      </Button>
    </div>
  );
}
