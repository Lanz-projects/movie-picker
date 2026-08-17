import * as React from "react";
import { Film } from "lucide-react";

interface ModalBackdropHeaderProps {
  backdropUrl: string | null;
  posterUrl: string | null;
  onError: () => void;
}

export const ModalBackdropHeader = React.memo(function ModalBackdropHeader({
  backdropUrl,
  posterUrl,
  onError,
}: ModalBackdropHeaderProps) {
  return (
    <div className="relative w-full h-44 sm:h-52 bg-bg-elevated overflow-hidden">
      {backdropUrl ? (
        <img
          src={backdropUrl}
          alt=""
          onError={onError}
          className="h-full w-full object-cover object-center filter brightness-90"
        />
      ) : posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="h-full w-full object-cover filter blur-md scale-110 opacity-40"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-indigo/20 via-bg-elevated to-bg-card flex items-center justify-center">
          <Film className="h-16 w-16 text-brand-indigo/30" />
        </div>
      )}

      {/* Gradient Vignette over backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/60 to-transparent" />
    </div>
  );
});
