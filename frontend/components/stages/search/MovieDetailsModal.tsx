"use client";

import * as React from "react";
import { X, Star, Plus, Check, Film, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { MovieDto } from "@/types";

export interface MovieDetailsModalProps {
  movie: MovieDto | null;
  isOpen: boolean;
  onClose: () => void;
  isInDeck: boolean;
  onToggleDeck: (movie: MovieDto) => void;
  disabled?: boolean;
}

export function MovieDetailsModal({
  movie,
  isOpen,
  onClose,
  isInDeck,
  onToggleDeck,
  disabled = false,
}: MovieDetailsModalProps) {
  // Listen for Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !movie) {
    return null;
  }

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : null;

  const formattedRating =
    movie.voteAverage && movie.voteAverage > 0
      ? movie.voteAverage.toFixed(1)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-details-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border-subtle bg-bg-card p-5 sm:p-7 shadow-2xl shadow-black/80 animate-scale-in"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Header: Poster + Title/Rating Metadata */}
        <div className="flex gap-4 sm:gap-5 mb-5 items-start">
          {/* Poster Thumbnail */}
          <div className="relative aspect-[2/3] w-24 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated shadow-lg">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-text-muted">
                <Film className="h-6 w-6 mb-1 opacity-50" />
                <span className="text-[10px] line-clamp-2">{movie.title}</span>
              </div>
            )}
          </div>

          {/* Title, Year, Rating */}
          <div className="flex flex-1 flex-col pr-8">
            <h2
              id="movie-details-title"
              className="font-display text-lg sm:text-xl font-extrabold text-text-main leading-tight mb-2"
            >
              {movie.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {movie.releaseYear ? (
                <Badge variant="subtle" size="sm" className="gap-1">
                  <Calendar className="h-3 w-3 text-text-muted" />
                  {movie.releaseYear}
                </Badge>
              ) : null}

              {formattedRating ? (
                <Badge variant="host" size="sm" className="gap-1 font-bold">
                  <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
                  {formattedRating} / 10
                </Badge>
              ) : null}
            </div>

            {isInDeck ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald">
                <Check className="h-3.5 w-3.5" /> Currently in your deck
              </span>
            ) : null}
          </div>
        </div>

        {/* Synopsis Section */}
        <div className="mb-6 flex-1">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Overview / Synopsis
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-text-secondary">
            {movie.overview || "No overview is available for this title."}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Close
          </Button>

          {isInDeck ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={disabled}
              onClick={() => {
                onToggleDeck(movie);
                onClose();
              }}
              className="gap-1.5"
            >
              <X className="h-4 w-4" /> Remove from Deck
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={disabled}
              onClick={() => {
                onToggleDeck(movie);
                onClose();
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add to Deck
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
