"use client";

import * as React from "react";
import { Film, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VotingProgressResponse } from "@/types";
import { cn } from "@/lib/utils";

export interface VotingProgressHeaderProps {
  currentIndex: number;
  totalMovies: number;
  progress: VotingProgressResponse | null;
  className?: string;
}

export const VotingProgressHeader = React.memo(function VotingProgressHeader({
  currentIndex,
  totalMovies,
  progress,
  className,
}: VotingProgressHeaderProps) {
  const currentDisplay = Math.min(currentIndex + 1, totalMovies);
  const localPercent = totalMovies > 0 ? (currentDisplay / totalMovies) * 100 : 0;

  const totalUsers = progress?.totalUsers || 1;
  const completedUsers = progress?.completedUserCount || 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 w-full max-w-[480px] mx-auto select-none",
        className
      )}
      role="region"
      aria-label="Voting progress"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-display font-bold text-text-main">
          <Film className="h-4 w-4 text-brand-indigo" />
          <span>
            Movie {currentDisplay} of {totalMovies}
          </span>
        </div>

        {progress && progress.totalUsers > 1 ? (
          <Badge variant="subtle" size="sm" className="gap-1 font-semibold text-[11px]">
            <Users className="h-3 w-3 text-brand-violet" />
            {completedUsers} / {totalUsers} Ready
          </Badge>
        ) : null}
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-surface border border-white/5">
        <div
          style={{ width: `${localPercent}%` }}
          className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-violet transition-all duration-300 ease-out"
        />
      </div>

      {progress && progress.totalUsers > 1 ? (
        <div className="flex items-center justify-between text-[10px] text-text-muted mt-0.5">
          <span>Room progress:</span>
          <span>{completedUsers} of {totalUsers} voted</span>
        </div>
      ) : null}
    </div>
  );
});
