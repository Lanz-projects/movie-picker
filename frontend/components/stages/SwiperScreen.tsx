"use client";

import * as React from "react";
import { StageContainer } from "@/components/layout/StageContainer";
import { SwipeCard } from "./swiper/SwipeCard";
import { SwipeActions } from "./swiper/SwipeActions";
import { VotingProgressHeader } from "./swiper/VotingProgressHeader";
import { SwiperFinishedView } from "./swiper/SwiperFinishedView";
import { MovieDetailsModal } from "./search/MovieDetailsModal";
import { useSession } from "@/context/SessionContext";
import { useKeyboardSwipe } from "@/hooks/useKeyboardSwipe";
import { playSwipePass, playSwipeLike, playSwipeSuperlike } from "@/lib/audio/sounds";
import { saveVotedSuggestionId, loadVotedSuggestionIds } from "@/lib/storage/sessionStorage";
import { cn } from "@/lib/utils";
import type { MovieSuggestionResponse, VoteType, MovieDto } from "@/types";

export interface SwiperScreenProps {
  animationDurationMs?: number;
  className?: string;
}

export function SwiperScreen({
  animationDurationMs = 250,
  className,
}: SwiperScreenProps = {}) {
  const {
    movieDeck,
    currentUser,
    session,
    progress,
    castSwipeVote,
  } = useSession();

  const roomCode = session?.roomCode || "";
  const userId = currentUser?.id || 0;

  const [currentIndex, setCurrentIndex] = React.useState<number>(() => {
    if (!roomCode || !userId || !movieDeck.length) return 0;
    const votedIds = new Set(loadVotedSuggestionIds(roomCode, userId));
    const firstUnvotedIndex = movieDeck.findIndex((m) => !votedIds.has(m.id));
    return firstUnvotedIndex === -1 ? movieDeck.length : firstUnvotedIndex;
  });
  const [exitDirection, setExitDirection] = React.useState<VoteType | null>(null);
  const [selectedMovieForModal, setSelectedMovieForModal] = React.useState<MovieSuggestionResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isProcessingVote, setIsProcessingVote] = React.useState<boolean>(false);

  const totalMovies = movieDeck.length;
  const isFinished = totalMovies > 0 && currentIndex >= totalMovies;
  const isLoadingDeck = totalMovies === 0;
  const currentMovie = !isFinished && !isLoadingDeck ? movieDeck[currentIndex] : null;

  // Preload upcoming movie poster images into browser cache for instant rendering
  React.useEffect(() => {
    if (typeof window === "undefined" || !movieDeck.length) return;

    for (let i = currentIndex + 1; i <= Math.min(currentIndex + 3, movieDeck.length - 1); i++) {
      const posterPath = movieDeck[i]?.posterPath;
      if (posterPath) {
        const img = new (window.Image || Image)();
        img.src = `https://image.tmdb.org/t/p/w780${posterPath}`;
      }
    }
  }, [currentIndex, movieDeck]);

  const handleVote = React.useCallback(
    (voteType: VoteType) => {
      if (isFinished || !currentMovie || isProcessingVote) return;

      if (voteType === "PASS") {
        playSwipePass();
      } else if (voteType === "SUPERLIKE") {
        playSwipeSuperlike();
      } else {
        playSwipeLike();
      }

      setIsProcessingVote(true);
      setExitDirection(voteType);

      castSwipeVote(currentMovie.id, voteType);
      if (roomCode && userId) {
        saveVotedSuggestionId(roomCode, userId, currentMovie.id);
      }

      if (animationDurationMs === 0) {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
        setIsProcessingVote(false);
      } else {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
          setExitDirection(null);
          setIsProcessingVote(false);
        }, animationDurationMs);
      }
    },
    [isFinished, currentMovie, isProcessingVote, castSwipeVote, roomCode, userId, animationDurationMs]
  );

  const handleOpenDetails = React.useCallback((movie: MovieSuggestionResponse) => {
    setSelectedMovieForModal(movie);
    setIsModalOpen(true);
  }, []);

  const handleCloseDetails = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieForModal(null);
  }, []);

  const handlePass = React.useCallback(() => handleVote("PASS"), [handleVote]);
  const handleLike = React.useCallback(() => handleVote("LIKE"), [handleVote]);
  const handleSuperlike = React.useCallback(() => handleVote("SUPERLIKE"), [handleVote]);
  const handleInfo = React.useCallback(() => {
    if (currentMovie) handleOpenDetails(currentMovie);
  }, [currentMovie, handleOpenDetails]);

  useKeyboardSwipe({
    onPass: handlePass,
    onLike: handleLike,
    onSuperlike: handleSuperlike,
    onSkip: handlePass,
    onInfo: handleInfo,
    onEscape: handleCloseDetails,
    enabled: !isFinished && !isModalOpen,
  });

  const modalMovieDto: MovieDto | null = React.useMemo(() => {
    if (!selectedMovieForModal) return null;
    return {
      tmdbId: selectedMovieForModal.tmdbId,
      title: selectedMovieForModal.title,
      overview: selectedMovieForModal.overview ?? "",
      posterPath: selectedMovieForModal.posterPath,
      releaseYear: selectedMovieForModal.releaseYear,
      voteAverage: 0,
    };
  }, [selectedMovieForModal]);

  return (
    <StageContainer
      maxWidth="md"
      className={cn("flex-1 flex flex-col items-center justify-center px-3 py-2 sm:py-6 sm:px-4", className)}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[420px] mx-auto animate-stage-in">
        {isLoadingDeck ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 animate-fade-in text-center">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute h-10 w-10 animate-ping rounded-full bg-brand-violet/30" />
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" />
            </div>
            <p className="text-sm font-semibold text-text-secondary tracking-wide">
              Loading movie deck...
            </p>
          </div>
        ) : isFinished ? (
          <SwiperFinishedView
            progress={progress}
            users={session?.users}
            currentUserId={currentUser?.id}
          />
        ) : (
          <>
            <VotingProgressHeader
              currentIndex={currentIndex}
              totalMovies={totalMovies}
              progress={progress}
              className="w-full shrink-0"
            />

            <div className="relative w-full max-w-[360px] sm:max-w-[440px] h-[52vh] min-h-[340px] max-h-[460px] sm:h-[520px] sm:max-h-none flex items-center justify-center">
              {currentIndex + 2 < totalMovies && (
                <SwipeCard
                  key={`back-2-${movieDeck[currentIndex + 2].id}`}
                  movie={movieDeck[currentIndex + 2]}
                  isTop={false}
                  stackIndex={2}
                />
              )}

              {currentIndex + 1 < totalMovies && (
                <SwipeCard
                  key={`back-1-${movieDeck[currentIndex + 1].id}`}
                  movie={movieDeck[currentIndex + 1]}
                  isTop={false}
                  stackIndex={1}
                />
              )}

              {currentMovie && (
                <SwipeCard
                  key={`top-${currentMovie.id}`}
                  movie={currentMovie}
                  isTop={true}
                  stackIndex={0}
                  onSwipe={handleVote}
                  onOpenDetails={handleOpenDetails}
                  exitDirection={exitDirection}
                />
              )}
            </div>

            <SwipeActions
              onPass={handlePass}
              onSkip={handlePass}
              onSuperlike={handleSuperlike}
              onLike={handleLike}
              onInfo={handleInfo}
              disabled={isProcessingVote}
              className="w-full shrink-0"
            />
          </>
        )}
      </div>

      <MovieDetailsModal
        movie={modalMovieDto}
        isOpen={isModalOpen}
        onClose={handleCloseDetails}
        isInDeck={false}
        onToggleDeck={() => {}}
        disabled={true}
      />
    </StageContainer>
  );
}
