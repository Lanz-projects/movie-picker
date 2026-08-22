"use client";

import * as React from "react";
import { getAiRecommendations } from "@/lib/api/ai";
import type { MovieDto, AiRecommendationResponse } from "@/types";

export interface UseVibeRecommendationsOptions {
  roomCode?: string;
  deckMovieIds: number[];
}

export function useVibeRecommendations({
  roomCode,
  deckMovieIds,
}: UseVibeRecommendationsOptions) {
  const [prompt, setPrompt] = React.useState<string>("");
  const [activePrompt, setActivePrompt] = React.useState<string>("");
  const [recommendations, setRecommendations] = React.useState<MovieDto[]>([]);
  const [replyMessage, setReplyMessage] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = React.useState<number>(0);

  const cooldownTimerRef = React.useRef<NodeJS.Timeout | null>(null);

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

  const fetchRecommendations = React.useCallback(
    async (vibePrompt: string, targetPage: number = 1) => {
      if (!vibePrompt.trim() || isLoading) return;

      const isFirstPage = targetPage === 1;
      if (isFirstPage) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response: AiRecommendationResponse = await getAiRecommendations(
          roomCode || "GLOBAL",
          {
            prompt: vibePrompt.trim(),
            page: targetPage,
            limit: 5,
            excludedTmdbIds: deckMovieIds,
          }
        );

        if (isFirstPage) {
          setRecommendations(response.movies || []);
          setReplyMessage(response.replyMessage || "");
          setActivePrompt(vibePrompt.trim());
          setPage(1);
          setCooldownSeconds(3);
        } else {
          setRecommendations((prev) => [...prev, ...(response.movies || [])]);
          setPage(targetPage);
        }

        setHasMore(response.hasMore || false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Could not fetch recommendations. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isLoading, roomCode, deckMovieIds]
  );

  const loadMore = React.useCallback(() => {
    if (!hasMore || isLoadingMore || !activePrompt) return;
    fetchRecommendations(activePrompt, page + 1);
  }, [hasMore, isLoadingMore, activePrompt, page, fetchRecommendations]);

  return {
    prompt,
    setPrompt,
    activePrompt,
    recommendations,
    replyMessage,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    cooldownSeconds,
    fetchRecommendations,
    loadMore,
  };
}
