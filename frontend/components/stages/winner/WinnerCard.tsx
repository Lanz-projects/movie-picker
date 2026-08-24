"use client";

import * as React from "react";
import { User, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  WinnerHeaderBanner,
  WinnerPosterColumn,
  WinnerVotesBreakdown,
} from "./card";
import type { ScoredMovieDto } from "@/types";
import { cn } from "@/lib/utils";

export interface WinnerCardProps {
  winner: ScoredMovieDto;
  onOpenDetails?: (movie: ScoredMovieDto) => void;
  className?: string;
}

export const WinnerCard = React.memo(function WinnerCard({
  winner,
  onOpenDetails,
  className,
}: WinnerCardProps) {
  return (
    <Card
      variant="elevated"
      className={cn(
        "relative overflow-hidden border-2 border-brand-amber/30 bg-gradient-to-b from-bg-card via-bg-card to-[#0e121d] p-6 sm:p-8 shadow-2xl shadow-brand-amber/5 max-w-2xl mx-auto w-full",
        className
      )}
    >
      {/* Ambient Top Glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-amber/20 via-brand-violet/20 to-brand-indigo/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Header Banner */}
      <WinnerHeaderBanner winner={winner} />

      {/* Main Content: Poster + Info */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 sm:grid-cols-12">
        {/* Poster Column */}
        <WinnerPosterColumn
          title={winner.title}
          posterPath={winner.posterPath}
        />

        {/* Info Column */}
        <div className="sm:col-span-7 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Title & Year */}
            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-text-main leading-tight">
                {winner.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-secondary">
                {winner.releaseYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    {winner.releaseYear}
                  </span>
                )}
                {winner.suggestedBy && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-bg-surface px-2.5 py-1 border border-border-subtle text-xs text-text-secondary max-w-full flex-wrap">
                    <User className="h-3.5 w-3.5 text-brand-indigo shrink-0" />
                    <span>Suggested by</span>
                    <strong className="text-text-main font-bold break-words">
                      {winner.suggestedBy}
                    </strong>
                    {winner.nominators && winner.nominators.length > 1 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-amber/15 text-brand-amber text-[10px] font-extrabold border border-brand-amber/30 shrink-0">
                        🔥 {winner.nominators.length}x Pick
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Synopsis */}
            {winner.overview && (
              <p className="font-sans text-sm text-text-secondary leading-relaxed line-clamp-4">
                {winner.overview}
              </p>
            )}

            {/* Voter Reaction Breakdown */}
            <WinnerVotesBreakdown winner={winner} />
          </div>

          {/* Details CTA */}
          {onOpenDetails && (
            <div className="mt-4 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-2 border-border-subtle hover:border-brand-violet/50"
                onClick={() => onOpenDetails(winner)}
              >
                <Info className="h-4 w-4 text-brand-violet" />
                View Full Movie Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
