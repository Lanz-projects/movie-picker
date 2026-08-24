"use client";

import * as React from "react";
import type { MovieDto, MovieSubmissionDto } from "@/types";

export function useDeckSelection(maxSuggestions = 5) {
  const [myDeckSelection, setMyDeckSelection] = React.useState<MovieSubmissionDto[]>([]);
  const [deckError, setDeckError] = React.useState<string | null>(null);

  const addToDeck = React.useCallback(
    (movie: MovieDto) => {
      setDeckError(null);
      setMyDeckSelection((prev) => {
        if (prev.some((m) => m.tmdbId === movie.tmdbId)) {
          return prev;
        }
        if (prev.length >= maxSuggestions) {
          setDeckError(`You can only submit up to ${maxSuggestions} movies.`);
          return prev;
        }
        return [
          ...prev,
          {
            tmdbId: movie.tmdbId,
            title: movie.title,
            overview: movie.overview,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
          },
        ];
      });
    },
    [maxSuggestions]
  );

  const removeFromDeck = React.useCallback((tmdbId: number) => {
    setDeckError(null);
    setMyDeckSelection((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
  }, []);

  const clearDeck = React.useCallback(() => {
    setDeckError(null);
    setMyDeckSelection([]);
  }, []);

  return {
    myDeckSelection,
    deckError,
    addToDeck,
    removeFromDeck,
    clearDeck,
  };
}
