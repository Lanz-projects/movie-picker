"use client";

import * as React from "react";
import { StageContainer } from "@/components/layout/StageContainer";
import {
  WinnerCard,
  ConfettiCelebration,
  WinnerControls,
} from "./winner";
import { LeaderboardList } from "./winner/leaderboard";
import { MovieDetailsModal } from "./search/MovieDetailsModal";
import { useSession } from "@/context/SessionContext";
import type { ScoredMovieDto, MovieSubmissionDto } from "@/types";

export interface WinnerScreenProps {
  className?: string;
}

export function WinnerScreen({ className }: WinnerScreenProps = {}) {
  const {
    results,
    isHost,
    isLoading,
    playAgain,
    resetToLobby,
  } = useSession();

  const [selectedMovieForModal, setSelectedMovieForModal] = React.useState<ScoredMovieDto | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const handleOpenDetails = React.useCallback((movie: ScoredMovieDto) => {
    setSelectedMovieForModal(movie);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovieForModal(null);
  }, []);

  const modalMovieAdapter: MovieSubmissionDto | null = React.useMemo(() => {
    if (!selectedMovieForModal) return null;
    return {
      tmdbId: selectedMovieForModal.tmdbId,
      title: selectedMovieForModal.title,
      overview: selectedMovieForModal.overview || null,
      posterPath: selectedMovieForModal.posterPath || null,
      releaseYear: selectedMovieForModal.releaseYear || null,
    };
  }, [selectedMovieForModal]);

  const winner = results?.winner;
  const rankedMovies = results?.rankedMovies || [];

  return (
    <StageContainer
      stageTitle="Consensus Results"
      stageSubtitle="Voting has finished. Here is tonight's group decision."
      maxWidth="lg"
      className={className}
    >
      {winner && (
        <ConfettiCelebration isUnanimous={Boolean(winner.isUnanimous)} />
      )}

      <div className="space-y-6 sm:space-y-8 w-full max-w-2xl mx-auto">
        {winner ? (
          <WinnerCard
            winner={winner}
            onOpenDetails={handleOpenDetails}
          />
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-8 text-center text-text-muted">
            <p className="text-sm font-medium text-text-secondary">
              Calculating consensus results...
            </p>
          </div>
        )}

        {/* Runner-Ups Leaderboard */}
        <LeaderboardList
          rankedMovies={rankedMovies}
          onOpenDetails={handleOpenDetails}
        />

        {/* Host / Participant Controls */}
        <WinnerControls
          isHost={isHost}
          isLoading={isLoading}
          onPlayAgain={playAgain}
          onResetToLobby={resetToLobby}
        />
      </div>

      {/* Movie Details Modal Sheet */}
      <MovieDetailsModal
        movie={modalMovieAdapter}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isInDeck={false}
        onToggleDeck={() => {}}
        disabled
      />
    </StageContainer>
  );
}
