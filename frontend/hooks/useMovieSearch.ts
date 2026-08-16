"use client";

import * as React from "react";
import { searchMovies } from "@/lib/api/movie";
import type { MovieDto } from "@/types";

export interface UseMovieSearchOptions {
  debounceMs?: number;
  initialQuery?: string;
}

export interface UseMovieSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  movies: MovieDto[];
  isLoading: boolean;
  isSearchingMore: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalResults: number;
  hasSearched: boolean;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
}

export function useMovieSearch(options: UseMovieSearchOptions = {}): UseMovieSearchReturn {
  const { debounceMs = 300, initialQuery = "" } = options;

  const [query, setQuery] = React.useState<string>(initialQuery);
  const [movies, setMovies] = React.useState<MovieDto[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSearchingMore, setIsSearchingMore] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [totalResults, setTotalResults] = React.useState<number>(0);
  const [hasSearched, setHasSearched] = React.useState<boolean>(false);

  // Keep track of the active request counter to prevent stale race conditions
  const activeRequestIdRef = React.useRef<number>(0);
  // Keep track of the current query string for loadMore
  const currentQueryRef = React.useRef<string>(initialQuery);
  currentQueryRef.current = query;

  const clearSearch = React.useCallback(() => {
    activeRequestIdRef.current += 1;
    setQuery("");
    setMovies([]);
    setIsLoading(false);
    setIsSearchingMore(false);
    setError(null);
    setPage(1);
    setTotalPages(0);
    setTotalResults(0);
    setHasSearched(false);
  }, []);

  React.useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      activeRequestIdRef.current += 1;
      setMovies([]);
      setIsLoading(false);
      setIsSearchingMore(false);
      setError(null);
      setPage(1);
      setTotalPages(0);
      setTotalResults(0);
      setHasSearched(false);
      return;
    }

    const currentReqId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setIsSearchingMore(false);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await searchMovies(trimmed, 1);
        // Only update state if this is still the active request
        if (currentReqId === activeRequestIdRef.current) {
          setMovies(response.movies || []);
          setPage(response.page || 1);
          setTotalPages(response.totalPages || 0);
          setTotalResults(response.totalResults || 0);
          setHasSearched(true);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (currentReqId === activeRequestIdRef.current) {
          const message = err instanceof Error ? err.message : "Failed to search movies.";
          setError(message);
          setIsLoading(false);
          setHasSearched(true);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  const loadMore = React.useCallback(async () => {
    const trimmed = currentQueryRef.current.trim();
    if (!trimmed || isLoading || isSearchingMore || page >= totalPages) {
      return;
    }

    const currentReqId = activeRequestIdRef.current;
    setIsSearchingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await searchMovies(trimmed, nextPage);

      if (currentReqId === activeRequestIdRef.current) {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.tmdbId));
          const newMovies = (response.movies || []).filter((m) => !existingIds.has(m.tmdbId));
          return [...prev, ...newMovies];
        });
        setPage(response.page || nextPage);
        setTotalPages(response.totalPages || totalPages);
        setTotalResults(response.totalResults || totalResults);
      }
    } catch (err: unknown) {
      if (currentReqId === activeRequestIdRef.current) {
        const message = err instanceof Error ? err.message : "Failed to load more movies.";
        setError(message);
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsSearchingMore(false);
      }
    }
  }, [page, totalPages, isLoading, isSearchingMore]);

  return {
    query,
    setQuery,
    movies,
    isLoading,
    isSearchingMore,
    error,
    page,
    totalPages,
    totalResults,
    hasSearched,
    loadMore,
    clearSearch,
  };
}
