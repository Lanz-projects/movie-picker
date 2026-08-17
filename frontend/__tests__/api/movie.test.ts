import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchMovies,
  submitMovies,
  getSessionMovies,
  startVoting,
  getMovieDetails,
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
      movies: [
        {
          tmdbId: 27205,
          title: "Inception",
          overview: "A thief who steals corporate secrets...",
          posterPath: "/inception.jpg",
          releaseYear: 2010,
          voteAverage: 8.4,
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
    expect(result.movies[0].title).toBe("Inception");
  });

  it("submitMovies sends POST with movies payload", async () => {
    const mockResponse: MovieSuggestionResponse[] = [
      {
        id: 100,
        tmdbId: 27205,
        title: "Inception",
        overview: "Overview",
        posterPath: "/poster.jpg",
        releaseYear: 2010,
        userId: 10,
        userDisplayName: "Alice",
        suggestedAt: "2026-08-14T00:00:00",
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
          releaseYear: 2010,
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/sessions/1/movies",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toHaveLength(1);
    expect(result[0].userDisplayName).toBe("Alice");
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

  it("getMovieDetails sends GET to /api/movies/{tmdbId}", async () => {
    const mockDetails = {
      tmdbId: 27205,
      title: "Inception",
      overview: "A thief...",
      posterPath: "/poster.jpg",
      directors: ["Christopher Nolan"],
      topCast: ["Leonardo DiCaprio"],
      genres: ["Action", "Sci-Fi"],
      runtime: 148,
      formattedRuntime: "2h 28m",
      contentRating: "PG-13",
      voteAverage: 8.4,
      streamingProviders: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetails,
    } as unknown as Response);

    const result = await getMovieDetails(27205);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/movies/27205",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.title).toBe("Inception");
    expect(result.directors).toContain("Christopher Nolan");
  });
});
