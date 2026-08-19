"use client";

import * as React from "react";
import { SearchBar } from "./SearchBar";
import { GenreFilterChips } from "./GenreFilterChips";
import { SearchFilterModal, type FilterState } from "./SearchFilterModal";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { SearchMode } from "@/hooks/useMovieSearch";

export interface SearchFilterToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  isLoading: boolean;
  activeGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activeFilterCount: number;
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
  filters,
  onFiltersChange,
  activeFilterCount,
  onClearFilters,
  mode,
  sectionTitle,
  totalResults,
  currentResultsCount,
}: SearchFilterToolbarProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState<boolean>(false);
  const isFiltered = mode !== "TRENDING";

  const handleRemoveProvider = () => {
    onFiltersChange({ ...filters, provider: null });
  };

  const handleRemoveDecade = () => {
    onFiltersChange({ ...filters, decade: null });
  };

  const handleRemoveRating = () => {
    onFiltersChange({ ...filters, minRating: null });
  };

  const handleRemoveRuntime = () => {
    onFiltersChange({ ...filters, minRuntime: null, maxRuntime: null });
  };

  const handleRemoveLanguage = () => {
    onFiltersChange({ ...filters, language: null });
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3.5">
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
      <div className="flex flex-col gap-2.5 rounded-2xl bg-bg-surface/40 p-2.5 border border-border-subtle backdrop-blur-sm shadow-sm">
        {/* Genre Category Chips */}
        <GenreFilterChips
          selectedGenre={activeGenre}
          onSelectGenre={(genre) => {
            if (query.trim()) onQueryChange("");
            onSelectGenre(genre);
          }}
        />

        {/* Filter Controls & Active Badges Row */}
        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 border-t border-border-subtle/50">
          {/* Sleek Filter Options Button */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Open filter options"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeFilterCount > 0
                ? "bg-gradient-to-r from-brand-violet/20 to-brand-cyan/20 border border-brand-cyan/60 text-brand-cyan shadow-sm"
                : "bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-secondary"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand-cyan" />
            <span>Filter Options</span>
            {activeFilterCount > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-cyan px-1 text-[10px] font-bold text-black">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {/* Quick Active Filter Badges */}
          {filters.provider ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 animate-in fade-in">
              <span>📺 {filters.provider}</span>
              <button
                type="button"
                onClick={handleRemoveProvider}
                aria-label={`Remove ${filters.provider} filter`}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}

          {filters.decade ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-violet/15 text-brand-violet border border-brand-violet/30 animate-in fade-in">
              <span>📅 {filters.decade === "vintage" ? "Vintage" : filters.decade}</span>
              <button
                type="button"
                onClick={handleRemoveDecade}
                aria-label={`Remove ${filters.decade} filter`}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}

          {filters.minRating ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-amber/15 text-brand-amber border border-brand-amber/30 animate-in fade-in">
              <span>⭐ {filters.minRating}+</span>
              <button
                type="button"
                onClick={handleRemoveRating}
                aria-label="Remove rating filter"
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}

          {filters.minRuntime !== null || filters.maxRuntime !== null ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-coral/15 text-brand-coral border border-brand-coral/30 animate-in fade-in">
              <span>
                ⏱️ {filters.maxRuntime && !filters.minRuntime ? "<90m" : filters.minRuntime && filters.maxRuntime ? "90-120m" : ">120m"}
              </span>
              <button
                type="button"
                onClick={handleRemoveRuntime}
                aria-label="Remove runtime filter"
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}

          {filters.language ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/30 animate-in fade-in">
              <span>🌐 {filters.language.toUpperCase()}</span>
              <button
                type="button"
                onClick={handleRemoveLanguage}
                aria-label="Remove language filter"
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}
        </div>
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

      {/* Filter Options Modal */}
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          if (query.trim()) onQueryChange("");
          onFiltersChange(newFilters);
        }}
      />
    </div>
  );
}
