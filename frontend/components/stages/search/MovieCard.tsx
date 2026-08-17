"use client";

import * as React from "react";
import { Star, Plus, Check, Film, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { MovieDto } from "@/types";
import { cn } from "@/lib/utils";

export interface MovieCardProps {
  movie: MovieDto;
  isInDeck: boolean;
  onToggleDeck: (movie: MovieDto) => void;
  onSelectMovie?: (movie: MovieDto) => void;
  disabled?: boolean;
  className?: string;
}

export const MovieCard = React.memo(function MovieCard({
  movie,
  isInDeck,
  onToggleDeck,
  onSelectMovie,
  disabled = false,
  className,
}: MovieCardProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [movie.posterPath, movie.tmdbId]);

  const posterUrl =
    !imageError && movie.posterPath
      ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
      : null;

  const handleCardClick = () => {
    onSelectMovie?.(movie);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        handleCardClick();
      }
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onToggleDeck(movie);
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectMovie?.(movie);
  };

  const formattedRating =
    movie.voteAverage && movie.voteAverage > 0
      ? movie.voteAverage.toFixed(1)
      : null;

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border border-border-subtle bg-bg-surface shadow-lg shadow-black/40 transition-all duration-200 hover:-translate-y-1 hover:border-border-highlight hover:shadow-xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
        isInDeck && "border-brand-emerald/40 ring-1 ring-brand-emerald/30",
        className
      )}
      role="article"
      aria-label={movie.title}
    >
      {/* Poster Image or Fallback */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-bg-elevated flex items-center justify-center">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-text-muted">
            <Film className="h-10 w-10 mb-2 opacity-50 text-brand-indigo" />
            <span className="text-xs font-semibold text-text-secondary line-clamp-2">
              {movie.title}
            </span>
          </div>
        )}

        {/* Ambient Bottom Gradient on Poster */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent opacity-80" />

        {/* Floating Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          {movie.releaseYear ? (
            <span className="rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-text-secondary backdrop-blur-md">
              {movie.releaseYear}
            </span>
          ) : (
            <span />
          )}

          {formattedRating ? (
            <span className="flex items-center gap-1 rounded-md border border-brand-amber/30 bg-black/70 px-2 py-0.5 text-[11px] font-bold text-brand-amber backdrop-blur-md">
              <Star className="h-3 w-3 fill-brand-amber text-brand-amber" />
              {formattedRating}
            </span>
          ) : null}
        </div>

        {/* Quick Details Hover Trigger */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          <Badge variant="subtle" size="sm" className="gap-1 bg-black/80 backdrop-blur-md text-white border-white/20">
            <Info className="h-3 w-3 text-brand-indigo" /> View Details
          </Badge>
        </div>
      </div>

      {/* Card Info & Actions */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
        <div>
          <h3
            className="font-display text-sm sm:text-base font-bold text-text-main line-clamp-1 group-hover:text-brand-indigo transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>

          {movie.overview && movie.overview.trim().length > 0 ? (
            <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {movie.overview}
            </p>
          ) : (
            <p className="mt-1 text-xs text-text-muted italic">
              Click to view movie details.
            </p>
          )}
        </div>

        {/* Action Row: Info Trigger + Add/In Deck Button */}
        <div className="mt-3 pt-1 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleInfoClick}
            aria-label={`View details for ${movie.title}`}
            className="flex-shrink-0 h-8 px-2.5 text-text-muted hover:text-text-main border border-border-subtle hover:border-brand-indigo/50 hover:bg-brand-indigo/10"
            title="View full movie details"
          >
            <Info className="h-3.5 w-3.5 text-brand-indigo" />
          </Button>

          {isInDeck ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleActionClick}
              disabled={disabled}
              className="flex-1 h-8 bg-brand-emerald/15 border-brand-emerald/40 text-brand-emerald hover:bg-brand-coral/15 hover:border-brand-coral/40 hover:text-brand-coral transition-colors"
            >
              <Check className="h-3.5 w-3.5 mr-1" /> In Deck
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleActionClick}
              disabled={disabled}
              className="flex-1 h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add to Deck
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
