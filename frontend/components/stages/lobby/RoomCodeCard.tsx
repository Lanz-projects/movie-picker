"use client";

import * as React from "react";
import { Copy, Check, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface RoomCodeCardProps {
  roomCode: string;
  memberCount: number;
  maxUsers: number;
}

export function RoomCodeCard({
  roomCode,
  memberCount,
  maxUsers,
}: RoomCodeCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          onClick={handleCopy}
          aria-label="Copy room code"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle text-text-muted hover:text-white hover:bg-bg-elevated hover:border-brand-violet/40 transition-all cursor-pointer active:scale-95 shadow-md shadow-black/30"
          title="Copy room code"
        >
          {copied ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>

      <p className="text-xs text-text-secondary">
        {copied ? (
          <span className="text-emerald-400 font-semibold">
            Copied to clipboard!
          </span>
        ) : (
          "Tap the copy button to share your code"
        )}
      </p>
    </Card>
  );
}
