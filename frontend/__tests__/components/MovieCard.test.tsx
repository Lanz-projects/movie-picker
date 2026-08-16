import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovieCard } from "@/components/stages/search/MovieCard";
import type { MovieDto } from "@/types";

describe("MovieCard", () => {
  const mockMovie: MovieDto = {
    tmdbId: 550,
    title: "Fight Club",
    overview: "An insomniac office worker looking for a way to change his life.",
    posterPath: "/fightclub.jpg",
    releaseYear: 1999,
    voteAverage: 8.43,
  };

  const mockOnToggleDeck = vi.fn();
  const mockOnSelectMovie = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders movie details accurately", () => {
    render(
      <MovieCard
        movie={mockMovie}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
      />
    );

    expect(screen.getByRole("heading", { name: "Fight Club" })).toBeInTheDocument();
    expect(screen.getByText("1999")).toBeInTheDocument();
    expect(screen.getByText("8.4")).toBeInTheDocument();
    expect(screen.getByText(mockMovie.overview)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Fight Club" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w500/fightclub.jpg"
    );
  });

  it("renders fallback placeholder when posterPath is null", () => {
    const movieWithoutPoster: MovieDto = {
      ...mockMovie,
      posterPath: null,
    };

    render(
      <MovieCard
        movie={movieWithoutPoster}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByText("Fight Club").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onToggleDeck when 'Add to Deck' button is clicked", () => {
    render(
      <MovieCard
        movie={mockMovie}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
      />
    );

    const addButton = screen.getByRole("button", { name: /Add to Deck/i });
    fireEvent.click(addButton);

    expect(mockOnToggleDeck).toHaveBeenCalledTimes(1);
    expect(mockOnToggleDeck).toHaveBeenCalledWith(mockMovie);
    expect(mockOnSelectMovie).not.toHaveBeenCalled();
  });

  it("renders 'In Deck' state when isInDeck is true and triggers removal on click", () => {
    render(
      <MovieCard
        movie={mockMovie}
        isInDeck={true}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
      />
    );

    const inDeckButton = screen.getByRole("button", { name: /In Deck/i });
    expect(inDeckButton).toBeInTheDocument();

    fireEvent.click(inDeckButton);
    expect(mockOnToggleDeck).toHaveBeenCalledWith(mockMovie);
    expect(mockOnSelectMovie).not.toHaveBeenCalled();
  });

  it("triggers onSelectMovie when the card body is clicked", () => {
    render(
      <MovieCard
        movie={mockMovie}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
      />
    );

    const card = screen.getByRole("article", { name: "Fight Club" });
    fireEvent.click(card);

    expect(mockOnSelectMovie).toHaveBeenCalledTimes(1);
    expect(mockOnSelectMovie).toHaveBeenCalledWith(mockMovie);
    expect(mockOnToggleDeck).not.toHaveBeenCalled();
  });

  it("disables the toggle button when disabled prop is true", () => {
    render(
      <MovieCard
        movie={mockMovie}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
        disabled={true}
      />
    );

    const addButton = screen.getByRole("button", { name: /Add to Deck/i });
    expect(addButton).toBeDisabled();

    fireEvent.click(addButton);
    expect(mockOnToggleDeck).not.toHaveBeenCalled();
  });
});
