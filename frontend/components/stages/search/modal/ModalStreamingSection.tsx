import * as React from "react";
import { Tv } from "lucide-react";
import type { StreamingProviderDto } from "@/types";

interface ModalStreamingSectionProps {
  streamingProviders: StreamingProviderDto[];
}

export const ModalStreamingSection = React.memo(function ModalStreamingSection({
  streamingProviders,
}: ModalStreamingSectionProps) {
  if (streamingProviders.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3.5 rounded-2xl bg-brand-indigo/5 border border-brand-indigo/25">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-indigo uppercase tracking-wider mb-2.5">
        <Tv className="h-3.5 w-3.5" />
        <span>Where to Watch & Stream</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {streamingProviders.map((provider) => (
          <div
            key={`${provider.type}-${provider.providerId}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-bg-elevated/80 border border-border-subtle shadow-xs"
            title={`${provider.providerName} (${provider.type})`}
          >
            {provider.logoPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${provider.logoPath}`}
                alt={provider.providerName}
                className="h-4 w-4 rounded-md object-cover"
              />
            ) : (
              <Tv className="h-3.5 w-3.5 text-text-muted" />
            )}
            <span className="text-xs font-medium text-text-main">
              {provider.providerName}
            </span>
            <span className="text-[10px] font-semibold text-brand-indigo/80 bg-brand-indigo/10 px-1 py-0.2 rounded">
              {provider.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
