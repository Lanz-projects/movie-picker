"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { X, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface QRCodeModalProps {
  isOpen: boolean;
  roomCode: string;
  onClose: () => void;
}

const emptySubscribe = () => () => {};

export function QRCodeModal({ isOpen, roomCode, onClose }: QRCodeModalProps) {
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [copied, setCopied] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const inviteUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?join=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  // Render QR Code onto Canvas whenever isOpen or inviteUrl changes
  React.useEffect(() => {
    if (!isOpen || !canvasRef.current || !inviteUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      inviteUrl,
      {
        width: 220,
        margin: 2,
        color: {
          dark: "#0b0c16",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err) => {
        if (err) console.error("Failed to render QR Code:", err);
      }
    );
  }, [isOpen, inviteUrl]);

  // Handle Escape key
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

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-bg-surface border border-brand-violet/30 shadow-2xl shadow-brand-violet/10 p-6 sm:p-7 text-center relative flex flex-col items-center gap-4 animate-scale-up"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close QR Code dialog"
          className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-violet/15 border border-brand-violet/30 text-brand-violet text-xs font-bold mt-1">
          <Sparkles className="h-3.5 w-3.5" /> Room QR Code
        </div>

        <div>
          <h2
            id="qr-modal-title"
            className="text-xl font-bold font-display text-white tracking-tight"
          >
            Scan to Join Room
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Point your phone camera to jump straight in
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-brand-violet/20 border-4 border-white/90">
          <canvas
            ref={canvasRef}
            className="block rounded-lg"
            aria-label={`QR Code to join room ${roomCode}`}
          />
        </div>

        {/* Room Code Indicator & Copy */}
        <div className="flex items-center gap-2 bg-bg-elevated px-4 py-2 rounded-xl border border-border-subtle">
          <span className="text-xs text-text-secondary">Code:</span>
          <span className="font-mono text-sm font-black tracking-widest text-brand-cyan">
            {roomCode}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy invite link from QR modal"
            className="ml-2 p-1 text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Copy Invite Link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          className="w-full mt-1 font-semibold"
        >
          Close
        </Button>
      </div>
    </div>,
    document.body
  );
}
