"use client";

import * as React from "react";
import { X, FastForward, Star, Heart, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwipeActionsProps {
  onPass: () => void;
  onSkip: () => void;
  onSuperlike: () => void;
  onLike: () => void;
  onInfo: () => void;
  disabled?: boolean;
  className?: string;
}

export const SwipeActions = React.memo(function SwipeActions({
  onPass,
  onSkip,
  onSuperlike,
  onLike,
  onInfo,
  disabled = false,
  className,
}: SwipeActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 sm:gap-4 py-1.5 sm:py-3 select-none",
        className
      )}
      role="toolbar"
      aria-label="Swipe actions"
    >
      {/* 1. Pass Button (❌) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onPass}
          disabled={disabled}
          aria-label="Pass (Left Arrow)"
          title="Pass / Nope (←)"
          className="group relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-brand-coral/40 bg-bg-surface text-brand-coral shadow-lg shadow-black/40 transition-all duration-150 hover:scale-110 hover:border-brand-coral hover:bg-brand-coral/15 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7 transition-transform group-hover:rotate-12" />
        </button>
        <span className="text-[10px] font-semibold text-text-muted opacity-70">← Pass</span>
      </div>

      {/* 2. Skip Button (⏭️) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          aria-label="Skip (Space)"
          title="Skip movie (Space / ↓)"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary shadow-md transition-all duration-150 hover:scale-110 hover:border-white/20 hover:bg-bg-elevated active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <FastForward className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-0.5 text-text-muted group-hover:text-text-main" />
        </button>
        <span className="text-[10px] font-semibold text-text-muted opacity-70">Skip</span>
      </div>

      {/* 3. Superlike Hero Button (⭐) */}
      <div className="flex flex-col items-center gap-1 -translate-y-1">
        <button
          type="button"
          onClick={onSuperlike}
          disabled={disabled}
          aria-label="Superlike (Up Arrow)"
          title="Superlike +2 pts (↑)"
          className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-brand-amber/50 bg-bg-surface text-brand-amber shadow-xl shadow-brand-amber/20 transition-all duration-150 hover:scale-115 hover:border-brand-amber hover:bg-brand-amber/20 hover:shadow-brand-amber/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Star className="h-7 w-7 sm:h-8 sm:w-8 fill-brand-amber transition-transform group-hover:scale-110" />
        </button>
        <span className="text-[10px] font-bold text-brand-amber opacity-90">↑ Super</span>
      </div>

      {/* 4. Like Button (💚) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          disabled={disabled}
          aria-label="Like (Right Arrow)"
          title="Like movie (→)"
          className="group relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-brand-emerald/40 bg-bg-surface text-brand-emerald shadow-lg shadow-black/40 transition-all duration-150 hover:scale-110 hover:border-brand-emerald hover:bg-brand-emerald/15 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Heart className="h-6 w-6 sm:h-7 sm:w-7 fill-brand-emerald transition-transform group-hover:scale-110" />
        </button>
        <span className="text-[10px] font-semibold text-text-muted opacity-70">Like →</span>
      </div>

      {/* 5. Info Button (ℹ️) */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onInfo}
          disabled={disabled}
          aria-label="Movie Info (i)"
          title="Inspect details (i / Enter)"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary shadow-md transition-all duration-150 hover:scale-110 hover:border-white/20 hover:bg-bg-elevated active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-brand-indigo group-hover:text-brand-violet transition-colors" />
        </button>
        <span className="text-[10px] font-semibold text-text-muted opacity-70">Info</span>
      </div>
    </div>
  );
});
