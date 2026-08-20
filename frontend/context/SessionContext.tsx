"use client";

import * as React from "react";
import {
  createSession as apiCreateSession,
  getSessionByRoomCode as apiGetSession,
  joinSession as apiJoinSession,
  leaveSessionByRoomCode as apiLeaveSession,
  kickUser as apiKickUser,
  updateSessionStatus as apiUpdateStatus,
  submitMovies as apiSubmitMovies,
  getSessionMovies as apiGetSessionMovies,
  startVoting as apiStartVoting,
  castVote as apiCastVote,
  getVotingProgressByRoomCode as apiGetProgress,
  getResultsByRoomCode as apiGetResultsByRoomCode,
  calculateResults as apiCalculateResults,
} from "@/lib/api";
import { stompService } from "@/lib/websocket";
import { useDeckSelection } from "@/hooks/useDeckSelection";
import { useRoomWebSocket } from "@/hooks/useRoomWebSocket";
import { KickedModal } from "@/components/ui/KickedModal";
import {
  saveSessionAuth,
  loadSessionAuth,
  clearSessionAuth,
} from "@/lib/storage/sessionStorage";
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

export interface DeckSubmissionProgress {
  submittedCount: number;
  totalCount: number;
  readyUserIds: number[];
}

export interface SessionContextType {
  session: SessionResponse | null;
  currentUser: UserResponse | null;
  isHost: boolean;
  stage: GameStage;
  isRehydrating: boolean;
  movieDeck: MovieSuggestionResponse[];
  myDeckSelection: MovieSubmissionDto[];
  hasSubmittedDeck: boolean;
  submissionProgress: DeckSubmissionProgress;
  progress: VotingProgressResponse | null;
  results: SessionResultsResponse | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  kickedNotice: string | null;

  createRoom: (hostName: string, maxUsers?: number, maxSuggestions?: number) => Promise<void>;
  joinRoom: (roomCode: string, displayName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  kickUser: (targetUserId: number, banPermanently?: boolean) => Promise<void>;
  dismissKickedNotice: () => void;
  refreshSession: () => Promise<void>;
  advanceToSearch: () => Promise<void>;
  addToDeck: (movie: MovieDto) => void;
  removeFromDeck: (tmdbId: number) => void;
  clearMyDeckSelection: () => void;
  submitMyDeck: () => Promise<void>;
  startVotingDeck: () => Promise<void>;
  castSwipeVote: (movieSuggestionId: number, voteType: VoteType) => Promise<void>;
  fetchConsensusResults: () => Promise<void>;
  playAgain: () => Promise<void>;
  resetToLobby: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = React.createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<SessionResponse | null>(null);
  const [currentUser, setCurrentUser] = React.useState<UserResponse | null>(null);
  const [stage, setStage] = React.useState<GameStage>("SETUP");
  const [isRehydrating, setIsRehydrating] = React.useState<boolean>(false);
  const [movieDeck, setMovieDeck] = React.useState<MovieSuggestionResponse[]>([]);
  const [progress, setProgress] = React.useState<VotingProgressResponse | null>(null);
  const [results, setResults] = React.useState<SessionResultsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [kickedNotice, setKickedNotice] = React.useState<string | null>(null);
  const [hasSubmittedDeck, setHasSubmittedDeck] = React.useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] = React.useState<DeckSubmissionProgress>({
    submittedCount: 0,
    totalCount: 0,
    readyUserIds: [],
  });

  const dismissKickedNotice = React.useCallback(() => {
    clearSessionAuth();
    setKickedNotice(null);
  }, []);

