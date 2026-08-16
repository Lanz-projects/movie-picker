import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import * as movieApi from "@/lib/api/movie";
import type { MovieSearchResponse } from "@/types";

vi.mock("@/lib/api/movie", () => ({
  searchMovies: vi.fn(),
}));

describe("useMovieSearch", () => {
  const mockSearchMovies = vi.mocked(movieApi.searchMovies);

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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with default empty state", () => {
    const { result } = renderHook(() => useMovieSearch());

    expect(result.current.query).toBe("");
    expect(result.current.movies).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSearchingMore).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalResults).toBe(0);
    expect(result.current.hasSearched).toBe(false);
  });

  it("debounces search request and updates movies on success", async () => {
    mockSearchMovies.mockResolvedValueOnce(mockResponsePage1);

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("Nolan");
    });

    expect(result.current.query).toBe("Nolan");
    expect(result.current.isLoading).toBe(true);
    expect(mockSearchMovies).not.toHaveBeenCalled();

    // Fast-forward debounce timer
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSearchMovies).toHaveBeenCalledTimes(1);
    expect(mockSearchMovies).toHaveBeenCalledWith("Nolan", 1);

    expect(result.current.movies).toEqual(mockResponsePage1.movies);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalResults).toBe(30);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not trigger search when query is only whitespace", async () => {
    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("    ");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSearchMovies).not.toHaveBeenCalled();
    expect(result.current.movies).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasSearched).toBe(false);
  });

  it("loads more movies when loadMore is called", async () => {
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

  it("does not loadMore when page reaches totalPages", async () => {
    const singlePageResponse: MovieSearchResponse = {
      page: 1,
      totalPages: 1,
      totalResults: 2,
      movies: mockResponsePage1.movies,
    };

    mockSearchMovies.mockResolvedValueOnce(singlePageResponse);

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("Inception");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);

    await act(async () => {
      await result.current.loadMore();
    });

    // Should not have fetched page 2
    expect(mockSearchMovies).toHaveBeenCalledTimes(1);
  });

  it("handles search errors gracefully", async () => {
    mockSearchMovies.mockRejectedValueOnce(new Error("TMDB service unavailable"));

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("Error Movie");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.movies).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.error).toBe("TMDB service unavailable");
  });

  it("handles race conditions when rapid typing occurs", async () => {
    let resolveFirst: (value: MovieSearchResponse) => void;
    const firstPromise = new Promise<MovieSearchResponse>((resolve) => {
      resolveFirst = resolve;
    });

    mockSearchMovies.mockImplementationOnce(() => firstPromise);
    mockSearchMovies.mockResolvedValueOnce(mockResponsePage1);

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 100 }));

    // User types "In"
    act(() => {
      result.current.setQuery("In");
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockSearchMovies).toHaveBeenCalledWith("In", 1);

    // User quickly types "Inception" before "In" resolves
    act(() => {
      result.current.setQuery("Inception");
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockSearchMovies).toHaveBeenCalledWith("Inception", 1);

    // Now resolve the older "In" query late
    await act(async () => {
      resolveFirst!({
        page: 1,
        totalPages: 10,
        totalResults: 100,
        movies: [{ tmdbId: 999, title: "Old Stale Movie", overview: "", posterPath: null, releaseYear: 2000, voteAverage: 5 }],
      });
    });

    // Stale result should NOT overwrite "Inception"
    expect(result.current.movies).toEqual(mockResponsePage1.movies);
    expect(result.current.movies.some((m) => m.title === "Old Stale Movie")).toBe(false);
  });

  it("resets state when clearSearch is called", async () => {
    mockSearchMovies.mockResolvedValueOnce(mockResponsePage1);

    const { result } = renderHook(() => useMovieSearch({ debounceMs: 300 }));

    act(() => {
      result.current.setQuery("Nolan");
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.movies).toHaveLength(2);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe("");
    expect(result.current.movies).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalResults).toBe(0);
    expect(result.current.hasSearched).toBe(false);
  });
});
