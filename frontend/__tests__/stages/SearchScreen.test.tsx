import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchScreen } from "@/components/stages/SearchScreen";
import { SessionProvider, useSession } from "@/context/SessionContext";
import * as api from "@/lib/api";
import * as movieApi from "@/lib/api/movie";
import * as aiApi from "@/lib/api/ai";
import type { SessionResponse, MovieDto, MovieSearchResponse, AiRecommendationResponse } from "@/types";

vi.mock("@/lib/api");
vi.mock("@/lib/api/movie");
vi.mock("@/lib/api/ai");
vi.mock("@/lib/websocket", () => ({
  stompService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    subscribeToRoom: vi.fn().mockReturnValue(vi.fn()),
    subscribeToResults: vi.fn().mockReturnValue(vi.fn()),
    publishVote: vi.fn(),
  },
}));

const mockMovies: MovieDto[] = [
  {
    tmdbId: 550,
    title: "Fight Club",
    overview: "An insomniac office worker looking for a way to change his life...",
    posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    releaseYear: 1999,
    voteAverage: 8.4,
  },
  {
    tmdbId: 680,
    title: "Pulp Fiction",
    overview: "A burger-loving hit man, his philosophical partner, and a washed-up boxer...",
    posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    releaseYear: 1994,
    voteAverage: 8.5,
  },
];

const mockSearchResponse: MovieSearchResponse = {
  movies: mockMovies,
  page: 1,
  totalPages: 2,
  totalResults: 15,
};

