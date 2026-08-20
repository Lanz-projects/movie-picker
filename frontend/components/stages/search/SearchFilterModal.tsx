"use client";

import * as React from "react";
import { X, RotateCcw, Check, SlidersHorizontal, Tv, Calendar, Star, Clock, Globe, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FilterState {
  provider: string | null;
  decade: string | null;
  minRating: number | null;
  minRuntime: number | null;
  maxRuntime: number | null;
  language: string | null;
  sortBy: string;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  provider: null,
  decade: null,
  minRating: null,
  minRuntime: null,
  maxRuntime: null,
  language: null,
  sortBy: "popularity.desc",
};

export const STREAMING_OPTIONS = [
  { label: "All Platforms", value: null },
  { label: "Netflix", value: "Netflix" },
  { label: "Prime Video", value: "Prime Video" },
  { label: "Disney+", value: "Disney+" },
  { label: "Max", value: "Max" },
  { label: "Apple TV+", value: "Apple TV+" },
  { label: "Hulu", value: "Hulu" },
  { label: "Paramount+", value: "Paramount+" },
  { label: "Peacock", value: "Peacock" },
];

export const DECADE_OPTIONS = [
  { label: "All Eras", value: null },
  { label: "2020s (Modern)", value: "2020s" },
  { label: "2010s", value: "2010s" },
  { label: "2000s", value: "2000s" },
  { label: "90s Classics", value: "90s" },
  { label: "80s Nostalgia", value: "80s" },
  { label: "Vintage (<1980)", value: "vintage" },
];

export const RATING_OPTIONS = [
  { label: "Any Rating", value: null },
  { label: "⭐ 7.0+ (Good)", value: 7.0 },
  { label: "⭐ 8.0+ (Acclaimed)", value: 8.0 },
];

export const RUNTIME_OPTIONS = [
  { label: "Any Duration", min: null, max: null },
  { label: "⚡ Quick (< 90 min)", min: null, max: 90 },
  { label: "🍿 Standard (90–120 min)", min: 90, max: 120 },
  { label: "🎬 Epic (> 120 min)", min: 120, max: null },
];

export const LANGUAGE_OPTIONS = [
  { label: "All Languages", value: null },
  { label: "English", value: "en" },
  { label: "Korean (한국어)", value: "ko" },
  { label: "Japanese (日本語)", value: "ja" },
  { label: "Spanish (Español)", value: "es" },
  { label: "French (Français)", value: "fr" },
];

export const SORT_OPTIONS = [
  { label: "🔥 Most Popular", value: "popularity.desc" },
  { label: "⭐ Highest Rated", value: "vote_average.desc" },
  { label: "🆕 Newest Releases", value: "primary_release_date.desc" },
  { label: "💰 Top Box Office", value: "revenue.desc" },
];

export interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.provider) count++;
  if (filters.decade) count++;
  if (filters.minRating) count++;
  if (filters.minRuntime !== null || filters.maxRuntime !== null) count++;
  if (filters.language) count++;
  if (filters.sortBy && filters.sortBy !== "popularity.desc") count++;
  return count;
}

export function SearchFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
}: SearchFilterModalProps) {
  const [prevFilters, setPrevFilters] = React.useState<FilterState>(filters);
  const [draft, setDraft] = React.useState<FilterState>(filters);

  // Sync draft when parent filters change without extra render cycle
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setDraft(filters);
  }

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCount = countActiveFilters(draft);

  const handleReset = () => {
    setDraft(DEFAULT_FILTER_STATE);
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl border-t sm:border border-border-subtle bg-bg-surface shadow-2xl shadow-black/80 overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 id="filter-modal-title" className="font-display font-bold text-base sm:text-lg text-text-main">
                Discovery Filters
              </h3>
              <p className="text-xs text-text-muted">
                Fine-tune movie suggestions for your watch party
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:bg-bg-elevated hover:text-text-main transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 no-scrollbar">
          {/* 1. Streaming Platforms */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              <Tv className="h-3.5 w-3.5 text-brand-cyan" />
              <span>Streaming Platform</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STREAMING_OPTIONS.map((opt) => {
                const isSelected = draft.provider === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, provider: opt.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-brand-cyan/20 border border-brand-cyan text-brand-cyan shadow-sm shadow-brand-cyan/20"
                        : "bg-bg-elevated hover:bg-bg-surface text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Release Era / Decade */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              <Calendar className="h-3.5 w-3.5 text-brand-violet" />
              <span>Release Era / Decade</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DECADE_OPTIONS.map((opt) => {
                const isSelected = draft.decade === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, decade: opt.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-brand-violet/20 border border-brand-violet text-brand-violet shadow-sm shadow-brand-violet/20"
                        : "bg-bg-elevated hover:bg-bg-surface text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Minimum Rating */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              <Star className="h-3.5 w-3.5 text-brand-amber" />
              <span>Minimum Rating</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((opt) => {
                const isSelected = draft.minRating === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, minRating: opt.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-brand-amber/20 border border-brand-amber text-brand-amber shadow-sm shadow-brand-amber/20"
                        : "bg-bg-elevated hover:bg-bg-surface text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Runtime / Duration */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              <Clock className="h-3.5 w-3.5 text-brand-coral" />
              <span>Runtime / Duration</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {RUNTIME_OPTIONS.map((opt) => {
                const isSelected = draft.minRuntime === opt.min && draft.maxRuntime === opt.max;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, minRuntime: opt.min, maxRuntime: opt.max }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-brand-coral/20 border border-brand-coral text-brand-coral shadow-sm shadow-brand-coral/20"
                        : "bg-bg-elevated hover:bg-bg-surface text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Original Language */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              <Globe className="h-3.5 w-3.5 text-brand-indigo" />
              <span>Original Language</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = draft.language === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, language: opt.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-brand-indigo/20 border border-brand-indigo text-brand-indigo shadow-sm shadow-brand-indigo/20"
                        : "bg-bg-elevated hover:bg-bg-surface text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Sort By */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-brand-cyan" />
              <span>Sort Results By</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = draft.sortBy === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, sortBy: opt.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-brand-violet/30 to-brand-cyan/30 border border-brand-cyan/60 text-text-main shadow-sm"
                        : "bg-bg-elevated hover:bg-bg-surface text-text-muted hover:text-text-secondary border border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border-subtle bg-bg-elevated/40">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApply}
              className="gap-2 px-5"
            >
              <Check className="h-4 w-4" />
              <span>Apply Filters {activeCount > 0 ? `(${activeCount})` : ""}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
