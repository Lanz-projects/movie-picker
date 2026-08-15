"use client";

import * as React from "react";
import { StageContainer } from "@/components/layout/StageContainer";
import { RoomCodeCard } from "./lobby/RoomCodeCard";
import { MemberRoster } from "./lobby/MemberRoster";
import { LobbyControls } from "./lobby/LobbyControls";
import { useSession } from "@/context/SessionContext";

export function LobbyScreen() {
  const {
    session,
    currentUser,
    isHost,
    advanceToSearch,
    leaveRoom,
    isLoading,
  } = useSession();

  if (!session) {
    return null;
  }

  return (
    <StageContainer maxWidth="md">
      <div className="flex flex-col gap-6 w-full animate-stage-in">
        {/* 1. Room Code Hero & Clipboard Hub */}
        <RoomCodeCard
          roomCode={session.roomCode}
          memberCount={session.users.length}
          maxUsers={session.maxUsers}
        />

        {/* 2. Real-Time Joined Member Roster */}
        <MemberRoster
          users={session.users}
          hostName={session.hostName}
          currentUserId={currentUser?.id}
        />

        {/* 3. Role-Based Controls (Host CTA / Guest Waiting + Leave) */}
        <LobbyControls
          isHost={isHost}
          onStartSearch={advanceToSearch}
          onLeaveRoom={leaveRoom}
          isLoading={isLoading}
        />
      </div>
    </StageContainer>
  );
}
