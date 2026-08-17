"use client";

import * as React from "react";
import { Trophy, Sparkles, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ScoredMovieDto } from "@/types";

export interface WinnerHeaderBannerProps {
  winner: ScoredMovieDto;
}

export const WinnerHeaderBanner = React.memo(function WinnerHeaderBanner({
  winner,
}: WinnerHeaderBannerProps) {
  const matchPct = Math.round(winner.matchPercentage ?? 100);

  return (
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle/80 pb-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-amber/20 text-brand-amber border border-brand-amber/30 shadow-inner">
          <Trophy className="h-5 w-5 animate-bounce-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-display text-xs font-bold tracking-widest uppercase text-brand-amber">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Consensus Winner</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-text-main">
            Tonight&apos;s Pick
          </h2>
        </div>
      </div>

      {/* Unanimous / Match Percentage Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {winner.isUnanimous ? (
          <Badge variant="unanimous" size="md" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            100% Unanimous
          </Badge>
        ) : (
          <Badge variant="score" size="md" className="gap-1.5">
            <ThumbsUp className="h-3.5 w-3.5" />
            {matchPct}% Match
          </Badge>
        )}
        <Badge variant="score" size="md">
          +{winner.score} pts
        </Badge>
      </div>
    </div>
  );
});
