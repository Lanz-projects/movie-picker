"use client";

import * as React from "react";
import { Star, Heart } from "lucide-react";
import type { ScoredMovieDto } from "@/types";

export interface WinnerVotesBreakdownProps {
  winner: ScoredMovieDto;
}

export const WinnerVotesBreakdown = React.memo(function WinnerVotesBreakdown({
  winner,
}: WinnerVotesBreakdownProps) {
  const hasSuperlikers = winner.superlikers && winner.superlikers.length > 0;
  const hasPositiveVoters = winner.positiveVoters && winner.positiveVoters.length > 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface/70 p-3.5 space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
        Group Votes
      </span>

      {/* Superlikers */}
      {hasSuperlikers && (
        <div className="flex items-center gap-2 text-xs text-brand-amber">
          <Star className="h-3.5 w-3.5 fill-brand-amber shrink-0" />
          <span>
            <strong>Superliked by:</strong> {winner.superlikers!.join(", ")}
          </span>
        </div>
      )}

      {/* Positive Voters */}
      {hasPositiveVoters && (
        <div className="flex items-center gap-2 text-xs text-brand-emerald">
          <Heart className="h-3.5 w-3.5 fill-brand-emerald shrink-0" />
          <span>
            <strong>Liked by:</strong> {winner.positiveVoters!.join(", ")}
          </span>
        </div>
      )}

      {/* Tallies */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-border-subtle/50 text-[11px] text-text-muted">
        <span>💚 {winner.yesVotes} Yes</span>
        <span>⭐ {winner.superlikeVotes} Superlike</span>
        <span>❌ {winner.noVotes} Pass</span>
        <span>⏭️ {winner.skipVotes} Skip</span>
      </div>
    </div>
  );
});
