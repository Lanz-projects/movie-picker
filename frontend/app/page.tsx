"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { SetupScreen } from "@/components/stages/SetupScreen";
import { LobbyScreen } from "@/components/stages/LobbyScreen";
import { SearchScreen } from "@/components/stages/SearchScreen";
import { SwiperScreen } from "@/components/stages/SwiperScreen";
import { WinnerScreen } from "@/components/stages/WinnerScreen";
import { useSession } from "@/context/SessionContext";

export default function Home() {
  const { session, currentUser, isHost, stage, leaveRoom, isConnected, isRehydrating } =
    useSession();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky Cinema Navigation */}
      <Header
        roomCode={session?.roomCode}
        nickname={currentUser?.displayName}
        isHost={isHost}
        memberCount={session?.users.length}
        isConnected={isConnected}
        onLeaveRoom={session ? leaveRoom : undefined}
      />

      {/* Dynamic Stage Rendering */}
      {isRehydrating ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 animate-fade-in text-center">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute h-10 w-10 animate-ping rounded-full bg-brand-violet/30" />
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-violet border-t-transparent" />
            </div>
            <p className="text-sm font-semibold text-text-secondary tracking-wide">
              Reconnecting to session...
            </p>
          </div>
        </div>
      ) : (
        <>
          {stage === "SETUP" && <SetupScreen />}
          {stage === "LOBBY" && <LobbyScreen />}
          {stage === "SEARCH" && <SearchScreen />}
          {stage === "SWIPER" && <SwiperScreen />}
          {stage === "WINNER" && <WinnerScreen />}
        </>
      )}
    </div>
  );
}
