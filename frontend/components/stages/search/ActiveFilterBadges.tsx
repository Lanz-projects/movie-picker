"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { FilterState } from "./SearchFilterModal";

export interface ActiveFilterBadgesProps {
  filters: FilterState;
  onRemoveProvider: () => void;
  onRemoveDecade: () => void;
  onRemoveRating: () => void;
  onRemoveRuntime: () => void;
  onRemoveLanguage: () => void;
}

export function ActiveFilterBadges({
  filters,
  onRemoveProvider,
  onRemoveDecade,
  onRemoveRating,
  onRemoveRuntime,
  onRemoveLanguage,
}: ActiveFilterBadgesProps) {
  return (
    <>
      {filters.provider ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 animate-in fade-in">
          <span>📺 {filters.provider}</span>
          <button
            type="button"
            onClick={onRemoveProvider}
            aria-label={`Remove ${filters.provider} filter`}
            className="hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}

      {filters.decade ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-violet/15 text-brand-violet border border-brand-violet/30 animate-in fade-in">
          <span>📅 {filters.decade === "vintage" ? "Vintage" : filters.decade}</span>
          <button
            type="button"
            onClick={onRemoveDecade}
            aria-label={`Remove ${filters.decade} filter`}
            className="hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}

      {filters.minRating ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-amber/15 text-brand-amber border border-brand-amber/30 animate-in fade-in">
          <span>⭐ {filters.minRating}+</span>
          <button
            type="button"
            onClick={onRemoveRating}
            aria-label="Remove rating filter"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}

      {filters.minRuntime !== null || filters.maxRuntime !== null ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-coral/15 text-brand-coral border border-brand-coral/30 animate-in fade-in">
          <span>
            ⏱️ {filters.maxRuntime && !filters.minRuntime ? "<90m" : filters.minRuntime && filters.maxRuntime ? "90-120m" : ">120m"}
          </span>
          <button
            type="button"
            onClick={onRemoveRuntime}
            aria-label="Remove runtime filter"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}

      {filters.language ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/30 animate-in fade-in">
          <span>🌐 {filters.language.toUpperCase()}</span>
          <button
            type="button"
            onClick={onRemoveLanguage}
            aria-label="Remove language filter"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : null}
    </>
  );
}
