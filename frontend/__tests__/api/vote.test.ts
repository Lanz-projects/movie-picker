import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  castVote,
  getVotingProgressByRoomCode,
  getResultsByRoomCode,
} from "@/lib/api/vote";
import type {
  VoteResponse,
  VotingProgressResponse,
  SessionResultsResponse,
} from "@/types";

describe("Vote & Consensus API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("castVote sends POST with vote type", async () => {
    const mockResponse: VoteResponse = {
      id: 50,
      sessionId: 1,
      userId: 10,
      userDisplayName: "Alice",
      movieSuggestionId: 100,
      tmdbId: 27205,
      movieTitle: "Inception",
      voteType: "LIKE",
      votedAt: "2026-08-14T00:05:00",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await castVote(1, {
      userId: 10,
      movieSuggestionId: 100,
      voteType: "LIKE",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/votes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: 10,
          movieSuggestionId: 100,
          voteType: "LIKE",
        }),
      })
    );
    expect(result.voteType).toBe("LIKE");
  });

  it("getVotingProgressByRoomCode fetches progress by room code", async () => {
    const mockResponse: VotingProgressResponse = {
      sessionId: 1,
      roomCode: "ABCD",
      totalMovies: 5,
      totalUsers: 2,
      completedUserCount: 1,
      allUsersCompleted: false,
      users: [
        { userId: 10, displayName: "Alice", votedCount: 5, completed: true },
        { userId: 11, displayName: "Bob", votedCount: 3, completed: false },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await getVotingProgressByRoomCode("ABCD");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/room/ABCD/votes/progress",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.allUsersCompleted).toBe(false);
    expect(result.users[0].completed).toBe(true);
  });

  it("getResultsByRoomCode fetches calculated consensus results", async () => {
    const mockResponse: SessionResultsResponse = {
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
        releaseYear: 2010,
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await getResultsByRoomCode("ABCD");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/room/ABCD/results",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.winner?.isUnanimous).toBe(true);
    expect(result.winner?.title).toBe("Inception");
  });
});
