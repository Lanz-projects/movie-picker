import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "@/components/ui/Badge";

describe("Badge Component", () => {
  it("renders host badge with amber styling", () => {
    render(<Badge variant="host">Host</Badge>);
    const badge = screen.getByText(/host/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-brand-amber");
  });

  it("renders ready badge with emerald styling", () => {
    render(<Badge variant="ready">Ready (4/4)</Badge>);
    const badge = screen.getByText(/ready/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-brand-emerald");
  });

  it("renders unanimous match badge with gradient styling", () => {
    render(<Badge variant="unanimous">100% Unanimous Match</Badge>);
    const badge = screen.getByText(/100% unanimous match/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("from-brand-emerald/20");
  });
});
