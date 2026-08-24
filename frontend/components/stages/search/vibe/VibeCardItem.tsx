"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, Check, Star } from "lucide-react";
import type { MovieDto } from "@/types";

export interface VibeCardItemProps {
  movie: MovieDto;
  inDeck: boolean;
  isDeckFull: boolean;
  onToggleDeck: (movie: MovieDto) => void;
}

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export function VibeCardItem({
  movie,
  inDeck,
  isDeckFull,
  onToggleDeck,
}: VibeCardItemProps) {
  const posterSrc = movie.posterPath ? `${TMDB_IMAGE_BASE_URL}${movie.posterPath}` : null;

  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-bg-surface/50 border border-border-subtle hover:border-border-highlight transition-all">
      {/* Movie Poster Thumbnail */}
      <div
        className="relative w-16 h-24 rounded-xl overflow-hidden bg-bg-surface flex-shrink-0 border border-border-subtle"
        style={{ position: "relative", width: "64px", height: "96px" }}
      >
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={movie.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px] text-center p-1 font-medium">
            No Poster
          </div>
        )}
      </div>

      {/* Movie Info & Reasoning */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-bold text-text-main truncate">
              {movie.title}
            </h3>
            {movie.releaseYear ? (
              <span className="text-xs text-text-muted">({movie.releaseYear})</span>
            ) : null}
            {movie.voteAverage ? (
              <span className="inline-flex items-center gap-0.5 text-xs text-brand-amber font-semibold">
                <Star className="w-3 h-3 fill-brand-amber" />
                {movie.voteAverage.toFixed(1)}
              </span>
            ) : null}
          </div>

          {/* Reasoning / Vibe Justification */}
          {movie.aiReasoning ? (
            <p className="mt-1 text-xs text-brand-violet/90 font-medium line-clamp-2">
              <span className="font-semibold text-brand-violet">Why it fits: </span>
              {movie.aiReasoning}
            </p>
          ) : movie.overview ? (
            <p className="mt-1 text-xs text-text-secondary line-clamp-2">
              {movie.overview}
            </p>
          ) : null}
        </div>

        {/* Action Button */}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onToggleDeck(movie)}
            disabled={!inDeck && isDeckFull}
            aria-label={inDeck ? `Remove ${movie.title} from deck` : `Nominate ${movie.title}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              inDeck
                ? "bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/40 hover:bg-brand-emerald/25"
                : isDeckFull
                ? "bg-bg-surface text-text-muted border border-border-subtle cursor-not-allowed"
                : "bg-brand-indigo/15 text-brand-indigo hover:bg-brand-indigo/25 border border-brand-indigo/30"
            }`}
          >
            {inDeck ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Nominated</span>
              </>
            ) : isDeckFull ? (
              <span>Deck Full</span>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Nominate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