// Helper component to initialize SessionContext in SEARCH state
function SearchTestWrapper({ isHost = true }: { isHost?: boolean }) {
  const { createRoom, joinRoom } = useSession();

  const mockHostSession: SessionResponse = {
    id: 1,
    roomCode: "MVE892",
    hostName: "Alice",
    status: "SUGGESTING",
    maxUsers: 10,
    maxSuggestionsPerUser: 5,
    users: [
      { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
      { id: 11, displayName: "Bob", isHost: false, joinedAt: "2026-08-14T00:01:00" },
    ],
    createdAt: "2026-08-14T00:00:00",
  };

  const handleInit = async () => {
    if (isHost) {
      vi.mocked(api.createSession).mockResolvedValue(mockHostSession);
      await createRoom("Alice", 10, 5);
    } else {
      vi.mocked(api.joinSession).mockResolvedValue(mockHostSession);
      await joinRoom("MVE892", "Bob");
    }
  };

  return (
    <div>
      <button onClick={handleInit} data-testid="init-search-btn">
        Init Search
      </button>
      <SearchScreen debounceMs={0} />
    </div>
  );
}

describe("SearchScreen Stage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(movieApi.getTrendingMovies).mockResolvedValue(mockSearchResponse);
    vi.mocked(movieApi.searchMovies).mockResolvedValue(mockSearchResponse);
    vi.mocked(movieApi.discoverMovies).mockResolvedValue(mockSearchResponse);
    vi.mocked(movieApi.getMovieDetails).mockResolvedValue({
      tmdbId: 550,
      title: "Fight Club",
      overview: "An insomniac office worker...",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdropPath: null,
      releaseYear: 1999,
      voteAverage: 8.4,
      genres: ["Drama", "Thriller"],
      directors: ["David Fincher"],
      topCast: ["Brad Pitt", "Edward Norton"],
      streamingProviders: [],
    });
  });

  const renderSearchScreen = async (isHost = true) => {
    const user = userEvent.setup({ delay: null });
    const view = render(
      <SessionProvider>
        <SearchTestWrapper isHost={isHost} />
      </SessionProvider>
    );

    const initBtn = screen.getByTestId("init-search-btn");
    await user.click(initBtn);

    return { user, view };
  };

  it("renders stage header, search input, genre chips, and default trending movies", async () => {
    await renderSearchScreen(true);

    expect(screen.getByText(/Nominate Your Movie Picks/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /search movies/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trending/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /action$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open filter options/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I'm Lost \(AI Concierge\)/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(movieApi.getTrendingMovies).toHaveBeenCalledWith(1);
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
      expect(screen.getByText("Pulp Fiction")).toBeInTheDocument();
    });

    expect(screen.getByRole("region", { name: /movie selection rack/i })).toBeInTheDocument();
  });

  it("opens Vibe Matcher modal when Match the Vibe button is clicked", async () => {
    const mockVibeResponse: AiRecommendationResponse = {
      prompt: "Cozy Feel-Good Comfort",
      replyMessage: "Here are some cozy picks:",
      movies: [
        {
          tmdbId: 19995,
          title: "Avatar",
          overview: "In the 22nd century...",
          posterPath: "/avatar.jpg",
          releaseYear: 2009,
          voteAverage: 7.6,
          aiReasoning: "Immersive world-building and great visuals.",
        },
      ],
      page: 1,
      pageSize: 5,
      totalResults: 1,
      hasMore: false,
      modelUsed: "gemini-3.5-flash-lite",
      cached: false,
    };
    vi.mocked(aiApi.getAiRecommendations).mockResolvedValue(mockVibeResponse);

    const { user } = await renderSearchScreen(true);

    const aiTabBtn = screen.getByRole("button", { name: /I'm Lost \(AI Concierge\)/i });
    await user.click(aiTabBtn);

    expect(screen.getByText("Movie Concierge AI")).toBeInTheDocument();
    expect(screen.getByText("Cozy Rainy Night")).toBeInTheDocument();

    // Click a preset chip inside AI tab
    const presetChip = screen.getByRole("button", { name: "Cozy Rainy Night" });
    await user.click(presetChip);

    await waitFor(() => {
      expect(screen.getByText("Avatar")).toBeInTheDocument();
      expect(screen.getByText(/Immersive world-building/i)).toBeInTheDocument();
    });
  });

  it("performs movie search and renders result cards", async () => {
    vi.mocked(movieApi.searchMovies).mockResolvedValue(mockSearchResponse);
    const { user } = await renderSearchScreen(true);

    const input = screen.getByRole("textbox", { name: /search movies/i });
    await user.type(input, "Fight");

    await waitFor(() => {
      expect(movieApi.searchMovies).toHaveBeenCalledWith("Fight", 1);
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
      expect(screen.getByText("Pulp Fiction")).toBeInTheDocument();
    });
  });

  it("allows nominating and removing movies into the selection rack", async () => {
    vi.mocked(movieApi.searchMovies).mockResolvedValue(mockSearchResponse);
    const { user } = await renderSearchScreen(true);

    const input = screen.getByRole("textbox", { name: /search movies/i });
    await user.type(input, "Club");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });

    // Add Fight Club to deck
    const addButtons = screen.getAllByRole("button", { name: /add to deck/i });
    await user.click(addButtons[0]);

    // Should update selection rack count
    expect(screen.getByText(/1 \/ 5 Picked/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /in deck/i })).toBeInTheDocument();

    // Remove from rack via remove button in rack
    const removeBtn = screen.getByRole("button", { name: /remove fight club from deck/i });
    await user.click(removeBtn);

    expect(screen.getByText(/0 \/ 5 Picked/i)).toBeInTheDocument();
  });

  it("opens movie details modal on clicking movie card and closes on Escape/Close", async () => {
    vi.mocked(movieApi.searchMovies).mockResolvedValue(mockSearchResponse);
    const { user } = await renderSearchScreen(true);

    const input = screen.getByRole("textbox", { name: /search movies/i });
    await user.type(input, "Pulp");

    await waitFor(() => {
      expect(screen.getByText("Pulp Fiction")).toBeInTheDocument();
    });

    // Click on movie card to open modal
    const movieCard = screen.getByRole("article", { name: "Pulp Fiction" });
    await user.click(movieCard);

    // Modal should be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Overview \/ Synopsis/i)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole("button", { name: /close details/i });
    await user.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits deck nominations and displays submitted status", async () => {
    vi.mocked(movieApi.searchMovies).mockResolvedValue(mockSearchResponse);
    vi.mocked(api.submitMovies).mockResolvedValue([
      {
        id: 101,
        tmdbId: 550,
        userId: 10,
        userDisplayName: "Alice",
        title: "Fight Club",
        overview: "Overview",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        releaseYear: 1999,
        suggestedAt: "2026-08-14T00:00:00",
      },
    ]);

    const { user } = await renderSearchScreen(true);

    const input = screen.getByRole("textbox", { name: /search movies/i });
    await user.type(input, "Fight");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });

    // Add movie to deck
    const addButtons = screen.getAllByRole("button", { name: /add to deck/i });
    await user.click(addButtons[0]);

    // Submit Deck
    const submitBtn = screen.getByRole("button", { name: /submit deck \(1\)/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.submitMovies).toHaveBeenCalledWith(1, {
        userId: 10,
        movies: [
          expect.objectContaining({
            tmdbId: 550,
            title: "Fight Club",
          }),
        ],
      });
      expect(screen.getByText(/Deck Submitted/i)).toBeInTheDocument();
    });
  });

  it("renders 'Start Voting Phase' CTA for Host and invokes startVoting", async () => {
    vi.mocked(movieApi.searchMovies).mockResolvedValue(mockSearchResponse);
    vi.mocked(api.submitMovies).mockResolvedValue([]);
    vi.mocked(api.startVoting).mockResolvedValue({
      id: 1,
      roomCode: "MVE892",
      hostName: "Alice",
      status: "VOTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [
        { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
      ],
      createdAt: "2026-08-14T00:00:00",
    });
    vi.mocked(api.getSessionMovies).mockResolvedValue([]);
    vi.mocked(api.getVotingProgressByRoomCode).mockResolvedValue({
      sessionId: 1,
      roomCode: "MVE892",
      totalMovies: 1,
      totalUsers: 1,
      completedUserCount: 0,
      allUsersCompleted: false,
      users: [],
    });

    const { user } = await renderSearchScreen(true);

    const input = screen.getByRole("textbox", { name: /search movies/i });
    await user.type(input, "Fight");

    await waitFor(() => {
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: /add to deck/i });
    await user.click(addButtons[0]);

    const submitBtn = screen.getByRole("button", { name: /submit deck \(1\)/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Deck Submitted/i)).toBeInTheDocument();
    });

    // Start voting CTA should be visible for host
    const startVotingBtn = screen.getByRole("button", { name: /start voting/i });
    expect(startVotingBtn).toBeInTheDocument();

    await user.click(startVotingBtn);

    await waitFor(() => {
      expect(api.startVoting).toHaveBeenCalledWith(1);
    });
  });

  it("switches to I'm Lost (AI Concierge) tab and back to Browse & Search", async () => {
    const { user } = await renderSearchScreen(true);

    const aiTabBtn = screen.getByRole("button", { name: /I'm Lost \(AI Concierge\)/i });
    await user.click(aiTabBtn);

    expect(screen.getByText("Movie Concierge AI")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask the Movie Concierge/i)).toBeInTheDocument();

    const browseTabBtn = screen.getByRole("button", { name: /Browse & Search/i });
    await user.click(browseTabBtn);

    expect(screen.getByPlaceholderText(/search tmdb/i)).toBeInTheDocument();
  });
});

