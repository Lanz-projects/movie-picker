"use client";

import * as React from "react";
import { Crown, Users, UserX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { UserResponse } from "@/types";

export interface MemberRosterProps {
  users: UserResponse[];
  hostName: string;
  currentUserId?: number;
  isHost?: boolean;
  onKickUser?: (userId: number, banPermanently?: boolean) => void;
}

export function MemberRoster({
  users,
  hostName,
  currentUserId,
  isHost = false,
  onKickUser,
}: MemberRosterProps) {
  const [confirmKickId, setConfirmKickId] = React.useState<number | null>(null);

  const handleKick = (userId: number, banPermanently = false) => {
    onKickUser?.(userId, banPermanently);
    setConfirmKickId(null);
  };

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
          const isConfirming = confirmKickId === user.id;
          const priorKicks = user.kickCount || 0;

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
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-text-main truncate">
                      {user.displayName}
                    </p>
                    {priorKicks > 0 && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-amber/20 text-brand-amber border border-brand-amber/30">
                        Strike {priorKicks}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted">
                    {isUserHost ? "Room Leader" : "Member"}
                  </p>
                </div>
              </div>

              {/* Badges & Actions */}
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

                {/* Host Moderation: Kick / Ban Guest */}
                {isHost && !isUserHost && onKickUser && (
                  <div className="flex items-center gap-1">
                    {isConfirming ? (
                      priorKicks >= 1 ? (
                        <>
                          <button
                            type="button"
                            aria-label={`Kick ${user.displayName} for round`}
                            onClick={() => handleKick(user.id, false)}
                            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-brand-amber text-black hover:bg-brand-amber/90 transition-all cursor-pointer"
                          >
                            Kick Round
                          </button>
                          <button
                            type="button"
                            aria-label={`Ban ${user.displayName} permanently`}
                            onClick={() => handleKick(user.id, true)}
                            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-brand-rose text-white shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse hover:bg-brand-rose/90 transition-all cursor-pointer"
                          >
                            Ban Perm
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Confirm Kick ${user.displayName}`}
                          onClick={() => handleKick(user.id, false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-rose text-white border-brand-rose shadow-[0_0_16px_rgba(244,63,94,0.5)] animate-pulse cursor-pointer"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Confirm?
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        aria-label={`Kick ${user.displayName}`}
                        onClick={() => setConfirmKickId(user.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border-subtle bg-bg-surface/60 text-text-muted hover:text-brand-rose hover:bg-brand-rose/20 hover:border-brand-rose/60 hover:shadow-[0_0_14px_rgba(244,63,94,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Kick
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
