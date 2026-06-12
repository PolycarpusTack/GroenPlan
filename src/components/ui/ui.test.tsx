import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, Card, Chip, PageHeader } from "./index";

describe("Button", () => {
  it("rendert de gp-btn basisklasse + variant en is type=button", () => {
    render(<Button variant="secondary">Opslaan</Button>);
    const knop = screen.getByRole("button", { name: "Opslaan" });
    expect(knop).toHaveClass("gp-btn", "gp-btn-secondary");
    expect(knop).toHaveAttribute("type", "button");
  });

  it("voegt eigen className toe en geeft DOM-props door", () => {
    render(
      <Button className="extra" disabled>
        X
      </Button>,
    );
    const knop = screen.getByRole("button", { name: "X" });
    expect(knop).toHaveClass("gp-btn", "gp-btn-primary", "extra");
    expect(knop).toBeDisabled();
  });
});

describe("Card", () => {
  it("rendert default en bordered varianten", () => {
    const { rerender } = render(<Card>inhoud</Card>);
    expect(screen.getByText("inhoud")).toHaveClass("gp-card");
    rerender(<Card variant="bordered">inhoud</Card>);
    expect(screen.getByText("inhoud")).toHaveClass("gp-card-bordered");
  });
});

describe("Chip", () => {
  it("mapt tone naar de juiste gp-chip-klassen", () => {
    render(<Chip tone="good">bio</Chip>);
    expect(screen.getByText("bio")).toHaveClass("gp-chip", "gp-chip-good");
  });
});

describe("PageHeader", () => {
  it("rendert titel als h1 met optionele subtitel en acties", () => {
    render(
      <PageHeader title="Taken" subtitle="2 open" actions={<button>Nieuw</button>} />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Taken" })).toBeInTheDocument();
    expect(screen.getByText("2 open")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nieuw" })).toBeInTheDocument();
  });
});
