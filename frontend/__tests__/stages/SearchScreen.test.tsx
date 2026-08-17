import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchScreen } from "@/components/stages/SearchScreen";
import { SessionProvider, useSession } from "@/context/SessionContext";
import * as api from "@/lib/api";
import * as movieApi from "@/lib/api/movie";
import type { SessionResponse, MovieDto, MovieSearchResponse } from "@/types";

vi.mock("@/lib/api");
vi.mock("@/lib/api/movie");
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

  it("renders stage header, search input, and initial empty state prompt", async () => {
    await renderSearchScreen(true);

    expect(screen.getByText(/Nominate Your Movie Picks/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /search movies/i })).toBeInTheDocument();
    expect(screen.getByText(/Search the Movie Catalog/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /movie selection rack/i })).toBeInTheDocument();
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
    const startVotingBtn = screen.getByRole("button", { name: /start voting phase/i });
    expect(startVotingBtn).toBeInTheDocument();

    await user.click(startVotingBtn);

    await waitFor(() => {
      expect(api.startVoting).toHaveBeenCalledWith(1);
    });
  });
});
