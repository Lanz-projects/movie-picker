"use client";

import * as React from "react";
import { CheckCircle2, Clock, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserResponse } from "@/types";

export interface NominationsReadinessPillProps {
  users: UserResponse[];
  readyUserIds: number[];
  submittedCount: number;
  totalCount: number;
  hostName?: string;
  isHost?: boolean;
  onKickUser?: (userId: number, displayName: string) => void;
  className?: string;
}

export const NominationsReadinessPill = React.memo(function NominationsReadinessPill({
  users,
  readyUserIds,
  submittedCount,
  totalCount,
  hostName,
  isHost = false,
  onKickUser,
  className,
}: NominationsReadinessPillProps) {
  const effectiveTotal = Math.max(totalCount, users.length, 1);
  const isAllReady = submittedCount >= effectiveTotal && effectiveTotal > 0;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 w-full max-w-2xl mx-auto shadow-sm",
        isAllReady
          ? "border-brand-emerald/40 bg-brand-emerald/10 text-brand-emerald"
          : "border-border-subtle bg-bg-card/70 text-text-secondary",
        className
      )}
      role="status"
      aria-label={`Nominations readiness: ${submittedCount} of ${effectiveTotal} players ready`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Users className="h-4 w-4 text-brand-indigo" />
        <span className="text-text-main font-medium">Room Readiness:</span>
        <span
          className={cn(
            "font-mono font-bold px-2 py-0.5 rounded-full text-xs",
            isAllReady
              ? "bg-brand-emerald/20 text-brand-emerald"
              : "bg-bg-surface text-brand-indigo"
          )}
        >
          {submittedCount} / {effectiveTotal} Ready
        </span>
      </div>

      {/* Participant Status Chips */}
      {users.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-end">
          {users.map((user) => {
            const isUserReady = readyUserIds.includes(user.id);
            const isUserHost = user.displayName === hostName;

            return (
              <div
                key={user.id}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors border",
                  isUserReady
                    ? "bg-brand-emerald/15 border-brand-emerald/30 text-brand-emerald"
                    : "bg-bg-surface/80 border-border-subtle text-text-muted"
                )}
              >
                {isUserReady ? (
                  <CheckCircle2 className="h-3 w-3 text-brand-emerald" />
                ) : (
                  <Clock className="h-3 w-3 text-text-muted animate-pulse" />
                )}
                <span className="truncate max-w-[90px]">{user.displayName}</span>

                {isHost && !isUserHost && onKickUser && (
                  <button
                    type="button"
                    title={`Remove ${user.displayName}`}
                    aria-label={`Remove ${user.displayName}`}
                    onClick={() => onKickUser(user.id, user.displayName)}
                    className="ml-0.5 p-0.5 rounded-full text-text-muted hover:text-brand-rose hover:bg-brand-rose/20 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
