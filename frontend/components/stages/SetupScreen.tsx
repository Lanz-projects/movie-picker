"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Clapperboard, Sparkles, KeyRound, AlertCircle, X } from "lucide-react";
import { StageContainer } from "@/components/layout/StageContainer";
import { Card } from "@/components/ui/Card";
import { HostRoomForm } from "./forms/HostRoomForm";
import { JoinRoomForm } from "./forms/JoinRoomForm";
import { useSession } from "@/context/SessionContext";
import { cn } from "@/lib/utils";

function SetupScreenContent() {
  const searchParams = useSearchParams();
  const joinParam = searchParams?.get("join") || searchParams?.get("code") || searchParams?.get("room") || "";
  const initialRoomCode = joinParam.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  const [activeTab, setActiveTab] = React.useState<"host" | "join">(
    initialRoomCode ? "join" : "host"
  );
  const { createRoom, joinRoom, isLoading, error, clearError } = useSession();

  const handleHostSubmit = async (
    hostName: string,
    maxUsers: number,
    maxSuggestions: number
  ) => {
    try {
      await createRoom(hostName, maxUsers, maxSuggestions);
    } catch {
      // Error handled in context state
    }
  };

  const handleJoinSubmit = async (roomCode: string, displayName: string) => {
    try {
      await joinRoom(roomCode, displayName);
    } catch {
      // Error handled in context state
    }
  };

  return (
    <StageContainer maxWidth="md">
      {/* Cinema Hero Title */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-tr from-brand-indigo to-brand-violet text-white shadow-xl shadow-brand-indigo/30 mb-4 animate-bounce duration-1000">
          <Clapperboard className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white">
          What Should We Watch?
        </h1>
        <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-sm">
          Swipe, match, and find the perfect movie for your group in seconds.
        </p>
      </div>

      {/* Main Card Container */}
      <Card variant="card" className="w-full p-6 sm:p-8">
        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-bg-surface p-1 border border-border-subtle mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("host");
              clearError();
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
              activeTab === "host"
                ? "bg-bg-elevated text-white shadow-md shadow-black/40 border border-white/5"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <Sparkles className="h-4 w-4 text-brand-violet" />
            Host a Room
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("join");
              clearError();
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
              activeTab === "join"
                ? "bg-bg-elevated text-white shadow-md shadow-black/40 border border-white/5"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <KeyRound className="h-4 w-4 text-brand-cyan" />
            Join with Code
          </button>
        </div>

        {/* Inline Server Error Banner */}
        {error ? (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-brand-coral/30 bg-brand-coral/10 p-3.5 text-xs text-brand-coral animate-stage-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-brand-coral/70 hover:text-brand-coral p-0.5 rounded cursor-pointer"
              title="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {/* Active Form */}
        {activeTab === "host" ? (
          <HostRoomForm onSubmit={handleHostSubmit} isLoading={isLoading} />
        ) : (
          <JoinRoomForm
            onSubmit={handleJoinSubmit}
            isLoading={isLoading}
            initialRoomCode={initialRoomCode}
          />
        )}
      </Card>
    </StageContainer>
  );
}

export function SetupScreen() {
  return (
    <React.Suspense fallback={null}>
      <SetupScreenContent />
    </React.Suspense>
  );
}
