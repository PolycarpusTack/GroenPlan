import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onSluit: () => void;
  children: React.ReactNode;
  titel?: string;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

export function MobileSheet({ open, onSluit, children }: Props) {
  const isMobile = useIsMobile();

  // Vergrendel body-scroll bij open sheet op mobiel
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, open]);

  if (!open) return null;

  // Desktop: render inline (geen sheet)
  if (!isMobile) {
    return <>{children}</>;
  }

  // Mobiel: bottom sheet via portal
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onSluit}
        aria-hidden
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[92dvh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Sleepgreep */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--gp-border)]" />
        </div>
        <div className="px-4 pb-8">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
