"use client";

import * as React from "react";
import { searchMovies, getTrendingMovies, discoverMovies } from "@/lib/api/movie";
import { type FilterState, DEFAULT_FILTER_STATE, countActiveFilters } from "@/components/stages/search/SearchFilterModal";
import type { MovieDto } from "@/types";

export interface UseMovieSearchOptions {
  debounceMs?: number;
  initialQuery?: string;
  initialGenre?: string | null;
  initialFilters?: FilterState;
}

export type SearchMode = "TRENDING" | "DISCOVER" | "SEARCH";

export interface UseMovieSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  activeGenre: string | null;
  setActiveGenre: (genre: string | null) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  activeFilterCount: number;
  movies: MovieDto[];
  isLoading: boolean;
  isSearchingMore: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalResults: number;
  hasSearched: boolean;
  mode: SearchMode;
  sectionTitle: string;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
  clearFilters: () => void;
  clearError: () => void;
}

export function useMovieSearch(options: UseMovieSearchOptions = {}): UseMovieSearchReturn {
  const {
    debounceMs = 300,
    initialQuery = "",
    initialGenre = null,
    initialFilters = DEFAULT_FILTER_STATE,
  } = options;

  const [query, setQuery] = React.useState<string>(initialQuery);
  const [activeGenre, setActiveGenre] = React.useState<string | null>(initialGenre);
  const [filters, setFilters] = React.useState<FilterState>(initialFilters);

  const [movies, setMovies] = React.useState<MovieDto[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSearchingMore, setIsSearchingMore] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [totalResults, setTotalResults] = React.useState<number>(0);
  const [hasSearched, setHasSearched] = React.useState<boolean>(false);

  const activeFilterCount = React.useMemo(() => countActiveFilters(filters), [filters]);

  // Keep track of the active request counter to prevent stale race conditions
  const activeRequestIdRef = React.useRef<number>(0);

  const mode: SearchMode = React.useMemo(() => {
    if (query.trim()) return "SEARCH";
    if (activeGenre || activeFilterCount > 0) return "DISCOVER";
    return "TRENDING";
  }, [query, activeGenre, activeFilterCount]);

  const sectionTitle: string = React.useMemo(() => {
    if (query.trim()) return `Search Results for "${query.trim()}"`;
    if (activeGenre || activeFilterCount > 0) {
      const parts: string[] = [];
      if (filters.decade) {
        if (filters.decade === "vintage") parts.push("Vintage");
        else parts.push(`${filters.decade}`);
      }
      if (filters.minRating && filters.minRating >= 8.0) {
        parts.push("Acclaimed");
      } else if (filters.minRating && filters.minRating >= 7.0) {
        parts.push("Top Rated");
      }
      if (activeGenre) {
        parts.push(activeGenre);
      }
      const subject = parts.length > 0 ? parts.join(" ") : "Popular";
      let title = `${subject} Movies`;
      if (filters.provider) {
        title += ` on ${filters.provider}`;
      }
      return title;
    }
    return "🔥 Trending This Week";
  }, [query, activeGenre, activeFilterCount, filters]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const clearSearch = React.useCallback(() => {
    setQuery("");
  }, []);

  const clearFilters = React.useCallback(() => {
    setQuery("");
    setActiveGenre(null);
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  // Main data fetching effect for Search, Discover, or Trending
  React.useEffect(() => {
    const trimmed = query.trim();
    const currentReqId = ++activeRequestIdRef.current;

    // If typing text query, debounce by debounceMs
    const delay = trimmed ? debounceMs : 0;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setIsSearchingMore(false);
      setError(null);
      try {
        let response;
        if (trimmed) {
          response = await searchMovies(trimmed, 1);
        } else if (activeGenre || activeFilterCount > 0) {
          response = await discoverMovies({
            genre: activeGenre || undefined,
            provider: filters.provider || undefined,
            decade: filters.decade || undefined,
            minRating: filters.minRating || undefined,
            minRuntime: filters.minRuntime || undefined,
            maxRuntime: filters.maxRuntime || undefined,
            language: filters.language || undefined,
            sortBy: filters.sortBy || undefined,
            page: 1,
          });
        } else {
          response = await getTrendingMovies(1);
        }

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
          const message = err instanceof Error ? err.message : "Failed to load movies.";
          setError(message);
          setIsLoading(false);
          setHasSearched(true);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [query, activeGenre, filters, activeFilterCount, debounceMs]);

  const loadMore = React.useCallback(async () => {
    if (isLoading || isSearchingMore || page >= totalPages) {
      return;
    }

    const currentReqId = activeRequestIdRef.current;
    setIsSearchingMore(true);
    setError(null);

    const trimmed = query.trim();
    const isDiscover = Boolean(activeGenre || activeFilterCount > 0);
    const nextPage = page + 1;

    try {
      let response;
      if (trimmed) {
        response = await searchMovies(trimmed, nextPage);
      } else if (isDiscover) {
        response = await discoverMovies({
          genre: activeGenre || undefined,
          provider: filters.provider || undefined,
          decade: filters.decade || undefined,
          minRating: filters.minRating || undefined,
          minRuntime: filters.minRuntime || undefined,
          maxRuntime: filters.maxRuntime || undefined,
          language: filters.language || undefined,
          sortBy: filters.sortBy || undefined,
          page: nextPage,
        });
      } else {
        response = await getTrendingMovies(nextPage);
      }

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
  }, [
    query,
    activeGenre,
    filters,
    activeFilterCount,
    page,
    totalPages,
    totalResults,
    isLoading,
    isSearchingMore,
  ]);

  return {
    query,
    setQuery,
    activeGenre,
    setActiveGenre,
    filters,
    setFilters,
    activeFilterCount,
    movies,
    isLoading,
    isSearchingMore,
    error,
    page,
    totalPages,
    totalResults,
    hasSearched,
    mode,
    sectionTitle,
    loadMore,
    clearSearch,
    clearFilters,
    clearError,
  };
}