  // Rehydrate active session from sessionStorage on app mount / refresh
  React.useEffect(() => {
    let isMounted = true;

    async function rehydrateSession() {
      const stored = loadSessionAuth();
      if (!stored?.roomCode || !stored?.userId) {
        return;
      }

      setIsRehydrating(true);

      try {
        const active = await apiGetSession(stored.roomCode);
        if (!isMounted || !active?.users) {
          return;
        }

        const me = active.users.find(
          (u) => u.id === stored.userId || u.displayName === stored.displayName
        );

        let effectiveMe = me;
        let effectiveSession = active;

        if (!effectiveMe) {
          // If the user was removed after disconnect grace period but session is still open, auto-rejoin
          if (active.status === "WAITING" || active.status === "SUGGESTING") {
            try {
              const rejoined = await apiJoinSession({
                roomCode: stored.roomCode.trim(),
                displayName: stored.displayName.trim(),
              });

              if (!isMounted) return;

              effectiveSession = rejoined;
              effectiveMe =
                rejoined.users.find((u) => u.displayName === stored.displayName.trim()) || {
                  id: rejoined.users[rejoined.users.length - 1]?.id || 2,
                  displayName: stored.displayName.trim(),
                  isHost: false,
                  joinedAt: new Date().toISOString(),
                };

              saveSessionAuth({
                roomCode: rejoined.roomCode,
                userId: effectiveMe.id,
                displayName: effectiveMe.displayName,
                isHost: effectiveMe.isHost ?? false,
                savedAt: Date.now(),
              });
            } catch (rejoinErr) {
              console.warn("[SessionContext] Auto-rejoin failed:", rejoinErr);
              clearSessionAuth();
              return;
            }
          } else {
            clearSessionAuth();
            return;
          }
        }

        if (!effectiveMe || effectiveSession.status === "COMPLETED") {
          clearSessionAuth();
          return;
        }

        setSession(effectiveSession);
        setCurrentUser(effectiveMe);

        if (effectiveSession.status === "SUGGESTING") {
          setStage("SEARCH");
        } else if (effectiveSession.status === "VOTING") {
          setStage("SWIPER");
          try {
            const movies = await apiGetSessionMovies(effectiveSession.id);
            if (isMounted) setMovieDeck(movies);
            const prog = await apiGetProgress(effectiveSession.roomCode);
            if (isMounted) setProgress(prog);
          } catch {
            // Keep current deck
          }
        } else if (effectiveSession.status === "WAITING") {
          setStage("LOBBY");
        }
      } catch (err) {
        console.warn("[SessionContext] Stored session invalid or expired:", err);
        clearSessionAuth();
      } finally {
        if (isMounted) {
          setIsRehydrating(false);
        }
      }
    }

    rehydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const fetchConsensusResults = React.useCallback(async () => {
    if (!session?.roomCode) return;
    try {
      const data = await apiGetResultsByRoomCode(session.roomCode);
      setResults(data);
      setStage("WINNER");
    } catch {
      try {
        if (session.id) {
          const calcData = await apiCalculateResults(session.id);
          setResults(calcData);
          setStage("WINNER");
        }
      } catch (err: unknown) {
        console.error("[SessionContext] Failed to fetch consensus results:", err);
      }
    }
  }, [session?.roomCode, session?.id]);

  const handleRoomEvent = React.useCallback(
    async (event: RoomProgressEvent) => {
      // 1. User kicked event
      if (event.eventType === "USER_KICKED") {
        const kickedId = event.kickedUserId ?? event.userId;
        if (kickedId && currentUser && kickedId === currentUser.id) {
          clearSessionAuth();
          stompService.disconnect();
          setKickedNotice(
            event.message || "You have been removed from the session by the host."
          );
          setSession(null);
          setCurrentUser(null);
          setMovieDeck([]);
          clearMyDeckSelection();
          setHasSubmittedDeck(false);
          setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
          setProgress(null);
          setResults(null);
          setStage("SETUP");
          return;
        }

        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: event.users || prev.users.filter((u) => u.id !== kickedId),
            hostName: event.hostName || prev.hostName,
            status: event.sessionStatus || prev.status,
          };
        });

        if (kickedId) {
          setSubmissionProgress((prev) => ({
            submittedCount: Math.max(
              0,
              prev.readyUserIds.includes(kickedId)
                ? prev.submittedCount - 1
                : prev.submittedCount
            ),
            totalCount: event.users
              ? event.users.length
              : Math.max(0, prev.totalCount - 1),
            readyUserIds: prev.readyUserIds.filter((id) => id !== kickedId),
          }));
        }
      }

      // 2. Roster and presence updates
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
          setMovieDeck([]);
          clearMyDeckSelection();
          setHasSubmittedDeck(false);
          setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
          setProgress(null);
          setResults(null);
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
        } else if (event.sessionStatus === "COMPLETED") {
          if (session?.roomCode) {
            fetchConsensusResults();
          }
        } else if (event.sessionStatus === "WAITING") {
          setMovieDeck([]);
          clearMyDeckSelection();
          setHasSubmittedDeck(false);
          setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
          setProgress(null);
          setResults(null);
          setStage("LOBBY");
        }
      }

      // 3. Deck submission progress event
      if (event.eventType === "DECK_SUBMITTED") {
        setSubmissionProgress((prev) => ({
          submittedCount: event.submittedUserCount ?? prev.submittedCount + 1,
          totalCount: event.totalUserCount ?? prev.totalCount,
          readyUserIds: event.userId
            ? Array.from(new Set([...prev.readyUserIds, event.userId]))
            : prev.readyUserIds,
        }));
        if (event.userId === currentUser?.id) {
          setHasSubmittedDeck(true);
        }
      }

      // 4. Voting progress
      if (event.progress) {
        setProgress(event.progress);
      }
    },
    [
      session?.id,
      session?.roomCode,
      currentUser,
      clearMyDeckSelection,
      fetchConsensusResults,
    ]
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
        saveSessionAuth({
          roomCode: newSession.roomCode,
          userId: me.id,
          displayName: me.displayName,
          isHost: true,
          savedAt: Date.now(),
        });
        setHasSubmittedDeck(false);
        setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
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
        saveSessionAuth({
          roomCode: joinedSession.roomCode,
          userId: me.id,
          displayName: me.displayName,
          isHost: me.isHost ?? false,
          savedAt: Date.now(),
        });
        setHasSubmittedDeck(false);
        setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
        
        if (joinedSession.status === "SUGGESTING") {
          setStage("SEARCH");
        } else if (joinedSession.status === "VOTING") {
          setStage("SWIPER");
        } else if (joinedSession.status === "COMPLETED") {
          setStage("WINNER");
        } else {
          setStage("LOBBY");
        }
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
      clearSessionAuth();
      setSession(null);
      setCurrentUser(null);
      setHasSubmittedDeck(false);
      setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
      setStage("SETUP");
      return;
    }

    try {
      await apiLeaveSession(session.roomCode, currentUser.id);
    } catch {
      // Graceful exit
    } finally {
      clearSessionAuth();
      stompService.disconnect();
      setSession(null);
      setCurrentUser(null);
      setMovieDeck([]);
      clearMyDeckSelection();
      setHasSubmittedDeck(false);
      setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
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
      } else if (refreshed.status === "COMPLETED" && stage !== "WINNER") {
        fetchConsensusResults();
      }
    } catch {
      // Background refresh failure ignored
    }
  }, [session, stage, fetchConsensusResults]);

  const advanceToSearch = React.useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateStatus(session.roomCode, "SUGGESTING");
      setSession(updated);
      setMovieDeck([]);
      clearMyDeckSelection();
      setHasSubmittedDeck(false);
      setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
      setProgress(null);
      setResults(null);
      setStage("SEARCH");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start movie search.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, clearMyDeckSelection]);

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
      setHasSubmittedDeck(true);
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

  const playAgain = React.useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateStatus(session.roomCode, "SUGGESTING");
      setSession(updated);
      setMovieDeck([]);
      clearMyDeckSelection();
      setHasSubmittedDeck(false);
      setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
      setProgress(null);
      setResults(null);
      setStage("SEARCH");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to restart session.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, clearMyDeckSelection]);

  const resetToLobby = React.useCallback(async () => {
    if (!session) return;
    try {
      const updated = await apiUpdateStatus(session.roomCode, "WAITING");
      setSession(updated);
      setMovieDeck([]);
      clearMyDeckSelection();
      setHasSubmittedDeck(false);
      setSubmissionProgress({ submittedCount: 0, totalCount: 0, readyUserIds: [] });
      setProgress(null);
      setResults(null);
      setStage("LOBBY");
    } catch {
      setStage("LOBBY");
    }
  }, [session, clearMyDeckSelection]);

  const kickUser = React.useCallback(
    async (targetUserId: number, banPermanently?: boolean) => {
      if (!session?.roomCode || !currentUser?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const isPermanent = banPermanently === true;
        await apiKickUser(session.roomCode, currentUser.id, targetUserId, isPermanent);
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.filter((u) => u.id !== targetUserId),
          };
        });
        setSubmissionProgress((prev) => ({
          submittedCount: Math.max(
            0,
            prev.readyUserIds.includes(targetUserId)
              ? prev.submittedCount - 1
              : prev.submittedCount
          ),
          totalCount: Math.max(0, prev.totalCount - 1),
          readyUserIds: prev.readyUserIds.filter((id) => id !== targetUserId),
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to remove user.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.roomCode, currentUser?.id]
  );

  const effectiveError = error || deckError;

  const value: SessionContextType = {
    session,
    currentUser,
    isHost,
    stage,
    isRehydrating,
    movieDeck,
    myDeckSelection,
    hasSubmittedDeck,
    submissionProgress,
    progress,
    results,
    isConnected,
    isLoading,
    error: effectiveError,
    kickedNotice,
    createRoom,
    joinRoom,
    leaveRoom,
    kickUser,
    dismissKickedNotice,
    refreshSession,
    advanceToSearch,
    addToDeck,
    removeFromDeck,
    clearMyDeckSelection,
    submitMyDeck,
    startVotingDeck,
    castSwipeVote,
    fetchConsensusResults,
    playAgain,
    resetToLobby,
    clearError,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      <KickedModal
        isOpen={!!kickedNotice}
        message={kickedNotice || undefined}
        onDismiss={dismissKickedNotice}
      />
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
