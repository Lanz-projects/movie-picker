"use client";

import * as React from "react";

export interface VibePresetChipsProps {
  presets: string[];
  onSelectPreset: (preset: string) => void;
  disabled?: boolean;
}

export function VibePresetChips({
  presets,
  onSelectPreset,
  disabled = false,
}: VibePresetChipsProps) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 block">
        Suggested Vibes
      </span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSelectPreset(preset)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-main transition-colors disabled:opacity-50 cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
