"use client";

import * as React from "react";
import { Tv } from "lucide-react";

export interface StreamingOption {
  label: string;
  value: string | null; // null represents "All Providers"
  accentColor: string;
}

export const STREAMING_OPTIONS: StreamingOption[] = [
  { label: "All Platforms", value: null, accentColor: "from-zinc-500 to-zinc-700" },
  { label: "Netflix", value: "Netflix", accentColor: "from-red-600 to-red-800" },
  { label: "Prime Video", value: "Prime Video", accentColor: "from-sky-500 to-blue-700" },
  { label: "Disney+", value: "Disney+", accentColor: "from-blue-600 to-indigo-800" },
  { label: "Max", value: "Max", accentColor: "from-purple-600 to-indigo-900" },
  { label: "Apple TV+", value: "Apple TV+", accentColor: "from-zinc-400 to-zinc-600" },
  { label: "Hulu", value: "Hulu", accentColor: "from-emerald-500 to-green-700" },
  { label: "Paramount+", value: "Paramount+", accentColor: "from-blue-500 to-cyan-700" },
];

export interface StreamingFilterBarProps {
  selectedProvider: string | null;
  onSelectProvider: (provider: string | null) => void;
  disabled?: boolean;
}

export function StreamingFilterBar({
  selectedProvider,
  onSelectProvider,
  disabled = false,
}: StreamingFilterBarProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max px-1">
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium pr-1">
          <Tv className="h-3.5 w-3.5 text-brand-cyan" />
          <span>Stream:</span>
        </div>

        {STREAMING_OPTIONS.map((provider) => {
          const isSelected = selectedProvider === provider.value;

          return (
            <button
              key={provider.label}
              type="button"
              disabled={disabled}
              onClick={() => onSelectProvider(provider.value)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-brand-cyan/20 border border-brand-cyan/60 text-brand-cyan shadow-sm shadow-brand-cyan/20"
                  : "bg-bg-surface/50 hover:bg-bg-surface/90 text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
              }`}
              aria-pressed={isSelected}
            >
              <span>{provider.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
