"use client";

import * as React from "react";
import { Film, X, Check, ArrowRight, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { MovieSubmissionDto } from "@/types";
import { cn } from "@/lib/utils";

export interface SelectionRackProps {
  selectedMovies: MovieSubmissionDto[];
  maxSuggestions: number;
  onRemoveMovie: (tmdbId: number) => void;
  onSubmitDeck: () => void;
  isSubmitting?: boolean;
  hasSubmitted?: boolean;
  isHost?: boolean;
  onStartVoting?: () => void;
  isStartingVoting?: boolean;
  className?: string;
}

export function SelectionRack({
  selectedMovies,
  maxSuggestions,
  onRemoveMovie,
  onSubmitDeck,
  isSubmitting = false,
  hasSubmitted = false,
  isHost = false,
  onStartVoting,
  isStartingVoting = false,
  className,
}: SelectionRackProps) {
  const count = selectedMovies.length;
  const emptySlotsCount = Math.max(0, maxSuggestions - count);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4 sm:p-5 shadow-xl shadow-black/40 transition-all w-full",
        hasSubmitted && "border-brand-emerald/30 bg-brand-emerald/5",
        className
      )}
      role="region"
      aria-label="Movie selection rack"
    >
      {/* Top Header Row: Title & Counter Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-indigo" />
          <span className="font-display text-sm font-bold text-text-main">
            Your Movie Deck
          </span>
        </div>

        <Badge
          variant={count === maxSuggestions ? "ready" : "subtle"}
          size="sm"
          className="font-semibold"
        >
          {count} / {maxSuggestions} Picked
        </Badge>
      </div>

      {/* Thumbnails Row: Active Picks + Placeholder Slots */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 py-1">
        {selectedMovies.map((movie) => {
          const posterSrc = movie.posterPath
            ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
            : null;

          return (
            <div
              key={movie.tmdbId}
              className="group relative h-20 w-14 sm:h-24 sm:w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-md"
              title={movie.title}
            >
              {posterSrc ? (
                <img
                  src={posterSrc}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center text-text-muted">
                  <Film className="h-5 w-5 mb-1 opacity-50" />
                  <span className="text-[9px] line-clamp-2 leading-tight">
                    {movie.title}
                  </span>
                </div>
              )}

              {/* Remove Overlay Button */}
              {!hasSubmitted ? (
                <button
                  type="button"
                  onClick={() => onRemoveMovie(movie.tmdbId)}
                  aria-label={`Remove ${movie.title} from deck`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white opacity-80 hover:bg-brand-coral hover:opacity-100 transition-all cursor-pointer shadow-sm"
                  title="Remove from deck"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          );
        })}

        {/* Empty Placeholder Slots */}
        {Array.from({ length: emptySlotsCount }).map((_, index) => (
          <div
            key={`empty-slot-${index}`}
            className="flex h-20 w-14 sm:h-24 sm:w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-bg-elevated/30 text-text-muted p-1 text-center"
          >
            <span className="text-base font-light opacity-60">+</span>
            <span className="text-[9px] font-medium opacity-60">Pick</span>
          </div>
        ))}
      </div>

      {/* Bottom Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border-subtle/60">
        <p className="text-xs text-text-secondary">
          {hasSubmitted
            ? "Your nominations are locked in for voting!"
            : count === 0
            ? "Search and add at least 1 movie to submit."
            : `Ready to submit ${count} movie${count > 1 ? "s" : ""}.`}
        </p>

        <div className="flex items-center gap-2.5">
          {/* Main User Submit Button */}
          {!hasSubmitted ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSubmitDeck}
              disabled={count === 0 || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Submit Deck ({count})
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="ready" size="md" className="gap-1.5 py-1.5 px-3">
                <Check className="h-4 w-4" /> Deck Submitted
              </Badge>

              {/* Host Start Voting Action */}
              {isHost && onStartVoting ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onStartVoting}
                  disabled={isStartingVoting}
                  className="gap-1.5 shadow-lg shadow-brand-indigo/30"
                >
                  {isStartingVoting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Voting Phase
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
