import * as React from "react";
import { Film, X, Info } from "lucide-react";
import type { MovieSubmissionDto } from "@/types";

export interface SelectionRackItemProps {
  movie: MovieSubmissionDto;
  hasSubmitted: boolean;
  onRemoveMovie: (tmdbId: number) => void;
  onSelectMovie?: (movie: MovieSubmissionDto) => void;
}

export const SelectionRackItem = React.memo(function SelectionRackItem({
  movie,
  hasSubmitted,
  onRemoveMovie,
  onSelectMovie,
}: SelectionRackItemProps) {
  const [imageError, setImageError] = React.useState(false);

  const posterSrc =
    !imageError && movie.posterPath
      ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
      : null;

  return (
    <div
      onClick={() => onSelectMovie?.(movie)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectMovie?.(movie);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${movie.title}`}
      className="group relative h-20 w-14 sm:h-24 sm:w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-md hover:scale-105 hover:border-brand-indigo/60 hover:ring-2 hover:ring-brand-indigo/30 transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
      title={`${movie.title} (Click to inspect)`}
    >
      {posterSrc ? (
        <img
          src={posterSrc}
          alt={movie.title}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center text-text-muted">
          <Film className="h-5 w-5 mb-1 opacity-50 text-brand-indigo" />
          <span className="text-[9px] line-clamp-2 leading-tight font-medium">
            {movie.title}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <Info className="h-4 w-4 text-white" />
      </div>

      {!hasSubmitted ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveMovie(movie.tmdbId);
          }}
          aria-label={`Remove ${movie.title} from deck`}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white opacity-90 hover:bg-brand-coral hover:opacity-100 transition-all cursor-pointer shadow-sm z-10"
          title="Remove from deck"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
});
