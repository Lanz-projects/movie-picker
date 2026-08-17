import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getResults,
  getResultsByRoomCode,
  calculateResults,
  calculateResultsByRoomCode,
} from "@/lib/api/consensus";
import type { SessionResultsResponse } from "@/types";

describe("Consensus API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockResults: SessionResultsResponse = {
    sessionId: 1,
    roomCode: "WINR",
    totalParticipants: 2,
    totalMovies: 3,
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
    rankedMovies: [],
  };

  it("getResults calls GET /api/sessions/{id}/results", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as unknown as Response);

    const result = await getResults(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/results",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.winner?.title).toBe("Fight Club");
    expect(result.winner?.suggestedBy).toBe("Alice");
  });

  it("getResultsByRoomCode calls GET /api/sessions/room/{code}/results", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as unknown as Response);

    const result = await getResultsByRoomCode("WINR");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/room/WINR/results",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.roomCode).toBe("WINR");
  });

  it("calculateResults calls POST /api/sessions/{id}/calculate", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as unknown as Response);

    const result = await calculateResults(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/calculate",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.winner?.isUnanimous).toBe(true);
  });

  it("calculateResultsByRoomCode calls POST /api/sessions/room/{code}/calculate", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as unknown as Response);

    const result = await calculateResultsByRoomCode("WINR");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/room/WINR/calculate",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.winner?.positiveVoters).toContain("Alice");
  });
});
