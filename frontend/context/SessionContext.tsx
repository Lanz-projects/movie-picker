"use client";

import * as React from "react";
import {
  createSession as apiCreateSession,
  getSessionByRoomCode as apiGetSession,
  joinSession as apiJoinSession,
  leaveSessionByRoomCode as apiLeaveSession,
  updateSessionStatus as apiUpdateStatus,
  submitMovies as apiSubmitMovies,
  getSessionMovies as apiGetSessionMovies,
  startVoting as apiStartVoting,
  castVote as apiCastVote,
  getVotingProgressByRoomCode as apiGetProgress,
} from "@/lib/api";
import { stompService } from "@/lib/websocket";
import { useDeckSelection } from "@/hooks/useDeckSelection";
import { useRoomWebSocket } from "@/hooks/useRoomWebSocket";
import type {
  SessionResponse,
  UserResponse,
  MovieDto,
  MovieSubmissionDto,
  MovieSuggestionResponse,
  VotingProgressResponse,
  SessionResultsResponse,
  VoteType,
  RoomProgressEvent,
} from "@/types";

export type GameStage = "SETUP" | "LOBBY" | "SEARCH" | "SWIPER" | "WINNER";

export interface SessionContextType {
  session: SessionResponse | null;
  currentUser: UserResponse | null;
  isHost: boolean;
  stage: GameStage;
  movieDeck: MovieSuggestionResponse[];
  myDeckSelection: MovieSubmissionDto[];
  progress: VotingProgressResponse | null;
  results: SessionResultsResponse | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  createRoom: (hostName: string, maxUsers?: number, maxSuggestions?: number) => Promise<void>;
  joinRoom: (roomCode: string, displayName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  refreshSession: () => Promise<void>;
  advanceToSearch: () => Promise<void>;
  addToDeck: (movie: MovieDto) => void;
  removeFromDeck: (tmdbId: number) => void;
  clearMyDeckSelection: () => void;
  submitMyDeck: () => Promise<void>;
  startVotingDeck: () => Promise<void>;
  castSwipeVote: (movieSuggestionId: number, voteType: VoteType) => Promise<void>;
  resetToLobby: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = React.createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<SessionResponse | null>(null);
  const [currentUser, setCurrentUser] = React.useState<UserResponse | null>(null);
  const [stage, setStage] = React.useState<GameStage>("SETUP");
  const [movieDeck, setMovieDeck] = React.useState<MovieSuggestionResponse[]>([]);
  const [progress, setProgress] = React.useState<VotingProgressResponse | null>(null);
  const [results, setResults] = React.useState<SessionResultsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    myDeckSelection,
    deckError,
    addToDeck,
    removeFromDeck,
    clearDeck: clearMyDeckSelection,
  } = useDeckSelection(session?.maxSuggestionsPerUser || 5);

  const isHost = React.useMemo(() => {
    if (!currentUser || !session) return false;
    return currentUser.displayName === session.hostName;
  }, [currentUser, session]);

  const handleResults = React.useCallback((incomingResults: SessionResultsResponse) => {
    setResults(incomingResults);
    setStage("WINNER");
  }, []);

