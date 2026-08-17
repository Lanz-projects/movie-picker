"use client";

import * as React from "react";
import { RotateCcw, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface WinnerControlsProps {
  isHost: boolean;
  isLoading?: boolean;
  onPlayAgain: () => void;
  onResetToLobby: () => void;
  className?: string;
}

export const WinnerControls = React.memo(function WinnerControls({
  isHost,
  isLoading = false,
  onPlayAgain,
  onResetToLobby,
  className,
}: WinnerControlsProps) {
  if (!isHost) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-card/70 py-3.5 px-4 text-xs font-medium text-text-muted shadow-sm max-w-2xl mx-auto w-full",
          className
        )}
      >
        <Clock className="h-4 w-4 animate-pulse text-brand-indigo" />
        <span>Waiting for host to start another round...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto w-full",
        className
      )}
    >
      <Button
        variant="primary"
        size="md"
        className="w-full sm:flex-1 gap-2 shadow-lg shadow-brand-indigo/20"
        onClick={onPlayAgain}
        disabled={isLoading}
      >
        <RotateCcw className="h-4 w-4" />
        <span>Play Again (New Nominations)</span>
      </Button>

      <Button
        variant="secondary"
        size="md"
        className="w-full sm:w-auto gap-2"
        onClick={onResetToLobby}
        disabled={isLoading}
      >
        <Users className="h-4 w-4" />
        <span>Return to Lobby</span>
      </Button>
    </div>
  );
});
