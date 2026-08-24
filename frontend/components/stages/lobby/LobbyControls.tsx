"use client";

import * as React from "react";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface LobbyControlsProps {
  isHost: boolean;
  onStartSearch: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  isLoading?: boolean;
}

export function LobbyControls({
  isHost,
  onStartSearch,
  onLeaveRoom,
  isLoading = false,
}: LobbyControlsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Host Controls */}
      {isHost ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onStartSearch}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full h-12 text-sm sm:text-base shadow-lg shadow-brand-indigo/30"
          >
            <Sparkles className="h-4 w-4 mr-2 text-brand-amber" />
            Start Adding Movies
          </Button>

          <p className="text-center text-xs text-text-muted">
            You can start once your group is ready, or let members join while picking movies.
          </p>
        </div>
      ) : (
        /* Guest Waiting State */
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface/40 p-4 text-center">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-violet opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-violet" />
          </span>
          <p className="text-xs sm:text-sm font-medium text-text-secondary">
            Waiting for host to start movie selection...
          </p>
        </div>
      )}

      {/* Leave Room Button */}
      <Button
        type="button"
        variant="ghost"
        size="md"
        onClick={onLeaveRoom}
        disabled={isLoading}
        className="w-full text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 transition-colors"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Leave Room
      </Button>
    </div>
  );
}
