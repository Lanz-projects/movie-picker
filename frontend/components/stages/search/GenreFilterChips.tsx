"use client";

import * as React from "react";

export interface GenreOption {
  label: string;
  value: string | null; // null represents "Trending / All"
  icon: string;
}

export const GENRE_OPTIONS: GenreOption[] = [
  { label: "Trending", value: null, icon: "🔥" },
  { label: "Action", value: "Action", icon: "💥" },
  { label: "Comedy", value: "Comedy", icon: "😂" },
  { label: "Horror", value: "Horror", icon: "👻" },
  { label: "Sci-Fi", value: "Sci-Fi", icon: "🚀" },
  { label: "Romance", value: "Romance", icon: "❤️" },
  { label: "Animation", value: "Animation", icon: "🎨" },
  { label: "Thriller", value: "Thriller", icon: "🧠" },
  { label: "Drama", value: "Drama", icon: "🎭" },
  { label: "Mystery", value: "Mystery", icon: "🔍" },
  { label: "Fantasy", value: "Fantasy", icon: "🧙" },
  { label: "Western", value: "Western", icon: "🤠" },
];

export interface GenreFilterChipsProps {
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  disabled?: boolean;
}

export function GenreFilterChips({
  selectedGenre,
  onSelectGenre,
  disabled = false,
}: GenreFilterChipsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max px-1">
        {GENRE_OPTIONS.map((genre) => {
          const isSelected = selectedGenre === genre.value;

          return (
            <button
              key={genre.label}
              type="button"
              disabled={disabled}
              onClick={() => onSelectGenre(genre.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-lg shadow-brand-violet/25 ring-1 ring-white/30 scale-105"
                  : "bg-bg-surface/80 hover:bg-bg-surface text-text-secondary hover:text-text-main border border-border-subtle hover:border-border-muted"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-sm leading-none">{genre.icon}</span>
              <span>{genre.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
