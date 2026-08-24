"use client";

import * as React from "react";
import { Clapperboard, Copy, Check, Crown, Wifi, LogOut, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RoomUsersDropdown } from "./RoomUsersDropdown";
import { isSoundMuted, toggleSoundMuted, subscribeSoundMuted } from "@/lib/audio/sounds";
import { cn } from "@/lib/utils";
import type { UserResponse, GameStage, DeckSubmissionProgress, VotingProgressResponse } from "@/types";

export interface HeaderProps {
  roomCode?: string;
  nickname?: string;
  isHost?: boolean;
  memberCount?: number;
  users?: UserResponse[];
  maxUsers?: number;
  hostName?: string;
  currentUserId?: number;
  stage?: GameStage;
  submissionProgress?: DeckSubmissionProgress;
  votingProgress?: VotingProgressResponse | null;
  onKickUser?: (userId: number, banPermanently?: boolean) => Promise<void> | void;
  isConnected?: boolean;
  onLeaveRoom?: () => void;
}

export const Header = React.memo(function Header({
  roomCode,
  nickname,
  isHost = false,
  memberCount,
  users,
  maxUsers,
  hostName,
  currentUserId,
  stage = "LOBBY",
  submissionProgress,
  votingProgress,
  onKickUser,
  isConnected = true,
  onLeaveRoom,
}: HeaderProps) {
  const [copied, setCopied] = React.useState(false);
  const muted = React.useSyncExternalStore(
    subscribeSoundMuted,
    isSoundMuted,
    () => false
  );

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-base/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-275 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Current Player Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-linear-to-tr from-brand-indigo to-brand-violet text-white shadow-md shadow-brand-indigo/30 shrink-0">
            <Clapperboard className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-display text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
              What Should We Watch
            </span>
            {nickname && roomCode ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-text-muted">Playing as</span>
                <span className="text-[11px] font-bold text-text-main max-w-28 sm:max-w-44 truncate">
                  {nickname}
                </span>
                {isHost && (
                  <Badge variant="host" size="sm" className="text-[9px] px-1.5 py-0 h-4">
                    <Crown className="h-2.5 w-2.5" />
                    <span>Host</span>
                  </Badge>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Dynamic Room & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {roomCode ? (
            <>
              {/* Room Code Badge with Copy (Desktop) */}
              <button
                onClick={handleCopyCode}
                title="Click to copy Room Code"
                className={cn(
                  "hidden sm:flex group items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-surface px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-text-main transition-all duration-200 hover:border-brand-violet hover:bg-bg-elevated cursor-pointer active:scale-95"
                )}
              >
                <span className="text-text-muted hidden xs:inline">ROOM</span>
                <span className="font-mono font-bold tracking-wider text-brand-violet group-hover:text-white">
                  {roomCode}
                </span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-brand-emerald" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-text-muted group-hover:text-text-secondary" />
                )}
              </button>

              {/* Interactive Room Members & Readiness Dropdown */}
              {users && users.length > 0 ? (
                <RoomUsersDropdown
                  users={users}
                  maxUsers={maxUsers}
                  hostName={hostName}
                  currentUserId={currentUserId}
                  isHost={isHost}
                  stage={stage}
                  submissionProgress={submissionProgress}
                  votingProgress={votingProgress}
                  isConnected={isConnected}
                  onKickUser={onKickUser}
                  roomCode={roomCode}
                  nickname={nickname}
                />
              ) : memberCount !== undefined ? (
                <div className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary">
                  <span>{memberCount} Players</span>
                </div>
              ) : null}

              {/* Leave Room Action */}
              {onLeaveRoom ? (
                <button
                  onClick={onLeaveRoom}
                  title="Leave Room"
                  aria-label="Leave Room"
                  className="min-h-[38px] min-w-[38px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center p-2 rounded-xl text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Wifi className="h-3.5 w-3.5 text-brand-emerald" />
              <span className="hidden sm:inline">Online</span>
            </div>
          )}

          {/* Sound Mute / Unmute Toggle */}
          <button
            onClick={() => toggleSoundMuted()}
            title={muted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            aria-label={muted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            className={cn(
              "min-h-[38px] min-w-[38px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer",
              muted
                ? "text-text-muted/60 hover:text-text-muted hover:bg-bg-surface"
                : "text-brand-violet hover:text-brand-indigo hover:bg-brand-violet/10"
            )}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
});
