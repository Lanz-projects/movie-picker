import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovieDetailsModal } from "@/components/stages/search/MovieDetailsModal";
import type { MovieDto } from "@/types";

describe("MovieDetailsModal", () => {
  const mockMovie: MovieDto = {
    tmdbId: 101,
    title: "Inception",
    overview: "A thief who steals corporate secrets through dream-sharing technology.",
    posterPath: "/inception.jpg",
    releaseYear: 2010,
    voteAverage: 8.4,
  };

  const mockOnClose = vi.fn();
  const mockOnToggleDeck = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={false}
        onClose={mockOnClose}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders full movie details when isOpen is true", () => {
    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={true}
        onClose={mockOnClose}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inception" })).toBeInTheDocument();
    expect(screen.getByText("2010")).toBeInTheDocument();
    expect(screen.getByText("8.4 / 10")).toBeInTheDocument();
    expect(screen.getByText(mockMovie.overview!)).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={true}
        onClose={mockOnClose}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    const closeBtn = screen.getByRole("button", { name: "Close details" });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key press", () => {
    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={true}
        onClose={mockOnClose}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("adds to deck and closes when Add to Deck button is clicked", () => {
    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={true}
        onClose={mockOnClose}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    const addBtn = screen.getByRole("button", { name: /Add to Deck/i });
    fireEvent.click(addBtn);

    expect(mockOnToggleDeck).toHaveBeenCalledWith(mockMovie);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("removes from deck and closes when Remove from Deck button is clicked", () => {
    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={true}
        onClose={mockOnClose}
        isInDeck={true}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    const removeBtn = screen.getByRole("button", { name: /Remove from Deck/i });
    fireEvent.click(removeBtn);

    expect(mockOnToggleDeck).toHaveBeenCalledWith(mockMovie);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