  const handleRoomEvent = React.useCallback(
    async (event: RoomProgressEvent) => {
      // 1. Roster and presence updates
      if (
        event.eventType === "USER_JOINED" ||
        event.eventType === "USER_LEFT" ||
        event.eventType === "HOST_CHANGED"
      ) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: event.users || prev.users,
            hostName: event.hostName || prev.hostName,
            status: event.sessionStatus || prev.status,
          };
        });
      }

      // 2. Stage transitions
      if (event.eventType === "STAGE_CHANGED") {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: event.sessionStatus || prev.status,
            users: event.users || prev.users,
            hostName: event.hostName || prev.hostName,
          };
        });

        if (event.sessionStatus === "SUGGESTING") {
          setStage("SEARCH");
        } else if (event.sessionStatus === "VOTING") {
          if (session?.id) {
            try {
              const movies = await apiGetSessionMovies(session.id);
              setMovieDeck(movies);
              const initialProgress = await apiGetProgress(session.roomCode);
              setProgress(initialProgress);
            } catch (err) {
              console.error("[SessionContext] Failed to load movies on VOTING stage start:", err);
            }
          }
          setStage("SWIPER");
        } else if (event.sessionStatus === "WAITING") {
          setMovieDeck([]);
          clearMyDeckSelection();
          setProgress(null);
          setResults(null);
          setStage("LOBBY");
        }
      }

      // 3. Voting progress
      if (event.progress) {
        setProgress(event.progress);
      }
    },
    [session?.id, session?.roomCode, clearMyDeckSelection]
  );

  const { isConnected } = useRoomWebSocket({
    roomCode: session?.roomCode,
    userId: currentUser?.id,
    displayName: currentUser?.displayName,
    onRoomEvent: handleRoomEvent,
    onResults: handleResults,
  });

  const clearError = React.useCallback(() => setError(null), []);

  const createRoom = React.useCallback(
    async (hostName: string, maxUsers = 10, maxSuggestions = 5) => {
      setIsLoading(true);
      setError(null);
      try {
        const newSession = await apiCreateSession({
          hostName: hostName.trim(),
          maxUsers,
          maxSuggestionsPerUser: maxSuggestions,
        });

        const me =
          newSession.users.find((u) => u.displayName === hostName.trim()) || {
            id: newSession.users[0]?.id || 1,
            displayName: hostName.trim(),
            isHost: true,
            joinedAt: new Date().toISOString(),
          };

        setSession(newSession);
        setCurrentUser(me);
        setStage("LOBBY");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create room.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const joinRoom = React.useCallback(
    async (roomCode: string, displayName: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const joinedSession = await apiJoinSession({
          roomCode: roomCode.trim(),
          displayName: displayName.trim(),
        });

        const me =
          joinedSession.users.find((u) => u.displayName === displayName.trim()) || {
            id: joinedSession.users[joinedSession.users.length - 1]?.id || 2,
            displayName: displayName.trim(),
            isHost: false,
            joinedAt: new Date().toISOString(),
          };

        setSession(joinedSession);
        setCurrentUser(me);
        setStage("LOBBY");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to join room.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const leaveRoom = React.useCallback(async () => {
    if (!session || !currentUser) {
      setSession(null);
      setCurrentUser(null);
      setStage("SETUP");
      return;
    }

    try {
      await apiLeaveSession(session.roomCode, currentUser.id);
    } catch {
      // Graceful exit
    } finally {
      stompService.disconnect();
      setSession(null);
      setCurrentUser(null);
      setMovieDeck([]);
      clearMyDeckSelection();
      setProgress(null);
      setResults(null);
      setStage("SETUP");
    }
  }, [session, currentUser, clearMyDeckSelection]);

  const refreshSession = React.useCallback(async () => {
    if (!session?.roomCode) return;
    try {
      const refreshed = await apiGetSession(session.roomCode);
      setSession(refreshed);

      if (refreshed.status === "SUGGESTING" && stage === "LOBBY") {
        setStage("SEARCH");
      } else if (refreshed.status === "VOTING" && (stage === "LOBBY" || stage === "SEARCH")) {
        const movies = await apiGetSessionMovies(refreshed.id);
        setMovieDeck(movies);
        setStage("SWIPER");
      }
    } catch {
      // Background refresh failure ignored
    }
  }, [session, stage]);

  const advanceToSearch = React.useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateStatus(session.roomCode, "SUGGESTING");
      setSession(updated);
      setStage("SEARCH");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start movie search.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const submitMyDeck = React.useCallback(async () => {
    if (!session || !currentUser) return;
    if (myDeckSelection.length === 0) {
      setError("Please select at least 1 movie to submit.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiSubmitMovies(session.id, {
        userId: currentUser.id,
        movies: myDeckSelection,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit movies.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, currentUser, myDeckSelection]);

  const startVotingDeck = React.useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiStartVoting(session.id);
      setSession(updated);

      const movies = await apiGetSessionMovies(session.id);
      setMovieDeck(movies);

      const initialProgress = await apiGetProgress(session.roomCode);
      setProgress(initialProgress);

      setStage("SWIPER");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start voting deck.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const castSwipeVote = React.useCallback(
    async (movieSuggestionId: number, voteType: VoteType) => {
      if (!session || !currentUser) return;

      const payload = {
        roomCode: session.roomCode.trim(),
        userId: currentUser.id,
        movieSuggestionId,
        voteType,
      };

      try {
        if (stompService.isConnected()) {
          stompService.publishVote(payload);
        } else {
          await apiCastVote(session.id, {
            userId: currentUser.id,
            movieSuggestionId,
            voteType,
          });
        }
      } catch (err: unknown) {
        console.error("[SessionContext] Failed to cast swipe vote:", err);
      }
    },
    [session, currentUser]
  );

  const resetToLobby = React.useCallback(async () => {
    if (!session) return;
    try {
      const updated = await apiUpdateStatus(session.roomCode, "WAITING");
      setSession(updated);
      setMovieDeck([]);
      clearMyDeckSelection();
      setProgress(null);
      setResults(null);
      setStage("LOBBY");
    } catch {
      setStage("LOBBY");
    }
  }, [session, clearMyDeckSelection]);

  const effectiveError = error || deckError;

  const value: SessionContextType = {
    session,
    currentUser,
    isHost,
    stage,
    movieDeck,
    myDeckSelection,
    progress,
    results,
    isConnected,
    isLoading,
    error: effectiveError,
    createRoom,
    joinRoom,
    leaveRoom,
    refreshSession,
    advanceToSearch,
    addToDeck,
    removeFromDeck,
    clearMyDeckSelection,
    submitMyDeck,
    startVotingDeck,
    castSwipeVote,
    resetToLobby,
    clearError,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextType {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
