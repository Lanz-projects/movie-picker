"use client";

import * as React from "react";

export interface UseKeyboardSwipeOptions {
  onPass?: () => void;
  onLike?: () => void;
  onSuperlike?: () => void;
  onSkip?: () => void;
  onInfo?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardSwipe({
  onPass,
  onLike,
  onSuperlike,
  onSkip,
  onInfo,
  onEscape,
  enabled = true,
}: UseKeyboardSwipeOptions) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard shortcuts if user is typing in an input
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          onPass?.();
          break;

        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          onLike?.();
          break;

        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          onSuperlike?.();
          break;

        case " ":
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          onSkip?.();
          break;

        case "i":
        case "I":
        case "Enter":
          e.preventDefault();
          onInfo?.();
          break;

        case "Escape":
          e.preventDefault();
          onEscape?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onPass, onLike, onSuperlike, onSkip, onInfo, onEscape]);
}
