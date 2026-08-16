import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovieGrid } from "@/components/stages/search/MovieGrid";
import type { MovieDto } from "@/types";

describe("MovieGrid", () => {
  const mockMovies: MovieDto[] = [
    {
      tmdbId: 1,
      title: "Interstellar",
      overview: "Space exploration through a wormhole.",
      posterPath: "/interstellar.jpg",
      releaseYear: 2014,
      voteAverage: 8.6,
    },
    {
      tmdbId: 2,
      title: "Inception",
      overview: "Dream invasion heist.",
      posterPath: "/inception.jpg",
      releaseYear: 2010,
      voteAverage: 8.4,
    },
  ];

  const mockOnToggleDeck = vi.fn();
  const mockOnSelectMovie = vi.fn();
  const mockOnLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders prompt to search when hasSearched is false and no movies", () => {
    render(
      <MovieGrid
        movies={[]}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        hasSearched={false}
      />
    );

    expect(screen.getByText("Search the Movie Catalog")).toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    render(
      <MovieGrid
        movies={[]}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isLoading={true}
      />
    );

    expect(screen.getByTestId("movie-grid-skeleton")).toBeInTheDocument();
  });

  it("renders error banner when error message is present", () => {
    render(
      <MovieGrid
        movies={[]}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        error="Network connection timeout"
      />
    );

    expect(screen.getByText("Search Failed")).toBeInTheDocument();
    expect(screen.getByText("Network connection timeout")).toBeInTheDocument();
  });

  it("renders 'No Movies Found' when hasSearched is true but movies array is empty", () => {
    render(
      <MovieGrid
        movies={[]}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        hasSearched={true}
        query="Nonexistent123"
      />
    );

    expect(screen.getByText("No Movies Found")).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't find any matches for "Nonexistent123"/i)
    ).toBeInTheDocument();
  });

  it("renders list of MovieCard components when movies are provided", () => {
    render(
      <MovieGrid
        movies={mockMovies}
        deckMovieIds={[1]}
        onToggleDeck={mockOnToggleDeck}
        onSelectMovie={mockOnSelectMovie}
      />
    );

    expect(screen.getByRole("article", { name: "Interstellar" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Inception" })).toBeInTheDocument();

    // Interstellar is in deck -> "In Deck"
    expect(screen.getByRole("button", { name: /In Deck/i })).toBeInTheDocument();
    // Inception is not in deck -> "Add to Deck"
    expect(screen.getByRole("button", { name: /Add to Deck/i })).toBeInTheDocument();
  });

  it("renders Load More button when page < totalPages and triggers onLoadMore", () => {
    render(
      <MovieGrid
        movies={mockMovies}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        page={1}
        totalPages={3}
        onLoadMore={mockOnLoadMore}
      />
    );

    const loadMoreBtn = screen.getByRole("button", { name: /Load More Results/i });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });
});
