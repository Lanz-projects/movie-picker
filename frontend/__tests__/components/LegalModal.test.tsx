import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LegalModal } from "@/components/ui/LegalModal";

describe("LegalModal Component", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(<LegalModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all legal and privacy disclosures when open", () => {
    render(<LegalModal isOpen={true} onClose={vi.fn()} />);

    // Header & Modal Title
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Privacy & Attributions")).toBeInTheDocument();

    // TMDB Attribution
    expect(screen.getByText("The Movie Database (TMDB) Attribution")).toBeInTheDocument();
    expect(
      screen.getByText("This product uses the TMDB API but is not endorsed or certified by TMDB.")
    ).toBeInTheDocument();

    // Google Gemini AI Disclosure
    expect(screen.getByText("Google Gemini AI Disclosure")).toBeInTheDocument();
    expect(screen.getByText(/Conversational movie recommendations/i)).toBeInTheDocument();

    // Privacy Notice
    expect(screen.getByText("Privacy Notice & Ephemeral Data Handling")).toBeInTheDocument();
    expect(screen.getByText(/No personal accounts, email addresses, or passwords/i)).toBeInTheDocument();

    // Open Source Notice
    expect(screen.getByText("Open Source & License")).toBeInTheDocument();
    expect(screen.getByText(/MIT License/i)).toBeInTheDocument();
  });

  it("invokes onClose when clicking close button or Got It button", () => {
    const handleClose = vi.fn();
    render(<LegalModal isOpen={true} onClose={handleClose} />);

    // Click Close 'X' button
    const closeBtn = screen.getByLabelText("Close modal");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Click 'Got it' action button
    const gotItBtn = screen.getByRole("button", { name: /Got it/i });
    fireEvent.click(gotItBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("invokes onClose when pressing Escape key", () => {
    const handleClose = vi.fn();
    render(<LegalModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
