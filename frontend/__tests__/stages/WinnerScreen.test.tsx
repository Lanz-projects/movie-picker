import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WinnerScreen } from "@/components/stages/WinnerScreen";
import { useSession } from "@/context/SessionContext";
import type { SessionResultsResponse } from "@/types";

vi.mock("@/context/SessionContext", () => ({
  useSession: vi.fn(),
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/api/movie", () => ({
  getMovieDetails: vi.fn().mockResolvedValue({
    tmdbId: 550,
    title: "Fight Club",
    overview: "Detailed synopsis",
    posterPath: "/fightclub.jpg",
    backdropPath: "/backdrop.jpg",
    releaseYear: 1999,
    genres: ["Drama", "Thriller"],
    voteAverage: 8.4,
    directors: ["David Fincher"],
    cast: ["Brad Pitt", "Edward Norton"],
    streamingProviders: [],
  }),
}));

describe("WinnerScreen Stage Container", () => {
  const mockResults: SessionResultsResponse = {
    sessionId: 1,
    roomCode: "WINR",
    totalParticipants: 2,
    totalMovies: 2,
    calculatedAt: "2026-08-16T22:00:00",
    winner: {
      movieSuggestionId: 100,
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/fightclub.jpg",
      overview: "An insomniac office worker...",
      releaseYear: 1999,
      suggestedBy: "Alice",
      score: 4,
      yesVotes: 2,
      superlikeVotes: 1,
      noVotes: 0,
      skipVotes: 0,
      matchPercentage: 100,
      isUnanimous: true,
      positiveVoters: ["Alice", "Bob"],
      superlikers: ["Alice"],
    },
    rankedMovies: [
      {
        movieSuggestionId: 101,
        tmdbId: 27205,
        title: "Inception",
        posterPath: "/inception.jpg",
        overview: "A thief who steals...",
        releaseYear: 2010,
        suggestedBy: "Bob",
        score: 2,
        yesVotes: 1,
        superlikeVotes: 0,
        noVotes: 1,
        skipVotes: 0,
        matchPercentage: 50,
        isUnanimous: false,
        positiveVoters: ["Bob"],
        superlikers: [],
      },
    ],
  };

  const defaultMockSession = {
    results: mockResults,
    isHost: true,
    isLoading: false,
    playAgain: vi.fn(),
    resetToLobby: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue(defaultMockSession as unknown as ReturnType<typeof useSession>);
  });

  it("renders stage title, winner card, and leaderboard rankings", () => {
    render(<WinnerScreen />);

    expect(screen.getByText("Consensus Results")).toBeInTheDocument();
    expect(screen.getByText("Tonight's Pick")).toBeInTheDocument();
    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("Runner-Ups & Rankings")).toBeInTheDocument();
    expect(screen.getByText("Inception")).toBeInTheDocument();
  });

  it("renders host action controls and invokes playAgain and resetToLobby", () => {
    const playAgainMock = vi.fn();
    const resetToLobbyMock = vi.fn();

    vi.mocked(useSession).mockReturnValue({
      ...defaultMockSession,
      isHost: true,
      playAgain: playAgainMock,
      resetToLobby: resetToLobbyMock,
    } as unknown as ReturnType<typeof useSession>);

    render(<WinnerScreen />);

    const playAgainBtn = screen.getByRole("button", {
      name: /Play Again/i,
    });
    const returnLobbyBtn = screen.getByRole("button", {
      name: /Return to Lobby/i,
    });

    expect(playAgainBtn).toBeInTheDocument();
    expect(returnLobbyBtn).toBeInTheDocument();

    fireEvent.click(playAgainBtn);
    expect(playAgainMock).toHaveBeenCalledTimes(1);

    fireEvent.click(returnLobbyBtn);
    expect(resetToLobbyMock).toHaveBeenCalledTimes(1);
  });

  it("renders participant waiting badge when user is not the host", () => {
    vi.mocked(useSession).mockReturnValue({
      ...defaultMockSession,
      isHost: false,
    } as unknown as ReturnType<typeof useSession>);

    render(<WinnerScreen />);

    expect(
      screen.getByText(/Waiting for host to start another round/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Play Again/i })
    ).not.toBeInTheDocument();
  });

  it("opens MovieDetailsModal when clicking view details on winner card", async () => {
    render(<WinnerScreen />);

    const viewDetailsBtn = screen.getByRole("button", {
      name: /View Full Movie Details/i,
    });
    expect(viewDetailsBtn).toBeInTheDocument();

    fireEvent.click(viewDetailsBtn);

    await waitFor(() => {
      expect(screen.getByText("David Fincher")).toBeInTheDocument();
    });
  });
});
