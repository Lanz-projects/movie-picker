import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SessionProvider, useSession } from "@/context/SessionContext";
import * as api from "@/lib/api";
import { stompService } from "@/lib/websocket";
import type {
  SessionResponse,
  VotingProgressResponse,
  SessionResultsResponse,
  RoomProgressEvent,
} from "@/types";

// Mock API and WebSocket
vi.mock("@/lib/api");
vi.mock("@/lib/websocket", () => {
  return {
    stompService: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      subscribeToRoom: vi.fn().mockReturnValue(vi.fn()),
      subscribeToResults: vi.fn().mockReturnValue(vi.fn()),
      publishVote: vi.fn(),
    },
  };
});

describe("SessionContext & useSession Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  it("initializes with default SETUP stage and empty session", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.stage).toBe("SETUP");
    expect(result.current.session).toBeNull();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isHost).toBe(false);
    expect(result.current.myDeckSelection).toEqual([]);
  });

  it("createRoom creates room, sets host, connects websocket, and transitions to LOBBY", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    expect(api.createSession).toHaveBeenCalledWith({
      hostName: "Alice",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
    });
    expect(result.current.session?.roomCode).toBe("MVE8");
    expect(result.current.currentUser?.displayName).toBe("Alice");
    expect(result.current.isHost).toBe(true);
    expect(result.current.stage).toBe("LOBBY");
    expect(stompService.connect).toHaveBeenCalled();
  });

  it("joinRoom joins existing room, sets guest role, and transitions to LOBBY", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [
        { id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" },
        { id: 11, displayName: "Bob", joinedAt: "2026-08-14T00:01:00" },
      ],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.joinSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.joinRoom("MVE8", "Bob");
    });

    expect(api.joinSession).toHaveBeenCalledWith({
      roomCode: "MVE8",
      displayName: "Bob",
    });
    expect(result.current.currentUser?.displayName).toBe("Bob");
    expect(result.current.isHost).toBe(false);
    expect(result.current.stage).toBe("LOBBY");
  });

  it("leaveRoom calls leave API, disconnects websocket, and resets to SETUP", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);
    vi.mocked(api.leaveSessionByRoomCode).mockResolvedValue({
      message: "Left session",
      newHostName: null,
      sessionClosed: true,
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    await act(async () => {
      await result.current.leaveRoom();
    });

    expect(api.leaveSessionByRoomCode).toHaveBeenCalledWith("MVE8", 10);
    expect(stompService.disconnect).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
    expect(result.current.stage).toBe("SETUP");
  });

  it("manages deck selection rack tray during search stage", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 2,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice", 10, 2);
    });

    act(() => {
      result.current.addToDeck({
        id: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/inception.jpg",
        releaseDate: "2010-07-15",
        voteAverage: 8.4,
        voteCount: 35000,
      });
    });

    expect(result.current.myDeckSelection).toHaveLength(1);
    expect(result.current.myDeckSelection[0].title).toBe("Inception");

    // Deduplication test: adding same movie again does not duplicate
    act(() => {
      result.current.addToDeck({
        id: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/inception.jpg",
        releaseDate: "2010-07-15",
        voteAverage: 8.4,
        voteCount: 35000,
      });
    });

    expect(result.current.myDeckSelection).toHaveLength(1);

    // Remove from deck
    act(() => {
      result.current.removeFromDeck(27205);
    });

    expect(result.current.myDeckSelection).toHaveLength(0);
  });

  it("castSwipeVote publishes to WebSocket /app/vote", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "VOTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    await act(async () => {
      await result.current.castSwipeVote(100, "SUPERLIKE");
    });

    expect(stompService.publishVote).toHaveBeenCalledWith({
      roomCode: "MVE8",
      userId: 10,
      movieSuggestionId: 100,
      voteType: "SUPERLIKE",
    });
  });

  it("updates progress when room progress event arrives over WebSocket", async () => {
    let roomProgressHandler: ((event: RoomProgressEvent) => void) | null = null;
    vi.mocked(stompService.subscribeToRoom).mockImplementation((_roomCode, callback) => {
      roomProgressHandler = callback;
      return vi.fn();
    });

    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "VOTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    const incomingProgress: VotingProgressResponse = {
      sessionId: 1,
      totalMovies: 5,
      totalUsers: 1,
      completedUserCount: 1,
      allUsersCompleted: true,
      users: [{ userId: 10, displayName: "Alice", votedCount: 5, completed: true }],
    };

    act(() => {
      roomProgressHandler?.({
        eventType: "ALL_VOTING_COMPLETED",
        roomCode: "MVE8",
        userId: 10,
        userDisplayName: "Alice",
        movieSuggestionId: 100,
        tmdbId: 27205,
        movieTitle: "Inception",
        voteType: "LIKE",
        progress: incomingProgress,
      });
    });

    expect(result.current.progress).toEqual(incomingProgress);
  });

  it("automatically transitions to WINNER stage when results arrive over WebSocket", async () => {
    let resultsHandler: ((results: SessionResultsResponse) => void) | null = null;
    vi.mocked(stompService.subscribeToResults).mockImplementation((_roomCode, callback) => {
      resultsHandler = callback;
      return vi.fn();
    });

    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "VOTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    const incomingResults: SessionResultsResponse = {
      sessionId: 1,
      roomCode: "MVE8",
      totalParticipants: 1,
      totalMovies: 5,
      winner: {
        movieSuggestionId: 100,
        tmdbId: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/poster.jpg",
        score: 2,
        yesVotes: 1,
        superlikeVotes: 0,
        noVotes: 0,
        skipVotes: 0,
        matchPercentage: 100,
        isUnanimous: true,
      },
      rankedMovies: [],
    };

    act(() => {
      resultsHandler?.(incomingResults);
    });

    expect(result.current.results).toEqual(incomingResults);
    expect(result.current.stage).toBe("WINNER");
  });
});
