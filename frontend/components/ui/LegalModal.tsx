"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Film, Sparkles, Code2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptySubscribe = () => () => {};

export function LegalModal({ isOpen, onClose }: LegalModalProps) {
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-bg-surface p-6 sm:p-8 shadow-2xl shadow-black/80 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-violet/10 border border-brand-violet/20 text-brand-violet">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-xl font-bold text-text-primary tracking-tight">
                Privacy & Attributions
              </h2>
              <p className="text-xs text-text-secondary">
                Legal disclosures, third-party API attributions, and privacy policy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          {/* TMDB Attribution Section */}
          <section className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Film className="h-4 w-4 text-emerald-400" />
              <h3>The Movie Database (TMDB) Attribution</h3>
            </div>
            <p>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
            <p className="text-xs text-text-tertiary">
              Movie metadata, poster artwork, cast directories, genre classifications, and streaming provider data are sourced from The Movie Database (TMDB) under their API Terms of Use.
            </p>
          </section>

          {/* Google Gemini AI Transparency */}
          <section className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Sparkles className="h-4 w-4 text-brand-violet" />
              <h3>Google Gemini AI Disclosure</h3>
            </div>
            <p>
              Conversational movie recommendations provided in the &quot;I&apos;m Lost&quot; AI Concierge feature are generated using Google Gemini Large Language Model APIs.
            </p>
            <p className="text-xs text-text-tertiary">
              AI-generated suggestions and reasoning are produced dynamically based on user prompts and room conversational context.
            </p>
          </section>

          {/* Privacy Notice */}
          <section className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <h3>Privacy Notice & Ephemeral Data Handling</h3>
            </div>
            <p>
              Movie Picker is built with a privacy-first, ephemeral design:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-text-tertiary ml-1">
              <li>No personal accounts, email addresses, or passwords are required or stored.</li>
              <li>Room sessions, user display nicknames, and voting ballots are ephemeral and retained only for the duration of the active voting session.</li>
              <li>We do not sell, track, or share personal data or employ third-party advertising tracking cookies.</li>
            </ul>
          </section>

          {/* Open Source / License */}
          <section className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Code2 className="h-4 w-4 text-amber-400" />
              <h3>Open Source & License</h3>
            </div>
            <p className="text-xs text-text-tertiary">
              Movie Picker is open-source software licensed under the MIT License. All trademarks, service marks, and company names are the property of their respective owners.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end">
          <Button variant="primary" onClick={onClose} className="px-6">
            Got it
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
