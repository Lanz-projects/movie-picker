"use client";

import * as React from "react";
import { Sparkles, Send, Loader2, User, RefreshCw, Trash2, Bot, AlertCircle } from "lucide-react";
import { VibeCardItem } from "./vibe/VibeCardItem";
import { useAiConversation } from "./vibe/useAiConversation";
import type { MovieDto } from "@/types";

export interface AiConciergeTabProps {
  roomCode?: string;
  deckMovieIds: number[];
  onToggleDeck: (movie: MovieDto) => void;
  isDeckFull: boolean;
}

const PRESET_VIBES = [
  "Mind-Bending Sci-Fi",
  "Cozy Rainy Night",
  "Witty Whodunnit",
  "90s Action Comedy",
  "Late Night Laughs",
  "Cyberpunk Dystopia",
];

export function AiConciergeTab({
  roomCode,
  deckMovieIds,
  onToggleDeck,
  isDeckFull,
}: AiConciergeTabProps) {
  const {
    turns,
    prompt,
    setPrompt,
    isGenerating,
    error,
    cooldownSeconds,
    sendPrompt,
    loadMoreForTurn,
    clearConversation,
  } = useAiConversation({ roomCode, deckMovieIds });

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever a new turn or loading bubble appears
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating || cooldownSeconds > 0) return;
    sendPrompt();
  };

  const handleSelectPreset = (presetText: string) => {
    if (isGenerating || cooldownSeconds > 0) return;
    sendPrompt(presetText);
  };

  return (
    <div className="w-full flex flex-col rounded-3xl bg-bg-card border border-brand-violet/25 shadow-2xl overflow-hidden animate-stage-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border-subtle bg-bg-surface/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-indigo text-white shadow-md shadow-brand-violet/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-text-main flex items-center gap-2">
              Movie Concierge AI
            </h2>
            <p className="text-xs text-text-muted">
              Curating group movie night recommendations powered by Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-violet/10 border border-brand-violet/25 text-brand-violet">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
            Gemini 3.5 Flash-Lite
          </span>

          {turns.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              title="Clear conversation history"
              aria-label="Clear conversation history"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Conversation Feed */}
      <div
        role="log"
        aria-live="polite"
        aria-busy={isGenerating}
        className="flex-1 flex flex-col gap-5 p-4 sm:p-6 min-h-0 max-h-[50vh] sm:max-h-[600px] overflow-y-auto scrollbar-thin"
      >
        {/* Initial AI Welcome Message */}
        <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-violet/20 border border-brand-violet/40 text-brand-violet shrink-0 mt-0.5">
            <Bot className="w-4 h-4" />
          </div>
          <div className="p-4 rounded-2xl rounded-tl-sm bg-bg-surface border border-border-subtle text-sm text-text-main leading-relaxed shadow-sm">
            Hey there! Not sure what to nominate? Tell me what vibe, genre, or mood you want (or pick a quick suggestion below), and I&apos;ll curate real movies for your party.
          </div>
        </div>

        {/* Conversation Turns */}
        {turns.map((turn, index) => (
          <div key={turn.id} className="flex flex-col gap-4">
            {/* User Message Bubble */}
            <div className="flex items-start justify-end gap-3 self-end max-w-[85%] sm:max-w-[75%]">
              <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-sm bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-sm font-medium leading-relaxed shadow-md shadow-brand-indigo/15">
                {turn.prompt}
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle text-brand-cyan shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* AI Response Bubble */}
            <div className="flex items-start gap-3 max-w-full sm:max-w-[95%]">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-violet/20 border border-brand-violet/40 text-brand-violet shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 p-4 sm:p-5 rounded-2xl rounded-tl-sm bg-bg-surface border border-border-subtle shadow-sm flex flex-col gap-3.5">
                <p className="text-sm text-text-main font-medium leading-relaxed">
                  {turn.replyMessage}
                </p>

                {/* Result Count Badge */}
                {turn.movies.length > 0 && (
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-violet/15 border border-brand-violet/30 text-brand-violet">
                      <Sparkles className="w-3 h-3" />
                      {turn.totalResultsCount || turn.movies.length} Results Found
                    </span>
                    <span className="text-xs text-text-muted">
                      Prompt #{index + 1}
                    </span>
                  </div>
                )}

                {/* Movie Grid */}
                {turn.movies.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {turn.movies.map((movie) => {
                      const inDeck = deckMovieIds.includes(movie.tmdbId);
                      return (
                        <VibeCardItem
                          key={`${turn.id}-${movie.tmdbId || movie.title}`}
                          movie={movie}
                          inDeck={inDeck}
                          isDeckFull={isDeckFull}
                          onToggleDeck={onToggleDeck}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Turn-Level Load More Button */}
                {turn.hasMore && (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => loadMoreForTurn(turn.id)}
                      disabled={turn.isLoadingMore}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle hover:border-brand-violet/40 text-text-secondary hover:text-text-main transition-colors cursor-pointer"
                    >
                      {turn.isLoadingMore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-violet" />
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-brand-violet" />
                          <span>Load more for this prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Shimmer / Skeleton Bubble when generating */}
        {isGenerating && (
          <div className="flex items-start gap-3 max-w-[85%] animate-fade-in">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-violet/20 border border-brand-violet/40 text-brand-violet shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-bg-surface border border-brand-violet/30 shadow-sm flex items-center gap-3 text-sm text-brand-violet font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-brand-violet" />
              <span>Curating recommendations with Gemini 3.5 Flash-Lite...</span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Mood Chips */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-t border-border-subtle bg-bg-surface/30 overflow-x-auto scroll-mask-right scrollbar-none pb-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0 mr-1">
          Suggestions:
        </span>
        {PRESET_VIBES.map((vibe) => (
          <button
            key={vibe}
            type="button"
            onClick={() => handleSelectPreset(vibe)}
            disabled={isGenerating || cooldownSeconds > 0}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium bg-bg-surface border border-border-subtle hover:border-brand-violet/40 hover:bg-bg-elevated text-text-secondary hover:text-text-main whitespace-nowrap transition-colors disabled:opacity-50 cursor-pointer"
          >
            {vibe}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-t border-border-subtle bg-bg-surface/60 backdrop-blur-md"
      >
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the Movie Concierge (e.g., 'Late 90s heist comedies' or 'Cozy studio ghibli vibe')..."
          maxLength={500}
          disabled={isGenerating}
          aria-label="Ask Movie Concierge"
          className="flex-1 px-4 py-3 rounded-2xl bg-bg-card border border-border-subtle focus:border-brand-violet/60 focus:outline-none text-base sm:text-sm text-text-main placeholder:text-text-muted transition-colors shadow-inner"
        />

        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating || cooldownSeconds > 0}
          aria-label={isGenerating ? "Asking AI" : "Ask AI"}
          className="min-h-[44px] px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-indigo/90 hover:to-brand-violet/90 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-brand-indigo/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Asking...</span>
            </>
          ) : cooldownSeconds > 0 ? (
            <span>Wait {cooldownSeconds}s</span>
          ) : (
            <>
              <span>Ask AI</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
