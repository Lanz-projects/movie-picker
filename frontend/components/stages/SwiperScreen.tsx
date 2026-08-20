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

  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [exitDirection, setExitDirection] = React.useState<VoteType | null>(null);
  const [selectedMovieForModal, setSelectedMovieForModal] = React.useState<MovieSuggestionResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isProcessingVote, setIsProcessingVote] = React.useState<boolean>(false);

  const totalMovies = movieDeck.length;
  const isFinished = currentIndex >= totalMovies;
  const currentMovie = !isFinished ? movieDeck[currentIndex] : null;

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
    [isFinished, currentMovie, isProcessingVote, castSwipeVote, animationDurationMs]
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
    <StageContainer maxWidth="md" className={className}>
      <div className="flex flex-col items-center gap-5 sm:gap-6 w-full animate-stage-in">
        {isFinished ? (
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
            />

            <div className="relative w-full max-w-[480px] h-[500px] sm:h-[540px] flex items-center justify-center">
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
