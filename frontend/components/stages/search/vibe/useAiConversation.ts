"use client";

import * as React from "react";
import { getAiRecommendations } from "@/lib/api/ai";
import type { AiChatTurn, AiChatMessage, AiRecommendationResponse } from "@/types";

export interface UseAiConversationOptions {
  roomCode?: string;
  deckMovieIds: number[];
}

export function useAiConversation({
  roomCode,
  deckMovieIds,
}: UseAiConversationOptions) {
  const [turns, setTurns] = React.useState<AiChatTurn[]>([]);
  const [prompt, setPrompt] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = React.useState<number>(0);

  const cooldownTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [cooldownSeconds]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const sendPrompt = React.useCallback(
    async (overridePrompt?: string) => {
      const text = (overridePrompt !== undefined ? overridePrompt : prompt).trim();
      if (!text || isGenerating || cooldownSeconds > 0) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsGenerating(true);
      setError(null);
      setPrompt("");

      // Prepare conversation history from previous turns
      const conversationHistory: AiChatMessage[] = [];
      for (const turn of turns) {
        conversationHistory.push({ role: "user", content: turn.prompt });
        if (turn.replyMessage) {
          conversationHistory.push({ role: "model", content: turn.replyMessage });
        }
      }

      const turnId = `turn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const response: AiRecommendationResponse = await getAiRecommendations(
          roomCode || "GLOBAL",
          {
            prompt: text,
            conversationHistory,
            page: 1,
            limit: 4,
            excludedTmdbIds: deckMovieIds,
          },
          controller.signal
        );

        const newTurn: AiChatTurn = {
          id: turnId,
          prompt: text,
          timestamp: new Date(),
          replyMessage: response.replyMessage || "Here are your recommendations:",
          movies: response.movies || [],
          totalResultsCount: response.totalResults || (response.movies ? response.movies.length : 0),
          hasMore: response.hasMore || false,
          page: 1,
          modelUsed: response.modelUsed || "Gemini 3.5 Flash-Lite",
        };

        setTurns((prev) => [...prev, newTurn]);
        setCooldownSeconds(process.env.NODE_ENV === "test" ? 0 : 2);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Intentionally aborted
        }
        const message =
          err instanceof Error
            ? err.message
            : "Could not generate recommendations. Please try again.";
        setError(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, isGenerating, cooldownSeconds, turns, roomCode, deckMovieIds]
  );

  const loadMoreForTurn = React.useCallback(
    async (turnId: string) => {
      const targetTurn = turns.find((t) => t.id === turnId);
      if (!targetTurn || !targetTurn.hasMore || targetTurn.isLoadingMore) return;

      // Mark this specific turn as loading more
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, isLoadingMore: true } : t))
      );

      const nextPage = targetTurn.page + 1;

      try {
        const response: AiRecommendationResponse = await getAiRecommendations(
          roomCode || "GLOBAL",
          {
            prompt: targetTurn.prompt,
            page: nextPage,
            limit: 4,
            excludedTmdbIds: deckMovieIds,
          }
        );

        setTurns((prev) =>
          prev.map((t) => {
            if (t.id !== turnId) return t;

            const existingIds = new Set(t.movies.map((m) => m.tmdbId));
            const newMovies = (response.movies || []).filter(
              (m) => !existingIds.has(m.tmdbId)
            );

            return {
              ...t,
              movies: [...t.movies, ...newMovies],
              page: nextPage,
              hasMore: response.hasMore || false,
              totalResultsCount: response.totalResults || (t.movies.length + newMovies.length),
              isLoadingMore: false,
            };
          })
        );
      } catch (err: unknown) {
        console.error("[useAiConversation] Failed to load more for turn:", err);
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, isLoadingMore: false } : t))
        );
      }
    },
    [turns, roomCode, deckMovieIds]
  );

  const clearConversation = React.useCallback(() => {
    setTurns([]);
    setError(null);
  }, []);

  return {
    turns,
    prompt,
    setPrompt,
    isGenerating,
    error,
    cooldownSeconds,
    sendPrompt,
    loadMoreForTurn,
    clearConversation,
  };
}
