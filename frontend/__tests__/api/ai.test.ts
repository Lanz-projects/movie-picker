import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAiRecommendations,
  getStandaloneAiRecommendations,
} from "@/lib/api/ai";
import type { AiRecommendationResponse } from "@/types";

describe("AI Recommendation API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getAiRecommendations sends POST to room recommendations endpoint with payload", async () => {
    const mockResponse: AiRecommendationResponse = {
      prompt: "90s sci fi",
      replyMessage: "Here are great picks:",
      movies: [
        {
          tmdbId: 603,
          title: "The Matrix",
          overview: "Cyberpunk action",
          posterPath: "/matrix.jpg",
          releaseYear: 1999,
          voteAverage: 8.4,
          aiReasoning: "Iconic sci-fi that questions reality.",
        },
      ],
      page: 1,
      pageSize: 5,
      totalResults: 8,
      hasMore: true,
      modelUsed: "gemini-2.5-flash-lite",
      cached: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await getAiRecommendations("vibe12 ", {
      prompt: "90s sci fi",
      page: 1,
      limit: 5,
      excludedTmdbIds: [550],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/VIBE12/ai/recommendations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          prompt: "90s sci fi",
          page: 1,
          limit: 5,
          excludedTmdbIds: [550],
        }),
      })
    );

    expect(result.prompt).toBe("90s sci fi");
    expect(result.movies).toHaveLength(1);
    expect(result.movies[0].title).toBe("The Matrix");
    expect(result.movies[0].aiReasoning).toBe("Iconic sci-fi that questions reality.");
    expect(result.hasMore).toBe(true);
  });

  it("getStandaloneAiRecommendations sends POST to standalone endpoint", async () => {
    const mockResponse: AiRecommendationResponse = {
      prompt: "feel good comedy",
      replyMessage: "Here are some laughs:",
      movies: [],
      page: 1,
      pageSize: 5,
      totalResults: 0,
      hasMore: false,
      cached: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await getStandaloneAiRecommendations({
      prompt: "feel good comedy",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/ai/recommendations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          prompt: "feel good comedy",
        }),
      })
    );

    expect(result.prompt).toBe("feel good comedy");
    expect(result.movies).toEqual([]);
  });

  it("handles HTTP error response properly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({
        status: 429,
        message: "Rate limit exceeded. Please retry after 10 seconds.",
      }),
    } as unknown as Response);

    await expect(
      getAiRecommendations("ROOM12", { prompt: "spam prompt" })
    ).rejects.toThrow("Rate limit exceeded. Please retry after 10 seconds.");
  });
});
