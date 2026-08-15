"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { SetupScreen } from "@/components/stages/SetupScreen";
import { LobbyScreen } from "@/components/stages/LobbyScreen";
import { useSession } from "@/context/SessionContext";

export default function Home() {
  const { session, currentUser, isHost, stage, leaveRoom, isConnected } = useSession();

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
      {stage === "SETUP" && <SetupScreen />}
      {stage === "LOBBY" && <LobbyScreen />}
    </div>
  );
}
