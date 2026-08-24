"use client";

import * as React from "react";
import Image from "next/image";
import { Film, User, Calendar, Info, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeaderboardRankBadge } from "./LeaderboardRankBadge";
import type { ScoredMovieDto } from "@/types";
import { cn } from "@/lib/utils";

export interface LeaderboardRowProps {
  movie: ScoredMovieDto;
  rank: number;
  onOpenDetails?: (movie: ScoredMovieDto) => void;
  className?: string;
}

export const LeaderboardRow = React.memo(function LeaderboardRow({
  movie,
  rank,
  onOpenDetails,
  className,
}: LeaderboardRowProps) {
  const [failedPosterUrl, setFailedPosterUrl] = React.useState<string | null>(null);

  const rawPosterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w185${movie.posterPath}`
    : null;

  const posterUrl = rawPosterUrl && failedPosterUrl !== rawPosterUrl ? rawPosterUrl : null;

  const matchPct = Math.round(movie.matchPercentage ?? 0);

  return (
    <div
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-border-subtle bg-bg-surface/60 p-3.5 sm:p-4 transition-all duration-200 hover:border-border-highlight/50 hover:bg-bg-surface/90",
        className
      )}
    >
      {/* Left: Rank + Thumbnail + Metadata */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <LeaderboardRankBadge rank={rank} />

        {/* Thumbnail */}
        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-sm">
          {posterUrl ? (
            <Image
              key={posterUrl}
              src={posterUrl}
              alt={movie.title}
              fill
              sizes="40px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setFailedPosterUrl(rawPosterUrl)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              <Film className="h-4 w-4 opacity-40" />
            </div>
          )}
        </div>

        {/* Title, Year & Nominator */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h4 className="truncate font-display text-sm sm:text-base font-bold text-text-main">
              {movie.title}
            </h4>
            {movie.releaseYear && (
              <span className="flex items-center gap-0.5 text-xs text-text-muted">
                <Calendar className="h-3 w-3" />
                {movie.releaseYear}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            {movie.suggestedBy && (
              <span className="inline-flex items-center gap-1 text-[11px] text-text-muted max-w-full flex-wrap">
                <User className="h-3 w-3 text-brand-indigo shrink-0" />
                <span>Suggested by</span>
                <span className="font-semibold text-text-main break-words">
                  {movie.suggestedBy}
                </span>
                {movie.nominators && movie.nominators.length > 1 && (
                  <span className="inline-flex items-center px-1 py-0.2 rounded-full bg-brand-amber/15 text-brand-amber text-[9px] font-bold border border-brand-amber/30 shrink-0 ml-0.5">
                    🔥 {movie.nominators.length}x
                  </span>
                )}
              </span>
            )}

            {/* Voter summary chips */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-text-muted">
              <span className="flex items-center gap-0.5 text-brand-emerald">
                <Heart className="h-3 w-3 fill-brand-emerald/20" />
                {movie.yesVotes}
              </span>
              {movie.superlikeVotes > 0 && (
                <span className="flex items-center gap-0.5 text-brand-amber">
                  <Star className="h-3 w-3 fill-brand-amber/20" />
                  {movie.superlikeVotes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Scores, Match % & Details button */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t sm:border-t-0 border-border-subtle/40 pt-2 sm:pt-0">
        <div className="flex items-center gap-2">
          <Badge variant="subtle" size="sm">
            {matchPct}% Match
          </Badge>
          <Badge variant="score" size="sm">
            +{movie.score} pts
          </Badge>
        </div>

        {onOpenDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-text-muted hover:text-text-main"
            onClick={() => onOpenDetails(movie)}
            aria-label={`View details for ${movie.title}`}
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});
