import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MovieDetailsModal } from "@/components/stages/search/MovieDetailsModal";
import * as movieApi from "@/lib/api/movie";
import type { MovieDto, MovieDetailsDto } from "@/types";

vi.mock("@/lib/api/movie", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/movie")>("@/lib/api/movie");
  return {
    ...actual,
    getMovieDetails: vi.fn(),
  };
});

describe("MovieDetailsModal", () => {
  const mockMovie: MovieDto = {
    tmdbId: 101,
    title: "Inception",
    overview: "A thief who steals corporate secrets through dream-sharing technology.",
    posterPath: "/inception.jpg",
    backdropPath: "/inception_backdrop.jpg",
    releaseYear: 2010,
    releaseDate: "2010-07-16",
    voteAverage: 8.4,
    voteCount: 34500,
    genres: ["Action", "Sci-Fi", "Adventure"],
    originalLanguage: "en",
  };

  const mockDetailsDto: MovieDetailsDto = {
    tmdbId: 101,
    title: "Inception",
    tagline: "Your mind is the scene of the crime.",
    overview: "A thief who steals corporate secrets through dream-sharing technology.",
    posterPath: "/inception.jpg",
    backdropPath: "/inception_backdrop.jpg",
    releaseYear: 2010,
    releaseDate: "2010-07-16",
    runtime: 148,
    formattedRuntime: "2h 28m",
    contentRating: "PG-13",
    voteAverage: 8.4,
    voteCount: 34500,
    popularity: 92.5,
    originalLanguage: "en",
    genres: ["Action", "Sci-Fi", "Adventure"],
    directors: ["Christopher Nolan"],
    topCast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    streamingProviders: [
      { providerId: 8, providerName: "Netflix", logoPath: "/netflix.jpg", type: "Stream" },
    ],
    tmdbUrl: "https://www.themoviedb.org/movie/101",
  };

  const mockOnClose = vi.fn();
  const mockOnToggleDeck = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(movieApi.getMovieDetails).mockResolvedValue(mockDetailsDto);
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

  it("renders full movie details, genres, directors, cast, and streaming when isOpen is true", async () => {
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
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
    expect(screen.getByText("Adventure")).toBeInTheDocument();
    expect(screen.getByText("34.5k votes")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
      expect(screen.getByText(/Leonardo DiCaprio/i)).toBeInTheDocument();
      expect(screen.getByText("2h 28m")).toBeInTheDocument();
      expect(screen.getByText("PG-13")).toBeInTheDocument();
      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText("“Your mind is the scene of the crime.”")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /View full page on TMDB/i })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/101"
    );
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

    expect(mockOnToggleDeck).toHaveBeenCalledWith(expect.objectContaining({
      tmdbId: 101,
      title: "Inception",
    }));
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

    expect(mockOnToggleDeck).toHaveBeenCalledWith(expect.objectContaining({
      tmdbId: 101,
      title: "Inception",
    }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("expands and collapses starring cast when Show More / Show Less button is clicked", async () => {
    const movieWithManyCast: MovieDetailsDto = {
      ...mockDetailsDto,
      topCast: [
        "Leonardo DiCaprio",
        "Joseph Gordon-Levitt",
        "Elliot Page",
        "Tom Hardy",
        "Ken Watanabe",
        "Cillian Murphy",
        "Michael Caine",
      ],
    };
    vi.mocked(movieApi.getMovieDetails).mockResolvedValue(movieWithManyCast);

    render(
      <MovieDetailsModal
        movie={mockMovie}
        isOpen={true}
        onClose={mockOnClose}
        isInDeck={false}
        onToggleDeck={mockOnToggleDeck}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Leonardo DiCaprio/i)).toBeInTheDocument();
      expect(screen.getByText("+3 more")).toBeInTheDocument();
    });

    // Initially 5th+ cast member should not be displayed
    expect(screen.queryByText("Michael Caine")).not.toBeInTheDocument();

    // Click Show More
    const showMoreBtn = screen.getByRole("button", { name: /\+3 more/i });
    fireEvent.click(showMoreBtn);

    // Now all cast members should be visible
    expect(screen.getByText("Michael Caine")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();

    // Click Show Less
    const showLessBtn = screen.getByRole("button", { name: /Show less/i });
    fireEvent.click(showLessBtn);

    expect(screen.queryByText("Michael Caine")).not.toBeInTheDocument();
    expect(screen.getByText("+3 more")).toBeInTheDocument();
  });
});
