"use client";

import * as React from "react";
import { LegalModal } from "@/components/ui/LegalModal";

export function Footer() {
  const [isLegalOpen, setIsLegalOpen] = React.useState(false);

  return (
    <>
      <footer className="mt-auto border-t border-white/5 py-4 px-4 text-center text-xs text-text-tertiary">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span>Movie Picker</span>
          <span className="text-white/20">·</span>
          <span>Powered by Next.js & Spring Boot</span>
          <span className="text-white/20">·</span>
          <button
            onClick={() => setIsLegalOpen(true)}
            className="text-text-secondary hover:text-brand-violet transition-colors underline-offset-2 hover:underline focus:outline-none focus:ring-1 focus:ring-brand-violet rounded"
          >
            Privacy & Attributions
          </button>
        </div>
      </footer>

      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
    </>
  );
}
