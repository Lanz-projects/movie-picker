import * as React from "react";
import { Globe, Hash } from "lucide-react";

interface ModalMetadataGridProps {
  releaseDate: string | null;
  formattedVoteCount: string | null;
  language: string | null;
  tmdbId: number;
}

export const ModalMetadataGrid = React.memo(function ModalMetadataGrid({
  releaseDate,
  formattedVoteCount,
  language,
  tmdbId,
}: ModalMetadataGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-2xl bg-bg-surface/50 border border-border-subtle">
      {releaseDate ? (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-muted">Release Date</span>
          <span className="text-xs font-medium text-text-main">{releaseDate}</span>
        </div>
      ) : null}

      {formattedVoteCount ? (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-muted">Audience Votes</span>
          <span className="text-xs font-medium text-text-main">{formattedVoteCount}</span>
        </div>
      ) : null}

      {language ? (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-muted">Language</span>
          <span className="text-xs font-medium text-text-main flex items-center gap-1">
            <Globe className="h-3 w-3 text-text-muted" />
            {language}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-text-muted">TMDB ID</span>
        <span className="text-xs font-medium text-text-main flex items-center gap-1">
          <Hash className="h-3 w-3 text-text-muted" />
          #{tmdbId}
        </span>
      </div>
    </div>
  );
});
