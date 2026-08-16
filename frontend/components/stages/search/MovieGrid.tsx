"use client";

import * as React from "react";
import { Search, Film, AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/Button";
import type { MovieDto } from "@/types";

export interface MovieGridProps {
  movies: MovieDto[];
  deckMovieIds: number[];
  onToggleDeck: (movie: MovieDto) => void;
  onSelectMovie?: (movie: MovieDto) => void;
  isLoading?: boolean;
  isSearchingMore?: boolean;
  hasSearched?: boolean;
  query?: string;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onLoadMore?: () => void;
  isDeckFull?: boolean;
}

export function MovieGrid({
  movies,
  deckMovieIds,
  onToggleDeck,
  onSelectMovie,
  isLoading = false,
  isSearchingMore = false,
  hasSearched = false,
  query = "",
  error = null,
  page = 1,
  totalPages = 0,
  onLoadMore,
  isDeckFull = false,
}: MovieGridProps) {
  // 1. Initial Loading Skeleton Grid (8 cards)
  if (isLoading) {
    return (
      <div
        data-testid="movie-grid-skeleton"
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex flex-col rounded-2xl overflow-hidden border border-border-subtle bg-bg-surface p-3 animate-pulse"
          >
            <div className="aspect-[2/3] w-full rounded-xl bg-bg-elevated mb-3" />
            <div className="h-4 w-3/4 bg-bg-elevated rounded mb-2" />
            <div className="h-3 w-full bg-bg-elevated rounded mb-1" />
            <div className="h-3 w-2/3 bg-bg-elevated rounded mb-4" />
            <div className="h-8 w-full bg-bg-elevated rounded-xl mt-auto" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Error Display Banner
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-brand-coral/30 bg-brand-coral/10 text-center w-full my-4">
        <AlertCircle className="h-10 w-10 text-brand-coral mb-2" />
        <h4 className="font-display font-bold text-base text-text-main mb-1">
          Search Failed
        </h4>
        <p className="text-xs text-text-secondary max-w-md">
          {error}
        </p>
      </div>
    );
  }

  // 3. No Results Found State
  if (hasSearched && movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border-subtle bg-bg-surface/50 text-center w-full my-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated border border-border-subtle text-text-muted mb-4">
          <Search className="h-7 w-7" />
        </div>
        <h4 className="font-display font-bold text-lg text-text-main mb-1">
          No Movies Found
        </h4>
        <p className="text-xs text-text-secondary max-w-sm">
          We couldn&apos;t find any matches for &quot;{query}&quot;. Try searching for another movie title, director, or actor.
        </p>
      </div>
    );
  }

  // 4. Initial Empty Prompt State (Before searching)
  if (!hasSearched && movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border-subtle bg-bg-surface/30 text-center w-full my-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo mb-4">
          <Film className="h-7 w-7" />
        </div>
        <h4 className="font-display font-bold text-lg text-text-main mb-1">
          Search the Movie Catalog
        </h4>
        <p className="text-xs text-text-secondary max-w-sm">
          Type any movie title above to search TMDB and nominate your favorite films for tonight&apos;s watch party.
        </p>
      </div>
    );
  }

  const hasMorePages = page < totalPages;
  const deckIdSet = React.useMemo(() => new Set(deckMovieIds), [deckMovieIds]);

  // 5. Active Movies Grid
  return (
    <div className="flex flex-col w-full gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
        {movies.map((movie) => {
          const isInDeck = deckIdSet.has(movie.tmdbId);
          const disabled = !isInDeck && isDeckFull;

          return (
            <MovieCard
              key={movie.tmdbId}
              movie={movie}
              isInDeck={isInDeck}
              onToggleDeck={onToggleDeck}
              onSelectMovie={onSelectMovie}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Pagination Load More Button */}
      {hasMorePages && onLoadMore ? (
        <div className="flex justify-center my-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onLoadMore}
            disabled={isSearchingMore}
            className="gap-2 px-6"
          >
            {isSearchingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-brand-indigo" />
                <span>Loading more movies...</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Load More Results</span>
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
