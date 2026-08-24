"use client";

import * as React from "react";
import { CheckCircle2, Clock, Loader2, Sparkles, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VotingProgressResponse, UserResponse } from "@/types";
import { cn } from "@/lib/utils";

export interface SwiperFinishedViewProps {
  progress: VotingProgressResponse | null;
  users?: UserResponse[];
  currentUserId?: number;
  className?: string;
}

export const SwiperFinishedView = React.memo(function SwiperFinishedView({
  progress,
  users = [],
  currentUserId,
  className,
}: SwiperFinishedViewProps) {
  const totalUsers = progress?.totalUsers || users.length || 1;
  const completedUsers = progress?.completedUserCount || 1;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full p-6 sm:p-8 rounded-3xl border border-border-subtle bg-bg-card shadow-2xl shadow-black/80 animate-scale-in",
        className
      )}
      role="status"
      aria-label="Voting finished, waiting for other members"
    >
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand-emerald/40 bg-brand-emerald/10 text-brand-emerald shadow-xl shadow-brand-emerald/20">
        <CheckCircle2 className="h-10 w-10 animate-bounce" />
        <div className="absolute -top-1 -right-1">
          <Sparkles className="h-5 w-5 text-brand-amber animate-spin" />
        </div>
      </div>

      <Badge variant="ready" size="md" className="gap-1.5 mb-3 px-3 py-1 font-bold">
        Your Votes Are Locked In!
      </Badge>

      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-text-main leading-tight mb-2">
        Waiting for Room Consensus
      </h2>

      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        You&apos;ve swiped through all nominated movies. Once every member in the room finishes voting, the winner reveal leaderboard will automatically trigger!
      </p>

      <div className="flex flex-col w-full gap-2.5 p-4 rounded-2xl border border-border-subtle bg-bg-surface/60">
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted pb-1 border-b border-white/5">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-brand-indigo" />
            Room Status
          </span>
          <span>
            {completedUsers} / {totalUsers} Finished
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1 max-h-44 overflow-y-auto">
          {progress?.users && progress.users.length > 0 ? (
            progress.users.map((user) => {
              const isMe = user.userId === currentUserId;

              return (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle bg-bg-elevated/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-text-muted" />
                    <span className="font-medium text-text-main">
                      {user.displayName} {isMe ? "(You)" : ""}
                    </span>
                  </div>

                  {user.completed ? (
                    <Badge variant="ready" size="sm" className="gap-1 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-brand-amber font-medium">
                      <Clock className="h-3 w-3 animate-spin" /> Swiping...
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-brand-indigo" />
              <span>Calculating consensus...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
