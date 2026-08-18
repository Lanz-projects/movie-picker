"use client";

import * as React from "react";
import { Copy, Check, Users, Share2, QrCode, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface RoomCodeCardProps {
  roomCode: string;
  memberCount: number;
  maxUsers: number;
  onOpenQrCode?: () => void;
}

export function RoomCodeCard({
  roomCode,
  memberCount,
  maxUsers,
  onOpenQrCode,
}: RoomCodeCardProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [isInviteOptionsOpen, setIsInviteOptionsOpen] = React.useState(false);

  const getInviteUrl = React.useCallback(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?join=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareLink = async () => {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Movie Picker",
          text: `Join my Movie Picker room (${roomCode}) to pick what we watch!`,
          url: inviteUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Card variant="glass" className="w-full p-6 text-center">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Lobby Open
          </span>
        </div>

        <Badge variant="subtle" size="sm" className="gap-1.5 font-semibold">
          <Users className="h-3.5 w-3.5 text-brand-cyan" />
          {memberCount} / {maxUsers} Players
        </Badge>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-2">
        Share this 6-Character Code with Friends
      </p>

      {/* Large 6-Character Room Code */}
      <div className="flex items-center justify-center gap-3 my-3">
        <div className="rounded-2xl border border-brand-violet/40 bg-brand-violet/10 px-6 py-3 shadow-inner shadow-brand-violet/20">
          <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white select-all">
            {roomCode}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          aria-label="Copy room code"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated hover:border-brand-violet/40 transition-all cursor-pointer active:scale-95 shadow-md shadow-black/30"
          title="Copy room code"
        >
          {copiedCode ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>

      <p className="text-xs text-text-secondary mb-3">
        {copiedCode ? (
          <span className="text-emerald-400 font-semibold">
            Room code copied!
          </span>
        ) : (
          "Tap copy to share code directly"
        )}
      </p>

      {/* Collapsible Invite Options Hub */}
      <div className="pt-3 border-t border-border-subtle/60 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsInviteOptionsOpen((prev) => !prev)}
          aria-expanded={isInviteOptionsOpen}
          aria-label="Toggle invite options"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text-main hover:bg-bg-surface transition-all cursor-pointer active:scale-98"
        >
          <Share2 className="h-3.5 w-3.5 text-brand-cyan" />
          <span>
            {isInviteOptionsOpen
              ? "Hide Invite Options"
              : "More Ways to Invite (Link & QR)"}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isInviteOptionsOpen && "rotate-180"
            )}
          />
        </button>

        {/* Revealed 50/50 Action Bar */}
        {isInviteOptionsOpen && (
          <div className="mt-3 w-full grid grid-cols-2 gap-2.5 animate-scale-up">
            <button
              type="button"
              onClick={handleShareLink}
              aria-label="Share invite link"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-brand-cyan/40 text-xs sm:text-sm font-semibold text-text-main hover:text-white transition-all cursor-pointer shadow-sm active:scale-98"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 truncate">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-brand-cyan shrink-0" />
                  <span className="truncate">Share Link</span>
                </>
              )}
            </button>

            {onOpenQrCode ? (
              <button
                type="button"
                onClick={onOpenQrCode}
                aria-label="Show QR Code"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-brand-violet/40 text-xs sm:text-sm font-semibold text-text-main hover:text-white transition-all cursor-pointer shadow-sm active:scale-98"
                title="Scan QR Code to join"
              >
                <QrCode className="h-4 w-4 text-brand-violet shrink-0" />
                <span className="truncate">Show QR</span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}
