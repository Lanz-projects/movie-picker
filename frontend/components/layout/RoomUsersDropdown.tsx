"use client";

import * as React from "react";
import { Users, Crown, Check, Clock, UserX, ChevronDown, ShieldAlert, Copy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { UserResponse, GameStage, DeckSubmissionProgress, VotingProgressResponse } from "@/types";

export interface RoomUsersDropdownProps {
  users: UserResponse[];
  maxUsers?: number;
  hostName?: string;
  currentUserId?: number;
  isHost?: boolean;
  stage?: GameStage;
  submissionProgress?: DeckSubmissionProgress;
  votingProgress?: VotingProgressResponse | null;
  isConnected?: boolean;
  onKickUser?: (userId: number, banPermanently?: boolean) => Promise<void> | void;
  roomCode?: string;
  nickname?: string;
}

export const RoomUsersDropdown = React.memo(function RoomUsersDropdown({
  users,
  maxUsers,
  hostName,
  currentUserId,
  isHost = false,
  stage = "LOBBY",
  submissionProgress,
  votingProgress,
  isConnected = true,
  onKickUser,
  roomCode,
  nickname,
}: RoomUsersDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmKickUserId, setConfirmKickUserId] = React.useState<number | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setConfirmKickUserId(null);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setConfirmKickUserId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const memberCount = users.length;
  const readyUserIds = React.useMemo(() => {
    if (stage === "SEARCH") {
      return new Set(submissionProgress?.readyUserIds || []);
    }
    if (stage === "SWIPER") {
      const ready = new Set<number>();
      if (votingProgress?.users) {
        votingProgress.users.forEach((up) => {
          if (up.completed) {
            ready.add(up.userId);
          }
        });
      }
      return ready;
    }
    return new Set<number>();
  }, [stage, submissionProgress, votingProgress]);

  const readyCount = React.useMemo(() => {
    if (stage === "SEARCH") {
      return submissionProgress?.submittedCount || 0;
    }
    if (stage === "SWIPER") {
      return votingProgress?.completedUserCount ?? votingProgress?.users?.filter((u) => u.completed).length ?? 0;
    }
    return memberCount;
  }, [stage, submissionProgress, votingProgress, memberCount]);

  const handleConfirmKick = async (targetUserId: number, ban: boolean) => {
    if (!onKickUser) return;
    try {
      setIsSubmittingAction(true);
      await onKickUser(targetUserId, ban);
      setConfirmKickUserId(null);
    } catch {
      // error handled in context
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setConfirmKickUserId(null);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="View room players and readiness status"
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none active:scale-95 ${
          isOpen
            ? "border-brand-cyan/60 bg-bg-elevated text-brand-cyan shadow-md shadow-brand-cyan/10"
            : "border-border-subtle bg-bg-surface hover:bg-bg-elevated hover:border-border-muted text-text-secondary hover:text-text-main"
        }`}
      >
        {/* Active In-Room Connection Status Light */}
        <span
          className={`h-2 w-2 rounded-full transition-colors ${
            isConnected
              ? "bg-brand-emerald shadow-xs shadow-brand-emerald/50 animate-pulse"
              : "bg-brand-coral"
          }`}
          title={isConnected ? "In Room (Connected)" : "Reconnecting..."}
          aria-hidden="true"
        />

        {/* Mobile-only Room Code Tag */}
        {roomCode && (
          <span className="sm:hidden font-mono font-bold text-brand-violet">
            {roomCode} ·
          </span>
        )}

        <Users className="h-3.5 w-3.5 text-brand-cyan" />
        <span>
          {memberCount}
          {maxUsers ? `/${maxUsers}` : ""}
        </span>

        {/* Mini Readiness Count in Active Stages */}
        {(stage === "SEARCH" || stage === "SWIPER") && (
          <span className="hidden sm:inline-block text-[11px] font-medium text-text-muted">
            ({readyCount}/{memberCount} Ready)
          </span>
        )}

        <ChevronDown
          className={`h-3 w-3 text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-cyan" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-border-subtle bg-bg-surface/95 p-3.5 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Mobile Room Code & Nickname Card */}
          {roomCode && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-bg-elevated/80 border border-border-subtle mb-2.5 sm:hidden">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-text-muted">Room:</span>
                <span className="font-mono text-xs font-bold text-brand-cyan tracking-wider">
                  {roomCode}
                </span>
                {nickname && (
                  <span className="text-[11px] text-text-secondary truncate max-w-24">
                    ({nickname})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-white px-2 py-1 rounded-lg bg-bg-surface hover:bg-brand-violet/20 transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? (
                  <Check className="h-3 w-3 text-brand-emerald" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}

          {/* Header & Stage Progress Summary */}
          <div className="border-b border-border-subtle/70 pb-2.5 mb-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Room Members
              </span>
              <span className="text-xs font-semibold text-text-main">
                {memberCount} {memberCount === 1 ? "Player" : "Players"}
              </span>
            </div>

            {/* Stage-specific Readiness Bar */}
            {(stage === "SEARCH" || stage === "SWIPER") && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">
                    {stage === "SEARCH" ? "Picks Submitted" : "Votes Completed"}
                  </span>
                  <span className="font-semibold text-brand-cyan">
                    {readyCount} of {memberCount} Ready
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan transition-all duration-300"
                    style={{
                      width: `${memberCount > 0 ? (readyCount / memberCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* User Roster List */}
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto no-scrollbar py-0.5">
            {users.map((user) => {
              const isUserHost = user.displayName === hostName;
              const isMe = user.id === currentUserId;
              const isReady = readyUserIds.has(user.id);
              const isConfirmingKick = confirmKickUserId === user.id;

              return (
                <div
                  key={user.id}
                  className={`flex flex-col rounded-xl p-2 transition-colors ${
                    isMe
                      ? "bg-brand-indigo/10 border border-brand-indigo/30"
                      : "bg-bg-elevated/40 border border-transparent hover:border-border-subtle"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* User Name & Badges */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-surface border border-border-subtle font-bold text-xs text-text-main flex-shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-text-main">
                            {user.displayName}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-text-muted font-medium">
                              (You)
                            </span>
                          )}
                        </div>
                        {isUserHost && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-brand-amber">
                            <Crown className="h-2.5 w-2.5" />
                            <span>Host</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Readiness Badge */}
                      {stage === "SEARCH" || stage === "SWIPER" ? (
                        isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-emerald/15 px-2 py-0.5 text-[10px] font-bold text-brand-emerald border border-brand-emerald/30 shadow-xs">
                            <Check className="h-3 w-3" />
                            <span>{stage === "SEARCH" ? "Ready" : "Voted"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted border border-border-subtle">
                            <Clock className="h-3 w-3 animate-spin text-text-muted" />
                            <span>{stage === "SEARCH" ? "Picking..." : "Voting..."}</span>
                          </span>
                        )
                      ) : (
                        <Badge variant="subtle" size="sm" className="text-[10px] px-1.5 py-0">
                          In Room
                        </Badge>
                      )}

                      {/* Host Kick Trigger */}
                      {isHost && !isMe && !isUserHost && onKickUser && !isConfirmingKick && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmKickUserId(user.id);
                          }}
                          aria-label={`Kick ${user.displayName} from room`}
                          className="flex h-6 px-1.5 items-center justify-center rounded-lg text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 border border-transparent hover:border-brand-coral/30 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <UserX className="h-3 w-3 mr-0.5" />
                          <span>Kick</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Kick Confirmation Panel */}
                  {isConfirmingKick && (
                    <div className="mt-2 pt-2 border-t border-border-subtle/60 flex flex-col gap-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] text-brand-coral font-semibold">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Remove {user.displayName}?
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmKickUserId(null)}
                          className="text-text-muted hover:text-text-main text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isSubmittingAction}
                          onClick={() => handleConfirmKick(user.id, false)}
                          className="h-6 text-[10px] px-2 flex-1"
                        >
                          Kick
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isSubmittingAction}
                          onClick={() => handleConfirmKick(user.id, true)}
                          className="h-6 text-[10px] px-2 flex-1 opacity-90 hover:opacity-100"
                        >
                          Ban
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
