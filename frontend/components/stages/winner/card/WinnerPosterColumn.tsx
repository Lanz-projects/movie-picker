"use client";

import * as React from "react";
import Image from "next/image";
import { Film } from "lucide-react";

export interface WinnerPosterColumnProps {
  title: string;
  posterPath: string | null;
  tmdbId?: number;
}

export const WinnerPosterColumn = React.memo(function WinnerPosterColumn({
  title,
  posterPath,
  tmdbId,
}: WinnerPosterColumnProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [posterPath, tmdbId]);

  const posterUrl =
    !imageError && posterPath
      ? `https://image.tmdb.org/t/p/w780${posterPath}`
      : null;

  return (
    <div className="sm:col-span-5 flex justify-center sm:block">
      <div className="relative aspect-[2/3] w-48 sm:w-full overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface shadow-lg shadow-black/60 group">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 192px, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-text-muted p-4 text-center">
            <Film className="h-12 w-12 opacity-40" />
            <span className="text-xs">No Poster Available</span>
          </div>
        )}
      </div>
    </div>
  );
});
