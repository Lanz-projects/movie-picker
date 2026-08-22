import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VibeMatcherModal } from "@/components/stages/search/VibeMatcherModal";
import * as aiApi from "@/lib/api/ai";
import type { AiRecommendationResponse, MovieDto } from "@/types";

describe("VibeMatcherModal Component", () => {
  const mockOnClose = vi.fn();
  const mockOnToggleDeck = vi.fn();

  const sampleMovies: MovieDto[] = [
    {
      tmdbId: 603,
      title: "The Matrix",
      overview: "A computer hacker learns about the true nature of his reality.",
      posterPath: "/matrix.jpg",
      releaseYear: 1999,
      voteAverage: 8.2,
      aiReasoning: "Iconic cyberpunk action with mind-bending virtual reality.",
    },
    {
      tmdbId: 550,
      title: "Fight Club",
      overview: "An insomniac office worker looking for a way to change his life.",
      posterPath: "/fightclub.jpg",
      releaseYear: 1999,
      voteAverage: 8.4,
      aiReasoning: "Gritty 90s psychological thriller with unmatched style.",
    },
  ];

  const mockResponse: AiRecommendationResponse = {
    prompt: "90s mind bending thriller",
    replyMessage: "Here are top-tier recommendations for that vibe:",
    movies: sampleMovies,
    page: 1,
    pageSize: 5,
    totalResults: 6,
    hasMore: true,
    modelUsed: "gemini-3.5-flash-lite",
    cached: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <VibeMatcherModal
        isOpen={false}
        onClose={mockOnClose}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal header, preset chips, and input when open", () => {
    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Match the Vibe")).toBeInTheDocument();
    expect(screen.getByText("90s Nostalgia Thriller")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/cozy rainy day mystery/i)).toBeInTheDocument();
  });

  it("fetches and displays recommendations when typing a prompt and submitting", async () => {
    vi.spyOn(aiApi, "getAiRecommendations").mockResolvedValueOnce(mockResponse);

    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    const input = screen.getByPlaceholderText(/cozy rainy day mystery/i);
    fireEvent.change(input, { target: { value: "90s mind bending thriller" } });

    const submitBtn = screen.getByRole("button", { name: /Find Matches/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(aiApi.getAiRecommendations).toHaveBeenCalledWith(
        "ROOM12",
        {
          prompt: "90s mind bending thriller",
          page: 1,
          limit: 5,
          excludedTmdbIds: [],
        },
        expect.anything()
      );
    });

    expect(await screen.findByText("The Matrix")).toBeInTheDocument();
    expect(screen.getByText(/Iconic cyberpunk action/i)).toBeInTheDocument();
    expect(screen.getByText("Here are top-tier recommendations for that vibe:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load More Movies/i })).toBeInTheDocument();
  });

  it("triggers recommendation fetch when clicking a preset vibe chip", async () => {
    vi.spyOn(aiApi, "getAiRecommendations").mockResolvedValueOnce(mockResponse);

    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    const presetChip = screen.getByRole("button", { name: "90s Nostalgia Thriller" });
    fireEvent.click(presetChip);

    await waitFor(() => {
      expect(aiApi.getAiRecommendations).toHaveBeenCalledWith(
        "ROOM12",
        {
          prompt: "90s Nostalgia Thriller",
          page: 1,
          limit: 5,
          excludedTmdbIds: [],
        },
        expect.anything()
      );
    });
  });

  it("invokes onToggleDeck when clicking Nominate button", async () => {
    vi.spyOn(aiApi, "getAiRecommendations").mockResolvedValueOnce(mockResponse);

    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "90s Nostalgia Thriller" }));

    const nominateBtn = await screen.findByRole("button", { name: /Nominate The Matrix/i });
    fireEvent.click(nominateBtn);

    expect(mockOnToggleDeck).toHaveBeenCalledWith(sampleMovies[0]);
  });

  it("shows Nominated status if movie is already in deckMovieIds", async () => {
    vi.spyOn(aiApi, "getAiRecommendations").mockResolvedValueOnce(mockResponse);

    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        roomCode="ROOM12"
        deckMovieIds={[603]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "90s Nostalgia Thriller" }));

    expect(await screen.findByRole("button", { name: /Remove The Matrix from deck/i })).toBeInTheDocument();
  });

  it("loads more movies when clicking Load More button", async () => {
    vi.spyOn(aiApi, "getAiRecommendations")
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce({
        ...mockResponse,
        page: 2,
        hasMore: false,
        movies: [
          {
            tmdbId: 101,
            title: "Dark City",
            overview: "A man struggles with memories.",
            posterPath: "/darkcity.jpg",
            releaseYear: 1998,
            voteAverage: 7.6,
            aiReasoning: "Atmospheric neo-noir sci-fi.",
          },
        ],
      });

    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "90s Nostalgia Thriller" }));

    const loadMoreBtn = await screen.findByRole("button", { name: /Load More Movies/i });
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(aiApi.getAiRecommendations).toHaveBeenCalledWith(
        "ROOM12",
        {
          prompt: "90s Nostalgia Thriller",
          page: 2,
          limit: 5,
          excludedTmdbIds: [],
        },
        expect.anything()
      );
    });

    expect(await screen.findByText("Dark City")).toBeInTheDocument();
  });

  it("displays error message when API call fails", async () => {
    vi.spyOn(aiApi, "getAiRecommendations").mockRejectedValueOnce(
      new Error("High demand, please retry.")
    );

    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "90s Nostalgia Thriller" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("High demand, please retry.");
  });

  it("closes when clicking close button or pressing Escape", () => {
    render(
      <VibeMatcherModal
        isOpen={true}
        onClose={mockOnClose}
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Close vibe matcher/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
