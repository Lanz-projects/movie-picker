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
  readyCount?: number;
  totalUsersCount?: number;
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
  readyCount,
  totalUsersCount,
  defaultExpanded = false,
  className,
}: SelectionRackProps) {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(defaultExpanded);
  const [prevCount, setPrevCount] = React.useState<number>(selectedMovies.length);

  const count = selectedMovies.length;
  const emptySlotsCount = Math.max(0, maxSuggestions - count);

  // Auto-expand when a new movie is added without an asynchronous useEffect re-render cycle
  if (count !== prevCount) {
    setPrevCount(count);
    if (count > prevCount && !isExpanded) {
      setIsExpanded(true);
    }
  }

  const startVotingLabel = React.useMemo(() => {
    if (readyCount !== undefined && totalUsersCount !== undefined && totalUsersCount > 0) {
      if (readyCount >= totalUsersCount) {
        return "Start Voting (All Ready)";
      }
      return `Start Voting (${readyCount}/${totalUsersCount} Ready)`;
    }
    return "Start Voting Phase";
  }, [readyCount, totalUsersCount]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl sm:rounded-3xl border border-border-highlight bg-bg-surface/95 backdrop-blur-xl shadow-2xl shadow-black/80 transition-all duration-300 ease-out w-full max-w-4xl mx-auto overflow-hidden",
        hasSubmitted && "border-brand-emerald/40 bg-brand-emerald/5",
        isExpanded ? "p-4 sm:p-5 gap-3" : "p-3 sm:py-2.5 sm:px-4",
        className
      )}
      role="region"
      aria-label="Movie selection rack"
    >
      {/* Header Bar: Always smoothly present */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity text-left cursor-pointer select-none"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Hide deck details" : "Show deck details"}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-indigo/20 text-brand-indigo flex-shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-bold text-text-main">
                Your Movie Deck
              </span>
              <Badge
                variant={hasSubmitted ? "ready" : "subtle"}
                size="sm"
                className="font-semibold text-[11px] px-2 py-0"
              >
                {count} / {maxSuggestions} Picked
              </Badge>
            </div>
            <span className="text-[11px] text-text-muted hidden sm:inline-block">
              {hasSubmitted
                ? "Locked in for voting"
                : count === 0
                ? "Click any movie poster to add"
                : `${count} movie${count > 1 ? "s" : ""} selected`}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Submit/Start CTA when Collapsed */}
          {!isExpanded && (
            <div className="flex items-center gap-2 animate-fade-in">
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
                      <span className="hidden sm:inline">{startVotingLabel}</span>
                      <span className="sm:hidden">Start</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          )}

          {/* Expand / Minimize Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? "Minimize movie selection deck" : "Expand movie selection deck"}
            className="text-text-muted hover:text-text-main h-8 px-2 gap-1 text-xs cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Smooth CSS Grid Accordion for Expanded Content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        )}
      >
        <div className="overflow-hidden flex flex-col gap-3 sm:gap-4 pt-1">
          {/* Movie thumbnails tray */}
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

          {/* Bottom Action Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-border-subtle/60">
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
                          {startVotingLabel}
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
      </div>
    </div>
  );
});
