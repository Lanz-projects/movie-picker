"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search TMDB by movie title, director, or actor...",
  isLoading = false,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && value) {
      e.preventDefault();
      onClear();
    }
  };

  const handleClearClick = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      {/* Left Search Icon */}
      <div className="pointer-events-none absolute left-4 flex items-center text-text-muted">
        <Search className="h-5 w-5" />
      </div>

      {/* Main Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search movies"
        className="w-full rounded-2xl border border-border-subtle bg-bg-surface py-3.5 pl-12 pr-12 text-sm sm:text-base text-text-main placeholder:text-text-muted shadow-inner shadow-black/20 transition-colors focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
      />

      {/* Right Indicator: Loading Spinner or Clear Button */}
      <div className="absolute right-3.5 flex items-center gap-1.5">
        {isLoading ? (
          <Loader2
            data-testid="search-spinner"
            className="h-5 w-5 animate-spin text-brand-indigo"
          />
        ) : null}

        {value && !isLoading ? (
          <button
            type="button"
            onClick={handleClearClick}
            aria-label="Clear search"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-elevated hover:text-text-main transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
