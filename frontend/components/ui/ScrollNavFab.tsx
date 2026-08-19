"use client";

import * as React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScrollNavFabProps {
  threshold?: number;
  className?: string;
}

export function ScrollNavFab({ threshold = 350, className }: ScrollNavFabProps) {
  const [currentScrollY, setCurrentScrollY] = React.useState<number>(0);
  const [savedScrollY, setSavedScrollY] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setCurrentScrollY(currentY);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = React.useCallback(() => {
    const currentY = window.scrollY;
    setSavedScrollY(currentY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReturnToPosition = React.useCallback(() => {
    if (savedScrollY === null) return;

    const scrollHeight = document.documentElement?.scrollHeight || 0;
    const innerHeight = window.innerHeight || 0;
    const maxScroll = scrollHeight > innerHeight ? scrollHeight - innerHeight : savedScrollY;
    const targetY = Math.min(savedScrollY, maxScroll);

    window.scrollTo({ top: targetY, behavior: "smooth" });
    setSavedScrollY(null);
  }, [savedScrollY]);

  const isReturnMode = savedScrollY !== null && currentScrollY <= threshold;
  const isVisible = currentScrollY > threshold || isReturnMode;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-50 transition-all duration-300 animate-in fade-in zoom-in-95",
        className
      )}
    >
      {isReturnMode ? (
        <button
          type="button"
          onClick={handleReturnToPosition}
          aria-label="Return to previous scroll position"
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-bg-surface/90 hover:bg-bg-elevated border border-brand-cyan/40 text-brand-cyan text-xs sm:text-sm font-semibold shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-brand-cyan/20"
        >
          <ArrowDown className="h-4 w-4 animate-bounce" />
          <span>Return</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleScrollToTop}
          aria-label="Scroll to top of page"
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-bg-surface/90 hover:bg-bg-elevated border border-border-subtle hover:border-brand-violet/40 text-text-main text-xs sm:text-sm font-semibold shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowUp className="h-4 w-4 text-brand-cyan" />
          <span>Top</span>
        </button>
      )}
    </div>
  );
}
