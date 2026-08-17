"use client";

import * as React from "react";
import { Layers, Check, ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectionRackItem } from "./SelectionRackItem";
import type { MovieSubmissionDto } from "@/types";
import { cn } from "@/lib/utils";

export interface SelectionRackProps {
  selectedMovies: MovieSubmissionDto[];
  maxSuggestions: number;
  onRemoveMovie: (tmdbId: number) => void;
  onSubmitDeck: () => void;
  onSelectMovie?: (movie: MovieSubmissionDto) => void;
  isSubmitting?: boolean;
  hasSubmitted?: boolean;
  isHost?: boolean;
  onStartVoting?: () => void;
  isStartingVoting?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const SelectionRack = React.memo(function SelectionRack({
  selectedMovies,
  maxSuggestions,
  onRemoveMovie,
  onSubmitDeck,
  onSelectMovie,
  isSubmitting = false,
  hasSubmitted = false,
  isHost = false,
  onStartVoting,
  isStartingVoting = false,
  defaultExpanded = true,
  className,
}: SelectionRackProps) {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(defaultExpanded);

  const count = selectedMovies.length;
  const emptySlotsCount = Math.max(0, maxSuggestions - count);

  const prevCountRef = React.useRef(count);
  React.useEffect(() => {
    if (count > prevCountRef.current && !isExpanded) {
      setIsExpanded(true);
    }
    prevCountRef.current = count;
  }, [count, isExpanded]);

  if (!isExpanded) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border border-border-highlight bg-bg-surface/95 backdrop-blur-xl shadow-2xl shadow-black/80 animate-scale-in transition-all w-full max-w-2xl mx-auto",
          hasSubmitted && "border-brand-emerald/40 bg-brand-emerald/10",
          className
        )}
        role="region"
        aria-label="Collapsed movie deck summary"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer text-left"
          aria-expanded={false}
          aria-label="Show deck details"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-indigo/20 text-brand-indigo">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-bold text-text-main">
                Your Deck
              </span>
              <Badge
                variant={count === maxSuggestions ? "ready" : "subtle"}
                size="sm"
                className="font-semibold text-[11px] px-2 py-0"
              >
                {count} / {maxSuggestions}
              </Badge>
            </div>
            <span className="text-[10px] text-text-muted hidden sm:inline-block">
              {hasSubmitted ? "Locked in" : count === 0 ? "Empty deck" : `${count} movie${count > 1 ? "s" : ""} selected`}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {!hasSubmitted ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSubmitDeck}
              disabled={count === 0 || isSubmitting}
              className="text-xs h-8 px-3 gap-1 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>Submit ({count})</span>
            </Button>
          ) : (
            <Badge variant="ready" size="sm" className="gap-1 text-[11px]">
              <Check className="h-3 w-3" /> Submitted
            </Badge>
          )}

          {isHost && hasSubmitted && onStartVoting ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onStartVoting}
              disabled={isStartingVoting}
              className="text-xs h-8 px-3 gap-1 shadow-md shadow-brand-indigo/30"
            >
              {isStartingVoting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span>Start Voting</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand movie selection deck"
            className="text-text-muted hover:text-text-main h-8 px-2 gap-1 text-xs"
          >
            <ChevronUp className="h-4 w-4" />
            <span className="hidden sm:inline">Expand</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 sm:gap-4 rounded-3xl border border-border-highlight bg-bg-surface/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-black/80 transition-all w-full",
        hasSubmitted && "border-brand-emerald/40 bg-brand-emerald/5",
        className
      )}
      role="region"
      aria-label="Movie selection rack"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-indigo" />
          <span className="font-display text-sm font-bold text-text-main">
            Your Movie Deck
          </span>
          <span className="text-xs text-text-muted hidden sm:inline">
            (Click any poster to inspect details)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={count === maxSuggestions ? "ready" : "subtle"}
            size="sm"
            className="font-semibold"
          >
            {count} / {maxSuggestions} Picked
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            aria-label="Minimize movie selection deck"
            aria-expanded={true}
            className="text-text-muted hover:text-text-main h-7 px-2 text-xs gap-1"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Hide</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 py-1">
        {selectedMovies.map((movie) => (
          <SelectionRackItem
            key={movie.tmdbId}
            movie={movie}
            hasSubmitted={hasSubmitted}
            onRemoveMovie={onRemoveMovie}
            onSelectMovie={onSelectMovie}
          />
        ))}

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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border-subtle/60">
        <p className="text-xs text-text-secondary">
          {hasSubmitted
            ? "Your nominations are locked in for voting!"
            : count === 0
            ? "Search and add at least 1 movie to submit."
            : `Ready to submit ${count} movie${count > 1 ? "s" : ""}.`}
        </p>

        <div className="flex items-center gap-2.5">
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
});
