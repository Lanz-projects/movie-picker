"use client";

import * as React from "react";
import { Sparkles, X, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { VibePresetChips } from "./vibe/VibePresetChips";
import { VibeCardItem } from "./vibe/VibeCardItem";
import { useVibeRecommendations } from "./vibe/useVibeRecommendations";
import type { MovieDto } from "@/types";

export interface VibeMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string;
  deckMovieIds: number[];
  onToggleDeck: (movie: MovieDto) => void;
  isDeckFull: boolean;
}

const PRESET_VIBES = [
  "90s Nostalgia Thriller",
  "Cozy Feel-Good Comfort",
  "Mind-Bending Sci-Fi",
  "Autumn Mystery & Whodunit",
  "Late Night Laughs",
  "High-Octane Action",
];

export function VibeMatcherModal({
  isOpen,
  onClose,
  roomCode,
  deckMovieIds,
  onToggleDeck,
  isDeckFull,
}: VibeMatcherModalProps) {
  const {
    prompt,
    setPrompt,
    recommendations,
    replyMessage,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    cooldownSeconds,
    fetchRecommendations,
    loadMore,
  } = useVibeRecommendations({ roomCode, deckMovieIds });

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
    fetchRecommendations(prompt, 1);
  };

  const handleSelectPresetVibe = (preset: string) => {
    if (cooldownSeconds > 0) return;
    setPrompt(preset);
    fetchRecommendations(preset, 1);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vibe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-bg-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border-subtle bg-bg-surface/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-violet/15 border border-brand-violet/30 text-brand-violet">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="vibe-modal-title" className="font-display text-lg sm:text-xl font-bold text-text-main">
                Match the Vibe
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary">
                Describe the mood or pick a theme for your movie night.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close vibe matcher"
            className="p-1.5 rounded-xl text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Preset Chips */}
          <VibePresetChips
            presets={PRESET_VIBES}
            onSelectPreset={handleSelectPresetVibe}
            disabled={isLoading || cooldownSeconds > 0}
          />

          {/* Search Input Bar */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. cozy rainy day mystery with great plot twists..."
              maxLength={500}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-bg-surface border border-border-subtle focus:border-brand-violet/60 focus:outline-none text-sm text-text-main placeholder:text-text-muted transition-colors"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading || cooldownSeconds > 0}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-indigo/90 hover:to-brand-violet/90 text-white font-semibold text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Curating...</span>
                </>
              ) : cooldownSeconds > 0 ? (
                <span>Wait {cooldownSeconds}s</span>
              ) : (
                <span>Find Matches</span>
              )}
            </button>
          </form>

          {/* Error Banner */}
          {error ? (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs sm:text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Curator Reply Message */}
          {replyMessage ? (
            <div className="p-3.5 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 text-xs sm:text-sm text-text-main">
              <span className="font-semibold text-brand-violet block mb-1">Film Curator:</span>
              <p className="text-text-secondary">{replyMessage}</p>
            </div>
          ) : null}

          {/* Recommendations List */}
          {recommendations.length > 0 ? (
            <div className="flex flex-col gap-3 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Curated Recommendations
              </span>

              <div className="flex flex-col gap-2.5">
                {recommendations.map((movie) => (
                  <VibeCardItem
                    key={movie.tmdbId || movie.title}
                    movie={movie}
                    inDeck={deckMovieIds.includes(movie.tmdbId)}
                    isDeckFull={isDeckFull}
                    onToggleDeck={onToggleDeck}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Load More Movies</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
