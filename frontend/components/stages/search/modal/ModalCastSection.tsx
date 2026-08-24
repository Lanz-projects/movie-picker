import * as React from "react";
import { Clapperboard, Users, ChevronDown, ChevronUp } from "lucide-react";

interface ModalCastSectionProps {
  directors: string[];
  topCast: string[];
}

export const ModalCastSection = React.memo(function ModalCastSection({
  directors,
  topCast,
}: ModalCastSectionProps) {
  const [showAllCast, setShowAllCast] = React.useState(false);
  const initialLimit = 4;
  const hasMoreCast = topCast.length > initialLimit;
  const visibleCast = showAllCast ? topCast : topCast.slice(0, initialLimit);

  if (directors.length === 0 && topCast.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 mb-4 p-4 rounded-2xl bg-bg-surface/60 border border-border-subtle">
      {directors.length > 0 ? (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1 mb-1">
            <Clapperboard className="h-3 w-3 text-brand-indigo" />
            {directors.length > 1 ? "Directors" : "Director"}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-text-main">
            {directors.join(", ")}
          </span>
        </div>
      ) : null}

      {topCast.length > 0 ? (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1 mb-1.5">
            <Users className="h-3.5 w-3.5 text-brand-indigo" />
            Starring Cast
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleCast.map((actor) => (
              <span
                key={actor}
                className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-bg-elevated border border-border-subtle text-text-secondary"
              >
                {actor}
              </span>
            ))}

            {hasMoreCast ? (
              <button
                type="button"
                onClick={() => setShowAllCast((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/20 border border-brand-indigo/30 transition-colors cursor-pointer"
              >
                {showAllCast ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span>+{topCast.length - initialLimit} more</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
});
