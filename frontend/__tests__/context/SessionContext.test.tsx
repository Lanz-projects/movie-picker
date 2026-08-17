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
      connect: vi.fn(({ onConnect }: { onConnect?: () => void }) => {
        onConnect?.();
      }),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      subscribeToRoom: vi.fn().mockReturnValue(vi.fn()),
      subscribeToResults: vi.fn().mockReturnValue(vi.fn()),
      publishVote: vi.fn(),
      registerPresence: vi.fn(),
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
        tmdbId: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/inception.jpg",
        releaseYear: 2010,
        voteAverage: 8.4,
      });
    });

    expect(result.current.myDeckSelection).toHaveLength(1);
    expect(result.current.myDeckSelection[0].title).toBe("Inception");

    // Deduplication test: adding same movie again does not duplicate
    act(() => {
      result.current.addToDeck({
        tmdbId: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/inception.jpg",
        releaseYear: 2010,
        voteAverage: 8.4,
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

  it("updates room roster immediately when USER_JOINED arrives over WebSocket", async () => {
    let roomProgressHandler: ((event: RoomProgressEvent) => void) | null = null;
    vi.mocked(stompService.subscribeToRoom).mockImplementation((_roomCode, callback) => {
      roomProgressHandler = callback;
      return vi.fn();
    });

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

    expect(stompService.registerPresence).toHaveBeenCalledWith("MVE8", 10, "Alice");

    // Incoming USER_JOINED event
    act(() => {
      roomProgressHandler?.({
        eventType: "USER_JOINED",
        roomCode: "MVE8",
        userId: 11,
        userDisplayName: "Bob",
        hostName: "Alice",
        sessionStatus: "WAITING",
        users: [
          { id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" },
          { id: 11, displayName: "Bob", joinedAt: "2026-08-14T00:01:00" },
        ],
      });
    });

    expect(result.current.session?.users).toHaveLength(2);
    expect(result.current.session?.users[1].displayName).toBe("Bob");
  });

  it("updates room roster and host when USER_LEFT arrives over WebSocket", async () => {
    let roomProgressHandler: ((event: RoomProgressEvent) => void) | null = null;
    vi.mocked(stompService.subscribeToRoom).mockImplementation((_roomCode, callback) => {
      roomProgressHandler = callback;
      return vi.fn();
    });

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

    expect(result.current.isHost).toBe(false);

    // Host Alice leaves -> Bob becomes host
    act(() => {
      roomProgressHandler?.({
        eventType: "USER_LEFT",
        roomCode: "MVE8",
        hostName: "Bob",
        sessionStatus: "WAITING",
        users: [{ id: 11, displayName: "Bob", joinedAt: "2026-08-14T00:01:00" }],
      });
    });

    expect(result.current.session?.users).toHaveLength(1);
    expect(result.current.session?.hostName).toBe("Bob");
    expect(result.current.isHost).toBe(true);
  });

  it("transitions stages immediately when STAGE_CHANGED arrives over WebSocket", async () => {
    let roomProgressHandler: ((event: RoomProgressEvent) => void) | null = null;
    vi.mocked(stompService.subscribeToRoom).mockImplementation((_roomCode, callback) => {
      roomProgressHandler = callback;
      return vi.fn();
    });

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

    expect(result.current.stage).toBe("LOBBY");

    // Advance to SUGGESTING
    act(() => {
      roomProgressHandler?.({
        eventType: "STAGE_CHANGED",
        roomCode: "MVE8",
        sessionStatus: "SUGGESTING",
      });
    });

    expect(result.current.stage).toBe("SEARCH");
    expect(result.current.session?.status).toBe("SUGGESTING");
  });

  it("fetchConsensusResults calls getResultsByRoomCode and transitions to WINNER", async () => {
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

    const mockResults: SessionResultsResponse = {
      sessionId: 1,
      roomCode: "MVE8",
      totalParticipants: 1,
      totalMovies: 3,
      winner: {
        movieSuggestionId: 100,
        tmdbId: 550,
        title: "Fight Club",
        posterPath: "/fc.jpg",
        overview: "Overview",
        score: 3,
        yesVotes: 1,
        superlikeVotes: 1,
        noVotes: 0,
        skipVotes: 0,
        matchPercentage: 100,
        isUnanimous: true,
      },
      rankedMovies: [],
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);
    vi.mocked(api.getResultsByRoomCode).mockResolvedValue(mockResults);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    await act(async () => {
      await result.current.fetchConsensusResults();
    });

    expect(api.getResultsByRoomCode).toHaveBeenCalledWith("MVE8");
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.stage).toBe("WINNER");
  });

  it("fetchConsensusResults falls back to calculateResults when getResultsByRoomCode throws", async () => {
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

    const mockResults: SessionResultsResponse = {
      sessionId: 1,
      roomCode: "MVE8",
      totalParticipants: 1,
      totalMovies: 1,
      winner: null,
      rankedMovies: [],
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);
    vi.mocked(api.getResultsByRoomCode).mockRejectedValue(new Error("Not calculated yet"));
    vi.mocked(api.calculateResults).mockResolvedValue(mockResults);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    await act(async () => {
      await result.current.fetchConsensusResults();
    });

    expect(api.getResultsByRoomCode).toHaveBeenCalledWith("MVE8");
    expect(api.calculateResults).toHaveBeenCalledWith(1);
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.stage).toBe("WINNER");
  });

  it("playAgain updates session status to SUGGESTING and transitions back to SEARCH", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "COMPLETED",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    const updatedSession: SessionResponse = {
      ...mockSession,
      status: "SUGGESTING",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);
    vi.mocked(api.updateSessionStatus).mockResolvedValue(updatedSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    await act(async () => {
      await result.current.playAgain();
    });

    expect(api.updateSessionStatus).toHaveBeenCalledWith("MVE8", "SUGGESTING");
    expect(result.current.stage).toBe("SEARCH");
    expect(result.current.results).toBeNull();
  });

  it("resetToLobby updates session status to WAITING and resets stage to LOBBY", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Alice",
      status: "COMPLETED",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    const updatedSession: SessionResponse = {
      ...mockSession,
      status: "WAITING",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);
    vi.mocked(api.updateSessionStatus).mockResolvedValue(updatedSession);

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.createRoom("Alice");
    });

    await act(async () => {
      await result.current.resetToLobby();
    });

    expect(api.updateSessionStatus).toHaveBeenCalledWith("MVE8", "WAITING");
    expect(result.current.stage).toBe("LOBBY");
    expect(result.current.results).toBeNull();
  });
});
