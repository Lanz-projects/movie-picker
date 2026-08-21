"use client";

import * as React from "react";
import { StageContainer } from "@/components/layout/StageContainer";
import { MovieGrid } from "./search/MovieGrid";
import { SelectionRack } from "./search/SelectionRack";
import { MovieDetailsModal } from "./search/MovieDetailsModal";
import { SearchFilterToolbar } from "./search/SearchFilterToolbar";
import { ScrollNavFab } from "@/components/ui/ScrollNavFab";
import { useSession } from "@/context/SessionContext";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { AlertCircle, X, Sparkles } from "lucide-react";
import type { MovieDto, MovieSubmissionDto } from "@/types";

export interface SearchScreenProps {
  debounceMs?: number;
}

export function SearchScreen({ debounceMs = 350 }: SearchScreenProps = {}) {
  const {
    session,
    isHost,
    myDeckSelection,
    hasSubmittedDeck,
    submissionProgress,
    addToDeck,
    removeFromDeck,
    submitMyDeck,
    startVotingDeck,
    isLoading: isSessionLoading,
    error: sessionError,
    clearError,
  } = useSession();

  const maxSuggestions = session?.maxSuggestionsPerUser || 5;

  const {
    query,
    setQuery,
    activeGenre,
    setActiveGenre,
    filters,
    setFilters,
    activeFilterCount,
    clearSearch,
    clearFilters,
    movies,
    isLoading: isSearching,
    isSearchingMore,
    error: searchError,
    page,
    totalPages,
    totalResults,
    hasSearched,
    mode,
    sectionTitle,
    loadMore,
    clearError: clearSearchError,
  } = useMovieSearch({ debounceMs });

  const [selectedMovieForModal, setSelectedMovieForModal] = React.useState<MovieDto | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isStartingVoting, setIsStartingVoting] = React.useState<boolean>(false);

  const selectedMovieIdSet = React.useMemo(
    () => new Set(myDeckSelection.map((m) => m.tmdbId)),
    [myDeckSelection]
  );

  const selectedMovieIds = React.useMemo(
    () => Array.from(selectedMovieIdSet),
    [selectedMovieIdSet]
  );

  const isDeckFull = myDeckSelection.length >= maxSuggestions;

  const handleToggleDeck = React.useCallback(
    (movie: MovieDto) => {
      const isAlreadyInDeck = selectedMovieIdSet.has(movie.tmdbId);
      if (isAlreadyInDeck) {
        removeFromDeck(movie.tmdbId);
      } else {
        addToDeck(movie);
      }
    },
    [selectedMovieIdSet, removeFromDeck, addToDeck]
  );

  const handleSelectMovie = React.useCallback((movie: MovieDto | MovieSubmissionDto) => {
    const movieDto: MovieDto = {
      tmdbId: movie.tmdbId,
      title: movie.title,
      overview: movie.overview || "",
      posterPath: movie.posterPath || null,
      backdropPath: movie.backdropPath || null,
      releaseYear: movie.releaseYear || null,
      releaseDate: "releaseDate" in movie ? movie.releaseDate : null,
      voteAverage: "voteAverage" in movie && typeof (movie as MovieDto).voteAverage === "number"
        ? (movie as MovieDto).voteAverage
        : 0,
      voteCount: "voteCount" in movie ? movie.voteCount : undefined,
      genres: movie.genres || [],
      originalLanguage: movie.originalLanguage,
    };
    setSelectedMovieForModal(movieDto);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieForModal(null);
  }, []);

  const handleDismissError = React.useCallback(() => {
    clearError();
    clearSearchError();
  }, [clearError, clearSearchError]);

  const handleSubmitDeck = React.useCallback(async () => {
    if (myDeckSelection.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitMyDeck();
    } catch {
      // Error handled via session context
    } finally {
      setIsSubmitting(false);
    }
  }, [myDeckSelection.length, isSubmitting, submitMyDeck]);

  const handleStartVoting = React.useCallback(async () => {
    if (!isHost || isStartingVoting) return;

    setIsStartingVoting(true);
    try {
      await startVotingDeck();
    } catch {
      // Error handled via session context
    } finally {
      setIsStartingVoting(false);
    }
  }, [isHost, isStartingVoting, startVotingDeck]);

  const isModalMovieInDeck = selectedMovieForModal
    ? selectedMovieIds.includes(selectedMovieForModal.tmdbId)
    : false;

  const effectiveError = sessionError || searchError;
  const totalRoomUsers = session?.users?.length || 1;

  return (
    <StageContainer
      maxWidth="xl"
      className="pb-56 sm:pb-64"
    >
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Stage Header */}
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo text-xs font-bold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Stage 3: Nominations
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-text-main">
            Nominate Your Movie Picks
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-text-secondary">
            Pick up to <span className="font-semibold text-text-main">{maxSuggestions}</span> titles from trending, genre categories, or search. Click any card to inspect full details!
          </p>
        </div>

        {/* Search Bar Input, Category Filters, & Dynamic Heading Toolbar */}
        <SearchFilterToolbar
          query={query}
          onQueryChange={setQuery}
          onClearQuery={clearSearch}
          isLoading={isSearching}
          activeGenre={activeGenre}
          onSelectGenre={setActiveGenre}
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          mode={mode}
          sectionTitle={sectionTitle}
          totalResults={totalResults}
          currentResultsCount={movies.length}
        />

        {/* Global Error Banner */}
        {effectiveError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 w-full max-w-3xl p-3.5 rounded-2xl border border-brand-coral/30 bg-brand-coral/10 text-text-main shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-brand-coral flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-brand-coral">
                {effectiveError}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissError}
              aria-label="Dismiss error"
              className="p-1 rounded-lg text-brand-coral hover:bg-brand-coral/20 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Movie Results Grid */}
        <MovieGrid
          movies={movies}
          deckMovieIds={selectedMovieIds}
          onToggleDeck={handleToggleDeck}
          onSelectMovie={handleSelectMovie}
          isLoading={isSearching && movies.length === 0}
          isSearchingMore={isSearchingMore}
          hasSearched={hasSearched}
          query={query}
          error={searchError}
          page={page}
          totalPages={totalPages}
          onLoadMore={loadMore}
          isDeckFull={isDeckFull}
        />

        {/* Extra Bottom Spacer for Scroll Clearance */}
        <div className="h-20 sm:h-24 w-full pointer-events-none" aria-hidden="true" />
      </div>

      {/* Floating Collapsible Bottom Selection Rack */}
      <div className="fixed inset-x-0 bottom-3 sm:bottom-4 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-4xl pointer-events-auto">
          <SelectionRack
            selectedMovies={myDeckSelection}
            maxSuggestions={maxSuggestions}
            onRemoveMovie={removeFromDeck}
            onSubmitDeck={handleSubmitDeck}
            onSelectMovie={handleSelectMovie}
            isSubmitting={isSubmitting || isSessionLoading}
            hasSubmitted={hasSubmittedDeck}
            isHost={isHost}
            onStartVoting={handleStartVoting}
            isStartingVoting={isStartingVoting}
            readyCount={submissionProgress?.submittedCount}
            totalUsersCount={submissionProgress?.totalCount || totalRoomUsers}
          />
        </div>
      </div>

      {/* Movie Details Modal */}
      <MovieDetailsModal
        movie={selectedMovieForModal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isInDeck={isModalMovieInDeck}
        onToggleDeck={handleToggleDeck}
        disabled={!isModalMovieInDeck && isDeckFull}
      />

      {/* Floating Smart Scroll Navigation FAB */}
      <ScrollNavFab />
    </StageContainer>
  );
}
