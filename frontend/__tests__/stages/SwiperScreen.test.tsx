import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SwiperScreen } from "@/components/stages/SwiperScreen";
import { SessionProvider, useSession } from "@/context/SessionContext";
import * as api from "@/lib/api";
import type { SessionResponse, MovieSuggestionResponse } from "@/types";

vi.mock("@/lib/api");
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

const mockDeck: MovieSuggestionResponse[] = [
  {
    id: 101,
    tmdbId: 550,
    userId: 10,
    userDisplayName: "Alice",
    title: "Fight Club",
    overview: "An insomniac office worker...",
    posterPath: "/fightclub.jpg",
    releaseYear: 1999,
    suggestedAt: "2026-08-14T00:00:00",
  },
  {
    id: 102,
    tmdbId: 680,
    userId: 11,
    userDisplayName: "Bob",
    title: "Pulp Fiction",
    overview: "A burger-loving hit man...",
    posterPath: "/pulpfiction.jpg",
    releaseYear: 1994,
    suggestedAt: "2026-08-14T00:01:00",
  },
];

function SwiperTestWrapper() {
  const { createRoom, startVotingDeck, stage } = useSession();

  const mockSession: SessionResponse = {
    id: 1,
    roomCode: "MVE892",
    hostName: "Alice",
    status: "WAITING",
    maxUsers: 10,
    maxSuggestionsPerUser: 5,
    users: [
      { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
      { id: 11, displayName: "Bob", isHost: false, joinedAt: "2026-08-14T00:01:00" },
    ],
    createdAt: "2026-08-14T00:00:00",
  };

  const handleInit = async () => {
    vi.mocked(api.createSession).mockResolvedValue(mockSession);
    await createRoom("Alice", 10, 5);
  };

  const handleStartVoting = async () => {
    vi.mocked(api.startVoting).mockResolvedValue({
      ...mockSession,
      status: "VOTING",
    });
    vi.mocked(api.getSessionMovies).mockResolvedValue(mockDeck);
    vi.mocked(api.getVotingProgressByRoomCode).mockResolvedValue({
      sessionId: 1,
      roomCode: "MVE892",
      totalMovies: 2,
      totalUsers: 2,
      completedUserCount: 0,
      allUsersCompleted: false,
      users: [
        { userId: 10, displayName: "Alice", votedCount: 0, completed: false },
        { userId: 11, displayName: "Bob", votedCount: 0, completed: false },
      ],
    });

    await startVotingDeck();
  };

  return (
    <div>
      <button onClick={handleInit} data-testid="init-session-btn">
        Init Session
      </button>
      <button onClick={handleStartVoting} data-testid="start-voting-btn">
        Start Voting
      </button>
      {stage === "SWIPER" && <SwiperScreen animationDurationMs={0} />}
    </div>
  );
}

describe("SwiperScreen Stage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSwiperScreen = async () => {
    const user = userEvent.setup({ delay: null });
    const view = render(
      <SessionProvider>
        <SwiperTestWrapper />
      </SessionProvider>
    );

    const initBtn = screen.getByTestId("init-session-btn");
    await user.click(initBtn);

    const startBtn = screen.getByTestId("start-voting-btn");
    await user.click(startBtn);

    await screen.findByRole("article", { name: "Fight Club" });

    return { user, view };
  };

  it("renders top movie card, deck counter, and circular action buttons", async () => {
    await renderSwiperScreen();

    expect(screen.getByText("Movie 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Fight Club" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^like/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^pass/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^superlike/i })).toBeInTheDocument();
  });

  it("advances card and casts vote on clicking Like button", async () => {
    const { user } = await renderSwiperScreen();

    const likeBtn = screen.getByRole("button", { name: /^like/i });
    await user.click(likeBtn);

    // Wait for card throw-out animation and state update
    await waitFor(() => {
      expect(screen.getByText("Movie 2 of 2")).toBeInTheDocument();
      expect(screen.getByRole("article", { name: "Pulp Fiction" })).toBeInTheDocument();
    });
  });

  it("opens movie details modal on clicking info button and closes on Close", async () => {
    const { user } = await renderSwiperScreen();

    const infoBtn = screen.getByRole("button", { name: /movie info/i });
    await user.click(infoBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Overview \/ Synopsis/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Close details" });
    await user.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("responds to keyboard shortcuts for swiping", async () => {
    await renderSwiperScreen();

    // Press ArrowRight for Like
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Movie 2 of 2")).toBeInTheDocument();
      expect(screen.getByRole("article", { name: "Pulp Fiction" })).toBeInTheDocument();
    });
  });

  it("displays SwiperFinishedView when user completes all deck votes", async () => {
    const { user } = await renderSwiperScreen();

    // Vote on Movie 1
    const likeBtn = screen.getByRole("button", { name: /^like/i });
    await user.click(likeBtn);

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Pulp Fiction" })).toBeInTheDocument();
    });

    // Vote on Movie 2
    const passBtn = screen.getByRole("button", { name: /^pass/i });
    await user.click(passBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your Votes Are Locked In!/i)).toBeInTheDocument();
      expect(screen.getByText(/Waiting for Room Consensus/i)).toBeInTheDocument();
    });
  });
});
