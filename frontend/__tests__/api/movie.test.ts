import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchMovies,
  submitMovies,
  getSessionMovies,
  startVoting,
} from "@/lib/api/movie";
import type {
  MovieSearchResponse,
  MovieSuggestionResponse,
  SessionResponse,
} from "@/types";

describe("Movie API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searchMovies properly encodes query string and page parameter", async () => {
    const mockResponse: MovieSearchResponse = {
      results: [
        {
          id: 27205,
          title: "Inception",
          overview: "A thief who steals corporate secrets...",
          posterPath: "/inception.jpg",
          releaseDate: "2010-07-15",
          voteAverage: 8.4,
          voteCount: 35000,
        },
      ],
      page: 1,
      totalPages: 5,
      totalResults: 100,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await searchMovies("Inception & Interstellar", 2);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/movies/search?query=Inception%20%26%20Interstellar&page=2",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.results[0].title).toBe("Inception");
  });

  it("submitMovies sends POST with movies payload", async () => {
    const mockResponse: MovieSuggestionResponse[] = [
      {
        id: 100,
        tmdbId: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/poster.jpg",
        releaseDate: "2010-07-15",
        voteAverage: 8.4,
        voteCount: 35000,
        suggestedByUserId: 10,
        suggestedByUserDisplayName: "Alice",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await submitMovies(1, {
      userId: 10,
      movies: [
        {
          tmdbId: 27205,
          title: "Inception",
          overview: "Overview",
          posterPath: "/poster.jpg",
          releaseDate: "2010-07-15",
          voteAverage: 8.4,
          voteCount: 35000,
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/movies",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toHaveLength(1);
  });

  it("getSessionMovies sends GET and returns suggestions", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);

    const result = await getSessionMovies(1);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/movies",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual([]);
  });

  it("startVoting sends POST to lock deck and transition to voting", async () => {
    const mockResponse: SessionResponse = {
      id: 1,
      roomCode: "ABCD",
      hostName: "Alice",
      status: "VOTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [],
      createdAt: "2026-08-14T00:00:00",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await startVoting(1);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/start",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.status).toBe("VOTING");
  });
});
