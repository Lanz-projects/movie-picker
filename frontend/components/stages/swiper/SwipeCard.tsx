"use client";

import * as React from "react";
import { Film, Info, User } from "lucide-react";
import { SwipeStamp } from "./SwipeStamp";
import { Badge } from "@/components/ui/Badge";
import type { MovieSuggestionResponse, VoteType } from "@/types";
import { cn } from "@/lib/utils";

export interface SwipeCardProps {
  movie: MovieSuggestionResponse;
  isTop?: boolean;
  stackIndex?: number;
  onSwipe?: (voteType: VoteType) => void;
  onOpenDetails?: (movie: MovieSuggestionResponse) => void;
  exitDirection?: VoteType | null;
  className?: string;
}

export const SwipeCard = React.memo(function SwipeCard({
  movie,
  isTop = false,
  stackIndex = 0,
  onSwipe,
  onOpenDetails,
  exitDirection = null,
  className,
}: SwipeCardProps) {
  const [failedPosterUrl, setFailedPosterUrl] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [offset, setOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const cardRef = React.useRef<HTMLDivElement>(null);
  const startPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pendingOffsetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const rawPosterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    : null;

  const posterUrl = rawPosterUrl && failedPosterUrl !== rawPosterUrl ? rawPosterUrl : null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTop || exitDirection) return;

    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    pendingOffsetRef.current = { x: 0, y: 0 };
    if (typeof cardRef.current?.setPointerCapture === "function") {
      try {
        cardRef.current.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback for pointer capture
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isTop) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    pendingOffsetRef.current = { x: deltaX, y: deltaY };

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        setOffset(pendingOffsetRef.current);
        rafIdRef.current = null;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isTop) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    setIsDragging(false);
    if (typeof cardRef.current?.releasePointerCapture === "function") {
      try {
        cardRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback for pointer release
      }
    }

    const { x: deltaX, y: deltaY } = pendingOffsetRef.current;
    const SWIPE_X_THRESHOLD = 90;
    const SWIPE_Y_THRESHOLD = -80;

    if (deltaY < SWIPE_Y_THRESHOLD && Math.abs(deltaX) < 80) {
      onSwipe?.("SUPERLIKE");
    } else if (deltaX > SWIPE_X_THRESHOLD) {
      onSwipe?.("LIKE");
    } else if (deltaX < -SWIPE_X_THRESHOLD) {
      onSwipe?.("PASS");
    } else {
      pendingOffsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerCancel = () => {
    if (!isTop) return;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsDragging(false);
    pendingOffsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
  };

  const rotation = isTop ? offset.x * 0.07 : 0;
  const likeOpacity = isTop && offset.x > 20 ? Math.min(1, (offset.x - 20) / 70) : 0;
  const passOpacity = isTop && offset.x < -20 ? Math.min(1, (-offset.x - 20) / 70) : 0;
  const superlikeOpacity =
    isTop && offset.y < -20 && Math.abs(offset.x) < 60
      ? Math.min(1, (-offset.y - 20) / 60)
      : 0;

  const getStackStyle = (): React.CSSProperties => {
    if (exitDirection) {
      const exitTransforms = {
        LIKE: "translate3d(600px, 0, 0) rotate(25deg)",
        PASS: "translate3d(-600px, 0, 0) rotate(-25deg)",
        SUPERLIKE: "translate3d(0, -600px, 0) rotate(0deg)",
      };
      return {
        zIndex: 10,
        transform: exitTransforms[exitDirection],
        opacity: 0,
        transition: "transform 0.35s ease-in, opacity 0.3s ease-in",
      };
    }

    if (isTop) {
      return {
        zIndex: 5,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        cursor: isDragging ? "grabbing" : "grab",
      };
    }

    if (stackIndex === 1) {
      return {
        zIndex: 2,
        transform: "scale(0.95) translateY(14px)",
        opacity: 0.7,
        transition: "all 0.3s ease-out",
        pointerEvents: "none",
      };
    }

    return {
      zIndex: 1,
      transform: "scale(0.90) translateY(28px)",
      opacity: 0.4,
      transition: "all 0.3s ease-out",
      pointerEvents: "none",
    };
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={getStackStyle()}
      className={cn(
        "absolute inset-0 mx-auto flex flex-col w-full max-w-[480px] h-[500px] sm:h-[540px] select-none touch-none overflow-hidden rounded-3xl border border-border-subtle bg-bg-card shadow-2xl shadow-black/80 will-change-transform",
        className
      )}
      role="article"
      aria-label={movie.title}
    >
      {isTop && (
        <>
          <SwipeStamp type="LIKE" opacity={likeOpacity} />
          <SwipeStamp type="PASS" opacity={passOpacity} />
          <SwipeStamp type="SUPERLIKE" opacity={superlikeOpacity} />
        </>
      )}

      <div className="relative h-full w-full overflow-hidden bg-bg-elevated">
        {posterUrl ? (
          <img
            key={posterUrl}
            src={posterUrl}
            alt={movie.title}
            onError={() => setFailedPosterUrl(rawPosterUrl)}
            className="h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-text-muted bg-gradient-to-b from-bg-surface to-bg-card">
            <Film className="h-16 w-16 mb-4 opacity-40 text-brand-indigo" />
            <span className="font-display text-lg font-bold text-text-secondary line-clamp-3">
              {movie.title}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/70 to-transparent" />

        <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
          {movie.releaseYear ? (
            <span className="rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-bold text-text-secondary backdrop-blur-md">
              {movie.releaseYear}
            </span>
          ) : (
            <span />
          )}

          {movie.userDisplayName ? (
            <Badge variant="subtle" size="sm" className="gap-1 bg-black/70 backdrop-blur-md border-white/10">
              <User className="h-3 w-3 text-brand-indigo" />
              Nominated by {movie.userDisplayName}
            </Badge>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end z-10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2
              className="font-display text-2xl sm:text-3xl font-extrabold text-text-main leading-tight line-clamp-2 drop-shadow-md"
              title={movie.title}
            >
              {movie.title}
            </h2>

            {onOpenDetails ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(movie);
                }}
                aria-label={`View details for ${movie.title}`}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/60 border border-white/15 text-text-secondary hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer backdrop-blur-md"
                title="Inspect movie details"
              >
                <Info className="h-5 w-5 text-brand-indigo" />
              </button>
            ) : null}
          </div>

          {movie.overview ? (
            <p className="text-xs sm:text-sm leading-relaxed text-text-secondary line-clamp-3 mb-1 drop-shadow-sm">
              {movie.overview}
            </p>
          ) : (
            <p className="text-xs text-text-muted italic mb-1">
              No description available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
