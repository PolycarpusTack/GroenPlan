import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
}

interface State {
  fout: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { fout: null };

  static getDerivedStateFromError(fout: Error): State {
    return { fout };
  }

  componentDidCatch(fout: Error, info: ErrorInfo) {
    console.error("[GroenPlan] Onafgehandelde fout:", fout, info.componentStack);
  }

  private herstel = () => {
    this.setState({ fout: null });
  };

  render() {
    if (this.state.fout) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="mb-6 p-4 rounded-full bg-[var(--gp-rust-100)]">
            <RefreshCw size={32} className="text-[var(--gp-rust-700)]" aria-hidden />
          </div>
          <h2 className="font-display text-heading-lg text-moss-900 mb-2">
            Er ging iets mis
          </h2>
          <p className="text-body text-moss-500 mb-2 max-w-sm">
            Een onverwachte fout heeft deze pagina laten crashen.
          </p>
          <p className="text-caption text-[var(--gp-text-mute)] mb-6 max-w-sm font-mono bg-[var(--gp-surface-alt)] px-3 py-2 rounded">
            {this.state.fout.message}
          </p>
          <div className="flex gap-3">
            <Button onClick={this.herstel}>
              Opnieuw proberen
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.assign("/")}
            >
              Naar Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
