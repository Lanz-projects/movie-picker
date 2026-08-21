"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { UserX, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface KickedModalProps {
  isOpen: boolean;
  message?: string;
  onDismiss: () => void;
}

const emptySubscribe = () => () => {};

export function KickedModal({
  isOpen,
  message = "You have been removed from the session by the host.",
  onDismiss,
}: KickedModalProps) {
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kicked-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-bg-surface border border-brand-rose/30 shadow-2xl p-6 sm:p-7 text-center relative flex flex-col items-center gap-4">
        {/* Glowing Icon Circle */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-rose/10 border border-brand-rose/30 text-brand-rose shadow-[0_0_24px_rgba(244,63,94,0.25)]">
          <UserX className="h-8 w-8" />
        </div>

        <div>
          <h2
            id="kicked-modal-title"
            className="text-xl font-bold font-display text-white tracking-tight"
          >
            Removed from Session
          </h2>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            {message}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onDismiss}
          className="w-full mt-2 gap-2 justify-center shadow-lg shadow-brand-indigo/20 font-bold"
        >
          Return to Home
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>,
    document.body
  );
}
