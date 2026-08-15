"use client";

import * as React from "react";
import { Crown, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { UserResponse } from "@/types";

export interface MemberRosterProps {
  users: UserResponse[];
  hostName: string;
  currentUserId?: number;
}

export function MemberRoster({
  users,
  hostName,
  currentUserId,
}: MemberRosterProps) {
  return (
    <Card variant="card" className="w-full p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-cyan" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-main">
            Joined Members ({users.length})
          </h2>
        </div>
        <span className="text-xs text-text-muted">Live Roster</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {users.map((user) => {
          const isUserHost = user.displayName === hostName;
          const isMe = user.id === currentUserId;
          const initials = user.displayName.slice(0, 2).toUpperCase();

          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-xl bg-bg-surface/60 border border-border-subtle hover:border-border-muted transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* User Avatar Initials */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-indigo/30 to-brand-violet/30 border border-brand-violet/20 font-display text-xs font-bold text-white shadow-inner">
                  {initials}
                </div>

                <div className="truncate">
                  <p className="text-sm font-semibold text-text-main truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {isUserHost ? "Room Leader" : "Member"}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isUserHost && (
                  <Badge
                    variant="host"
                    size="sm"
                    className="gap-1 px-2 font-bold"
                  >
                    <Crown className="h-3 w-3" />
                    Host
                  </Badge>
                )}

                {isMe && (
                  <Badge
                    variant="score"
                    size="sm"
                    className="px-2 font-bold"
                  >
                    You
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
