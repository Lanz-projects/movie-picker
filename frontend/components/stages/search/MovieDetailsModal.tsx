"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Star,
  Plus,
  Check,
  Film,
  Calendar,
  ExternalLink,
  Tag,
  Clock,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getMovieDetails } from "@/lib/api/movie";
import { ModalBackdropHeader } from "./modal/ModalBackdropHeader";
import { ModalCastSection } from "./modal/ModalCastSection";
import { ModalMetadataGrid } from "./modal/ModalMetadataGrid";
import { ModalStreamingSection } from "./modal/ModalStreamingSection";
import type { MovieDto, MovieSubmissionDto, MovieDetailsDto } from "@/types";

export type ModalMovie = MovieDto | MovieSubmissionDto;

export interface MovieDetailsModalProps {
  movie: ModalMovie | null;
  isOpen: boolean;
  onClose: () => void;
  isInDeck: boolean;
  onToggleDeck: (movie: MovieDto) => void;
  disabled?: boolean;
}

export const MovieDetailsModal = React.memo(function MovieDetailsModal({
  movie,
  isOpen,
  onClose,
  isInDeck,
  onToggleDeck,
  disabled = false,
}: MovieDetailsModalProps) {
  const [imageError, setImageError] = React.useState(false);
  const [backdropError, setBackdropError] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [detailedData, setDetailedData] = React.useState<MovieDetailsDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setImageError(false);
    setBackdropError(false);
    setDetailedData(null);

    if (isOpen && movie?.tmdbId) {
      let isCurrent = true;
      setIsLoadingDetails(true);

      try {
        const promise = getMovieDetails(movie.tmdbId);
        if (promise && typeof promise.then === "function") {
          promise
            .then((data) => {
              if (isCurrent && data) {
                setDetailedData(data);
              }
            })
            .catch(() => {
              // Graceful fallback to basic movie info
            })
            .finally(() => {
              if (isCurrent) {
                setIsLoadingDetails(false);
              }
            });
        } else {
          setIsLoadingDetails(false);
        }
      } catch {
        setIsLoadingDetails(false);
      }

      return () => {
        isCurrent = false;
      };
    }
  }, [isOpen, movie?.tmdbId]);

  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !movie || !mounted) {
    return null;
  }

  const title = detailedData?.title || movie.title;
  const overview = detailedData?.overview || movie.overview || "";
  const posterPath = detailedData?.posterPath || movie.posterPath;
  const backdropPath = detailedData?.backdropPath || movie.backdropPath;
  const releaseYear = detailedData?.releaseYear || movie.releaseYear;
  const releaseDate = detailedData?.releaseDate || (movie as MovieDto).releaseDate || null;
  const voteAverage = detailedData?.voteAverage ?? (movie as MovieDto).voteAverage;
  const voteCount = detailedData?.voteCount ?? (movie as MovieDto).voteCount;
  const genres = detailedData?.genres?.length ? detailedData.genres : (movie.genres || []);
  const directors = detailedData?.directors || [];
  const topCast = detailedData?.topCast || [];
  const formattedRuntime = detailedData?.formattedRuntime || (detailedData?.runtime ? `${detailedData.runtime}m` : null);
  const contentRating = detailedData?.contentRating;
  const streamingProviders = detailedData?.streamingProviders || [];
  const tagline = detailedData?.tagline;
  const language = (detailedData?.originalLanguage || movie.originalLanguage)?.toUpperCase() || null;

  const posterUrl = !imageError && posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
  const backdropUrl = !backdropError && backdropPath ? `https://image.tmdb.org/t/p/w780${backdropPath}` : null;
  const formattedRating = typeof voteAverage === "number" && voteAverage > 0 ? voteAverage.toFixed(1) : null;
  const formattedVoteCount = typeof voteCount === "number" && voteCount > 0
    ? voteCount >= 1000 ? `${(voteCount / 1000).toFixed(1)}k votes` : `${voteCount} votes`
    : null;

  const handleToggle = () => {
    const movieDto: MovieDto = {
      tmdbId: movie.tmdbId,
      title: title,
      overview: overview,
      posterPath: posterPath || null,
      backdropPath: backdropPath || null,
      releaseYear: releaseYear || null,
      releaseDate: releaseDate,
      voteAverage: typeof voteAverage === "number" ? voteAverage : 0,
      voteCount: voteCount,
      genres: genres,
      originalLanguage: movie.originalLanguage,
    };
    onToggleDeck(movieDto);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-details-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] overflow-hidden rounded-3xl border border-border-highlight bg-bg-card shadow-2xl shadow-black/90 animate-scale-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 border border-white/20 text-white hover:bg-black/95 transition-colors cursor-pointer z-20 shadow-md backdrop-blur-md"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* 1. Cinematic Backdrop */}
          <ModalBackdropHeader
            backdropUrl={backdropUrl}
            posterUrl={posterUrl}
            onError={() => setBackdropError(true)}
          />

          <div className="relative px-5 sm:px-7 pb-6 -mt-16 sm:-mt-20">
            {/* Top Poster + Title Block */}
            <div className="flex gap-4 sm:gap-5 mb-4 items-end">
              <div className="relative aspect-[2/3] w-24 sm:w-32 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-border-highlight bg-bg-surface shadow-2xl z-10">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={title}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-text-muted bg-bg-surface">
                    <Film className="h-6 w-6 mb-1 opacity-50 text-brand-indigo" />
                    <span className="text-[10px] line-clamp-2 font-medium">{title}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col pb-1">
                <h2
                  id="movie-details-title"
                  className="font-display text-xl sm:text-2xl font-extrabold text-text-main leading-tight mb-1.5 drop-shadow-sm"
                >
                  {title}
                </h2>

                {tagline ? (
                  <p className="text-xs text-brand-indigo/90 italic font-medium mb-2 line-clamp-2">
                    &ldquo;{tagline}&rdquo;
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {formattedRating ? (
                    <Badge variant="host" size="sm" className="gap-1 font-bold bg-brand-amber/20 border-brand-amber/40 text-brand-amber">
                      <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
                      {formattedRating} / 10
                    </Badge>
                  ) : null}

                  {contentRating ? (
                    <Badge variant="subtle" size="sm" className="font-bold border-brand-violet/40 bg-brand-violet/15 text-brand-violet">
                      <ShieldAlert className="h-3 w-3" />
                      {contentRating}
                    </Badge>
                  ) : null}

                  {formattedRuntime ? (
                    <Badge variant="subtle" size="sm" className="gap-1">
                      <Clock className="h-3 w-3 text-text-muted" />
                      {formattedRuntime}
                    </Badge>
                  ) : null}

                  {releaseYear ? (
                    <Badge variant="subtle" size="sm" className="gap-1">
                      <Calendar className="h-3 w-3 text-text-muted" />
                      {releaseYear}
                    </Badge>
                  ) : null}
                </div>

                {isInDeck ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-emerald mt-2">
                    <Check className="h-3.5 w-3.5" /> In your nomination deck
                  </div>
                ) : null}
              </div>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center gap-2 py-2 text-xs text-brand-indigo/80">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading credits & streaming data...</span>
              </div>
            ) : null}

            {/* 2. Genres */}
            {genres.length > 0 ? (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  <Tag className="h-3.5 w-3.5 text-brand-indigo" />
                  <span>Genres</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-indigo/15 border border-brand-indigo/30 text-text-main shadow-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 3. Director & Starring Cast (Show More expandable) */}
            <ModalCastSection directors={directors} topCast={topCast} />

            {/* 4. Overview / Synopsis */}
            <div className="mb-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Overview / Synopsis
              </h3>
              <div className="p-4 rounded-2xl bg-bg-surface/70 border border-border-subtle/80">
                {overview && overview.trim().length > 0 ? (
                  <p className="text-xs sm:text-sm leading-relaxed text-text-secondary">
                    {overview}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-text-muted italic">
                    No synopsis is currently available from TMDB for this title.
                  </p>
                )}
              </div>
            </div>

            {/* 5. Key Metadata Grid */}
            <ModalMetadataGrid
              releaseDate={releaseDate}
              formattedVoteCount={formattedVoteCount}
              language={language}
              tmdbId={movie.tmdbId}
            />

            {/* 6. Where to Watch & Stream */}
            <ModalStreamingSection streamingProviders={streamingProviders} />

            {/* 7. External TMDB Link */}
            <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border-subtle/50">
              <span className="text-[11px]">Source: The Movie Database (TMDB)</span>
              <a
                href={detailedData?.tmdbUrl || `https://www.themoviedb.org/movie/${movie.tmdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-indigo hover:text-brand-violet hover:underline font-medium transition-colors"
              >
                <span>View full page on TMDB</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 8. Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-border-subtle bg-bg-surface/90 backdrop-blur-md">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Close
          </Button>

          {isInDeck ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={disabled}
              onClick={handleToggle}
              className="gap-1.5"
            >
              <X className="h-4 w-4" /> Remove from Deck
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={disabled}
              onClick={handleToggle}
              className="gap-1.5 shadow-md shadow-brand-indigo/25"
            >
              <Plus className="h-4 w-4" /> Add to Deck
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
});
