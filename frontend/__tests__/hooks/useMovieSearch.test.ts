import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import * as movieApi from "@/lib/api/movie";
import type { MovieSearchResponse } from "@/types";

vi.mock("@/lib/api/movie", () => ({
  searchMovies: vi.fn(),
  getTrendingMovies: vi.fn(),
  discoverMovies: vi.fn(),
}));

describe("useMovieSearch", () => {
  const mockSearchMovies = vi.mocked(movieApi.searchMovies);
  const mockGetTrendingMovies = vi.mocked(movieApi.getTrendingMovies);
  const mockDiscoverMovies = vi.mocked(movieApi.discoverMovies);

  const mockTrendingResponse: MovieSearchResponse = {
    page: 1,
    totalPages: 2,
    totalResults: 20,
    movies: [
      {
        tmdbId: 1,
        title: "Trending Movie 1",
        overview: "A viral hit.",
        posterPath: "/trend1.jpg",
        releaseYear: 2026,
        voteAverage: 8.5,
      },
    ],
  };

  const mockResponsePage1: MovieSearchResponse = {
    page: 1,
    totalPages: 3,
    totalResults: 30,
    movies: [
      {
        tmdbId: 101,
        title: "Inception",
        overview: "A thief who steals corporate secrets through dream-sharing technology.",
        posterPath: "/inception.jpg",
        releaseYear: 2010,
        voteAverage: 8.4,
      },
      {
        tmdbId: 102,
        title: "Interstellar",
        overview: "A team of explorers travel through a wormhole in space.",
        posterPath: "/interstellar.jpg",
        releaseYear: 2014,
        voteAverage: 8.6,
      },
    ],
  };

  const mockResponsePage2: MovieSearchResponse = {
    page: 2,
    totalPages: 3,
    totalResults: 30,
    movies: [
      {
        tmdbId: 103,
        title: "The Dark Knight",
        overview: "Batman raises the stakes in his war on crime.",
        posterPath: "/darkknight.jpg",
        releaseYear: 2008,
        voteAverage: 9.0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockGetTrendingMovies.mockResolvedValue(mockTrendingResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches trending movies by default on mount when query is empty", async () => {
    const { result } = renderHook(() => useMovieSearch());

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(mockGetTrendingMovies).toHaveBeenCalledWith(1);
    expect(result.current.mode).toBe("TRENDING");
    expect(result.current.sectionTitle).toBe("🔥 Trending This Week");
    expect(result.current.movies).toEqual(mockTrendingResponse.movies);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches discover movies when activeGenre is selected", async () => {
    const mockHorrorResponse: MovieSearchResponse = {
      page: 1,
      totalPages: 1,
      totalResults: 5,
      movies: [
        {
          tmdbId: 666,
          title: "The Conjuring",
          overview: "Haunted house.",
          posterPath: "/conjuring.jpg",
          releaseYear: 2013,
          voteAverage: 7.5,
        },
      ],
    };
    mockDiscoverMovies.mockResolvedValueOnce(mockHorrorResponse);

    const { result } = renderHook(() => useMovieSearch());

    act(() => {
      result.current.setActiveGenre("Horror");
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(mockDiscoverMovies).toHaveBeenCalledWith({
      genre: "Horror",
      provider: undefined,
      page: 1,
    });
    expect(result.current.mode).toBe("DISCOVER");
    expect(result.current.sectionTitle).toBe("Horror Movies");
    expect(result.current.movies).toEqual(mockHorrorResponse.movies);
  });

  it("fetches discover movies when both genre and provider are set", async () => {
    const mockNetflixAction: MovieSearchResponse = {
      page: 1,
      totalPages: 1,
      totalResults: 8,
      movies: [
        {
          tmdbId: 777,
          title: "Extraction",
          overview: "Mercenary mission.",
          posterPath: "/extraction.jpg",
          releaseYear: 2020,
          voteAverage: 7.2,
        },
      ],
    };
    mockDiscoverMovies.mockResolvedValueOnce(mockNetflixAction);

    const { result } = renderHook(() => useMovieSearch());

    act(() => {
      result.current.setActiveGenre("Action");
      result.current.setActiveProvider("Netflix");
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(mockDiscoverMovies).toHaveBeenCalledWith({
      genre: "Action",
      provider: "Netflix",
      page: 1,
    });
    expect(result.current.sectionTitle).toBe("Action Movies on Netflix");
    expect(result.current.movies).toEqual(mockNetflixAction.movies);
  });

  it("debounces search request and updates movies on success", async () => {
    mockSearchMovies.mockResolvedValueOnce(mockResponsePage1);

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("Nolan");
    });

    expect(result.current.query).toBe("Nolan");
    expect(result.current.isLoading).toBe(true);

    // Fast-forward debounce timer
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSearchMovies).toHaveBeenCalledTimes(1);
    expect(mockSearchMovies).toHaveBeenCalledWith("Nolan", 1);
    expect(result.current.mode).toBe("SEARCH");
    expect(result.current.sectionTitle).toBe('Search Results for "Nolan"');
    expect(result.current.movies).toEqual(mockResponsePage1.movies);
    expect(result.current.isLoading).toBe(false);
  });

  it("loads more movies when loadMore is called in search mode", async () => {
    mockSearchMovies.mockResolvedValueOnce(mockResponsePage1);
    mockSearchMovies.mockResolvedValueOnce(mockResponsePage2);

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("Nolan");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.movies).toHaveLength(2);
    expect(result.current.page).toBe(1);

    // Trigger loadMore for page 2
    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockSearchMovies).toHaveBeenCalledTimes(2);
    expect(mockSearchMovies).toHaveBeenLastCalledWith("Nolan", 2);
    expect(result.current.movies).toHaveLength(3);
    expect(result.current.movies[2].title).toBe("The Dark Knight");
    expect(result.current.page).toBe(2);
    expect(result.current.isSearchingMore).toBe(false);
  });

  it("resets state and restores trending when clearFilters is called", async () => {
    const { result } = renderHook(() => useMovieSearch());

    act(() => {
      result.current.setActiveGenre("Comedy");
      result.current.setActiveProvider("Disney+");
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.mode).toBe("DISCOVER");

    act(() => {
      result.current.clearFilters();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.query).toBe("");
    expect(result.current.activeGenre).toBeNull();
    expect(result.current.activeProvider).toBeNull();
    expect(result.current.mode).toBe("TRENDING");
    expect(result.current.sectionTitle).toBe("🔥 Trending This Week");
  });
});
