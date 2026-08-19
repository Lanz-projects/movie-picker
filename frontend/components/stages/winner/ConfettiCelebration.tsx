"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { playWinnerFanfare } from "@/lib/audio/sounds";

export interface ConfettiCelebrationProps {
  isUnanimous?: boolean;
  durationMs?: number;
}

export const ConfettiCelebration = React.memo(function ConfettiCelebration({
  isUnanimous = false,
  durationMs = 3000,
}: ConfettiCelebrationProps) {
  React.useEffect(() => {
    // Play celebratory winner fanfare sound
    playWinnerFanfare();

    // Accessibility check: Skip animation if user prefers reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const end = Date.now() + durationMs;
    // Golden cinema & neon theater palettes
    const colors = isUnanimous
      ? ["#FFD700", "#F59E0B", "#10B981", "#34D399", "#FDE047", "#FFFFFF"]
      : ["#FFD700", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#F43F5E"];

    // Initial celebratory pop
    try {
      confetti({
        particleCount: isUnanimous ? 120 : 80,
        spread: 80,
        origin: { y: 0.6 },
        colors,
        disableForReducedMotion: true,
      });
    } catch {
      // Safe fallback if canvas is unsupported
    }

    // Interval for side cannons
    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      try {
        // Left cannon
        confetti({
          particleCount: isUnanimous ? 35 : 25,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
          disableForReducedMotion: true,
        });

        // Right cannon
        confetti({
          particleCount: isUnanimous ? 35 : 25,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
          disableForReducedMotion: true,
        });
      } catch {
        clearInterval(interval);
      }
    }, 450);

    return () => {
      clearInterval(interval);
    };
  }, [isUnanimous, durationMs]);

  return null;
});
