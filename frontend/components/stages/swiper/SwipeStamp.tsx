"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { VoteType } from "@/types";

export interface SwipeStampProps {
  type: VoteType;
  opacity?: number;
  className?: string;
}

export function SwipeStamp({ type, opacity = 1, className }: SwipeStampProps) {
  if (opacity <= 0) return null;

  const stampConfig = {
    LIKE: {
      text: "LIKE",
      className:
        "right-6 top-8 rotate-[14deg] border-brand-emerald text-brand-emerald shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    },
    PASS: {
      text: "PASS",
      className:
        "left-6 top-8 rotate-[-14deg] border-brand-coral text-brand-coral shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    },
    SUPERLIKE: {
      text: "SUPERLIKE",
      className:
        "left-1/2 -translate-x-1/2 top-8 rotate-0 border-brand-amber text-brand-amber shadow-[0_0_25px_rgba(245,158,11,0.5)] bg-black/60",
    },
  };

  const config = stampConfig[type];

  return (
    <div
      style={{ opacity }}
      className={cn(
        "pointer-events-none absolute z-30 select-none rounded-xl border-[3.5px] px-4 py-1.5 font-display text-2xl sm:text-3xl font-black uppercase tracking-wider backdrop-blur-sm transition-opacity duration-75",
        config.className,
        className
      )}
      aria-hidden="true"
    >
      {config.text}
    </div>
  );
}
