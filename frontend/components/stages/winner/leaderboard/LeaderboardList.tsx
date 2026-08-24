"use client";

import * as React from "react";
import { ListOrdered, Film } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LeaderboardRow } from "./LeaderboardRow";
import type { ScoredMovieDto } from "@/types";
import { cn } from "@/lib/utils";

export interface LeaderboardListProps {
  rankedMovies: ScoredMovieDto[];
  onOpenDetails?: (movie: ScoredMovieDto) => void;
  className?: string;
}

export const LeaderboardList = React.memo(function LeaderboardList({
  rankedMovies,
  onOpenDetails,
  className,
}: LeaderboardListProps) {
  const hasRunnerUps = rankedMovies && rankedMovies.length > 0;

  return (
    <Card
      variant="card"
      className={cn(
        "p-5 sm:p-6 max-w-2xl mx-auto w-full border border-border-subtle bg-bg-card/90",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-surface text-brand-indigo border border-border-subtle">
            <ListOrdered className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-text-main">
              Runner-Ups &amp; Rankings
            </h3>
            <p className="text-xs text-text-muted">
              How the other nominated movies scored
            </p>
          </div>
        </div>

        {hasRunnerUps && (
          <Badge variant="subtle" size="sm">
            {rankedMovies.length} {rankedMovies.length === 1 ? "movie" : "movies"}
          </Badge>
        )}
      </div>

      {/* List / Empty State */}
      {hasRunnerUps ? (
        <div className="space-y-2.5">
          {rankedMovies.map((movie, index) => (
            <LeaderboardRow
              key={movie.movieSuggestionId || movie.tmdbId}
              movie={movie}
              rank={index + 2}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
          <Film className="h-8 w-8 opacity-30 mb-2" />
          <p className="text-xs text-text-secondary font-medium">
            No runner-up movies
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Only one movie was in this session&apos;s nomination pool.
          </p>
        </div>
      )}
    </Card>
  );
});
