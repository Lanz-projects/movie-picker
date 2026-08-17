"use client";

import * as React from "react";
import confetti from "canvas-confetti";

export interface ConfettiCelebrationProps {
  isUnanimous?: boolean;
  durationMs?: number;
}

export const ConfettiCelebration = React.memo(function ConfettiCelebration({
  isUnanimous = false,
  durationMs = 3000,
}: ConfettiCelebrationProps) {
  React.useEffect(() => {
    // Accessibility check: Skip animation if user prefers reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const end = Date.now() + durationMs;
    const colors = isUnanimous
      ? ["#10B981", "#F59E0B", "#8B5CF6", "#6366F1", "#EC4899"]
      : ["#F59E0B", "#6366F1", "#8B5CF6", "#38BDF8"];

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
