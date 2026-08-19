"use client";

import * as React from "react";
import { SearchBar } from "./SearchBar";
import { GenreFilterChips } from "./GenreFilterChips";
import { StreamingFilterBar } from "./StreamingFilterBar";
import { RotateCcw } from "lucide-react";
import type { SearchMode } from "@/hooks/useMovieSearch";

export interface SearchFilterToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  isLoading: boolean;
  activeGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  activeProvider: string | null;
  onSelectProvider: (provider: string | null) => void;
  onClearFilters: () => void;
  mode: SearchMode;
  sectionTitle: string;
  totalResults: number;
  currentResultsCount: number;
}

export function SearchFilterToolbar({
  query,
  onQueryChange,
  onClearQuery,
  isLoading,
  activeGenre,
  onSelectGenre,
  activeProvider,
  onSelectProvider,
  onClearFilters,
  mode,
  sectionTitle,
  totalResults,
  currentResultsCount,
}: SearchFilterToolbarProps) {
  const isFiltered = mode !== "TRENDING";

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
      {/* Search Input */}
      <SearchBar
        value={query}
        onChange={onQueryChange}
        onClear={onClearQuery}
        isLoading={isLoading && Boolean(query.trim())}
        placeholder="Search TMDB by movie title, director, or actor..."
        autoFocus
      />

      {/* Discovery Filters Container */}
      <div className="flex flex-col gap-2 rounded-2xl bg-bg-surface/40 p-2.5 border border-border-subtle backdrop-blur-sm shadow-sm">
        {/* Genre Category Chips */}
        <GenreFilterChips
          selectedGenre={activeGenre}
          onSelectGenre={(genre) => {
            if (query.trim()) onQueryChange("");
            onSelectGenre(genre);
          }}
        />

        {/* Streaming Platform Filter Bar */}
        <StreamingFilterBar
          selectedProvider={activeProvider}
          onSelectProvider={(provider) => {
            if (query.trim()) onQueryChange("");
            onSelectProvider(provider);
          }}
        />
      </div>

      {/* Section Heading with Dynamic Title & Reset Action */}
      <div className="w-full flex items-center justify-between border-b border-border-subtle pb-2 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm sm:text-base font-bold text-text-main">
            {sectionTitle}
          </h2>
          {totalResults > 0 ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-surface border border-border-subtle text-text-muted">
              {currentResultsCount} of {totalResults}
            </span>
          ) : null}
        </div>

        {isFiltered ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 text-xs text-brand-cyan hover:text-brand-cyan/80 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Back to Trending</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
