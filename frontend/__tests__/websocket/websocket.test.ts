import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StompClientService } from "@/lib/websocket";
import type { RoomProgressEvent, SessionResultsResponse, VoteMessageDto } from "@/types";
import type { StompConfig, IMessage } from "@stomp/stompjs";

const {
  mockSubscribe,
  mockPublish,
  mockActivate,
  mockDeactivate,
  mockUnsubscribe,
} = vi.hoisted(() => {
  return {
    mockSubscribe: vi.fn(),
    mockPublish: vi.fn(),
    mockActivate: vi.fn(),
    mockDeactivate: vi.fn(),
    mockUnsubscribe: vi.fn(),
  };
});

vi.mock("@stomp/stompjs", () => {
  class MockClient {
    public connected = true;
    public active = true;

    constructor(config?: StompConfig) {
      if (config?.onConnect) {
        mockActivate.mockImplementation(() => {
          config.onConnect?.({} as IMessage);
        });
      }
    }

    public activate(): void {
      mockActivate();
    }

    public deactivate(): void {
      mockDeactivate();
      this.connected = false;
      this.active = false;
    }

    public subscribe(destination: string, callback: (message: IMessage) => void) {
      mockSubscribe(destination, callback);
      return {
        id: `sub-${destination}`,
        unsubscribe: mockUnsubscribe,
      };
    }

    public publish(params: { destination: string; body: string }): void {
      mockPublish(params);
    }
  }

  return {
    Client: MockClient,
  };
});

vi.mock("sockjs-client", () => {
  return {
    default: vi.fn(),
  };
});

describe("StompClientService", () => {
  let service: StompClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StompClientService();
  });

  afterEach(() => {
    service.disconnect();
  });

  it("connects and invokes onConnect callback", () => {
    const onConnect = vi.fn();
    service.connect({ onConnect });

    expect(mockActivate).toHaveBeenCalledTimes(1);
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(service.isConnected()).toBe(true);
  });

  it("subscribes to /topic/room/{roomCode} and parses progress events", () => {
    service.connect();

    const onProgress = vi.fn();
    const unsubscribe = service.subscribeToRoom("ABCD", onProgress);

    expect(mockSubscribe).toHaveBeenCalledWith(
      "/topic/room/ABCD",
      expect.any(Function)
    );

    // Simulate incoming message
    const mockEvent: RoomProgressEvent = {
      eventType: "VOTE_CAST",
      roomCode: "ABCD",
      userId: 10,
      userDisplayName: "Alice",
      movieSuggestionId: 100,
      tmdbId: 27205,
      movieTitle: "Inception",
      voteType: "LIKE",
      progress: {
        sessionId: 1,
        totalMovies: 5,
        totalUsers: 2,
        completedUserCount: 0,
        allUsersCompleted: false,
        users: [{ userId: 10, displayName: "Alice", votedCount: 1, completed: false }],
      },
    };

    const subscribeCall = mockSubscribe.mock.calls[0];
    const messageCallback = subscribeCall[1];
    messageCallback({ body: JSON.stringify(mockEvent) } as IMessage);

    expect(onProgress).toHaveBeenCalledWith(mockEvent);

    // Verify unsubscription
    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("subscribes to /topic/room/{roomCode}/results and parses consensus results", () => {
    service.connect();

    const onResults = vi.fn();
    const unsubscribe = service.subscribeToResults("ABCD", onResults);

    expect(mockSubscribe).toHaveBeenCalledWith(
      "/topic/room/ABCD/results",
      expect.any(Function)
    );

    const mockResults: SessionResultsResponse = {
      sessionId: 1,
      roomCode: "ABCD",
      totalParticipants: 2,
      totalMovies: 5,
      winner: {
        movieSuggestionId: 100,
        tmdbId: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/poster.jpg",
        score: 4,
        yesVotes: 2,
        superlikeVotes: 1,
        noVotes: 0,
        skipVotes: 0,
        matchPercentage: 100,
        isUnanimous: true,
      },
      rankedMovies: [],
    };

    const subscribeCall = mockSubscribe.mock.calls[0];
    const messageCallback = subscribeCall[1];
    messageCallback({ body: JSON.stringify(mockResults) } as IMessage);

    expect(onResults).toHaveBeenCalledWith(mockResults);

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("publishes swipe votes to /app/vote", () => {
    service.connect();

    const payload: VoteMessageDto = {
      roomCode: "ABCD",
      userId: 10,
      movieSuggestionId: 100,
      voteType: "SUPERLIKE",
    };

    service.publishVote(payload);

    expect(mockPublish).toHaveBeenCalledWith({
      destination: "/app/vote",
      body: JSON.stringify(payload),
    });
  });

  it("cleans up active subscriptions on disconnect", () => {
    service.connect();
    service.subscribeToRoom("ABCD", vi.fn());
    service.subscribeToResults("ABCD", vi.fn());

    service.disconnect();

    expect(mockDeactivate).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    expect(service.isConnected()).toBe(false);
  });
});
