"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LeaderboardRankBadgeProps {
  rank: number;
  className?: string;
}

export const LeaderboardRankBadge = React.memo(function LeaderboardRankBadge({
  rank,
  className,
}: LeaderboardRankBadgeProps) {
  const getRankStyles = (rankNum: number) => {
    if (rankNum === 2) {
      return "bg-slate-700/50 text-slate-200 border-slate-500/40 shadow-sm";
    }
    if (rankNum === 3) {
      return "bg-amber-900/30 text-amber-300 border-amber-600/40 shadow-sm";
    }
    return "bg-bg-elevated text-text-muted border-border-subtle";
  };

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-display text-xs font-black tracking-tight transition-colors",
        getRankStyles(rank),
        className
      )}
    >
      #{rank}
    </span>
  );
});
