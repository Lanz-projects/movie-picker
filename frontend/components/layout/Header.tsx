"use client";

import * as React from "react";
import { Clapperboard, Copy, Check, Users, Crown, Wifi, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  roomCode?: string;
  nickname?: string;
  isHost?: boolean;
  memberCount?: number;
  isConnected?: boolean;
  onLeaveRoom?: () => void;
}

export function Header({
  roomCode,
  nickname,
  isHost = false,
  memberCount,
  isConnected = true,
  onLeaveRoom,
}: HeaderProps) {
  const [copied, setCopied] = React.useState(false);

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
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-brand-indigo to-brand-violet text-white shadow-md shadow-brand-indigo/30">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              What Should We Watch
            </span>
          </div>
        </div>

        {/* Dynamic Room & User State */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {roomCode ? (
            <>
              {/* Room Code Badge with Copy */}
              <button
                onClick={handleCopyCode}
                title="Click to copy Room Code"
                className={cn(
                  "group flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-main transition-all duration-200 hover:border-brand-violet hover:bg-bg-elevated cursor-pointer active:scale-95"
                )}
              >
                <span className="text-text-muted">ROOM</span>
                <span className="font-mono font-bold tracking-wider text-brand-violet group-hover:text-white">
                  {roomCode}
                </span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-brand-emerald" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-text-muted group-hover:text-text-secondary" />
                )}
              </button>

              {/* Member Counter */}
              {memberCount !== undefined ? (
                <div className="hidden items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary sm:flex">
                  <Users className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>{memberCount}</span>
                </div>
              ) : null}

              {/* User Identity / Host status */}
              {nickname ? (
                <div className="flex items-center gap-1.5">
                  <span className="max-w-25 truncate text-xs font-semibold text-text-main sm:max-w-35">
                    {nickname}
                  </span>
                  {isHost ? (
                    <Badge variant="host" size="sm">
                      <Crown className="h-3 w-3" />
                      <span>Host</span>
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              {/* Leave Room Action */}
              {onLeaveRoom ? (
                <button
                  onClick={onLeaveRoom}
                  title="Leave Room"
                  className="p-1.5 rounded-lg text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : null}

              {/* Connection Dot */}
              <div
                className="flex items-center"
                title={isConnected ? "Connected to Room" : "Reconnecting..."}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full ring-2 ring-bg-base transition-colors",
                    isConnected ? "bg-brand-emerald animate-pulse" : "bg-brand-coral"
                  )}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Wifi className="h-3.5 w-3.5 text-brand-emerald" />
              <span className="hidden sm:inline">Online</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
