"use client";

import * as React from "react";
import { StageContainer } from "@/components/layout/StageContainer";
import { RoomCodeCard } from "./lobby/RoomCodeCard";
import { MemberRoster } from "./lobby/MemberRoster";
import { LobbyControls } from "./lobby/LobbyControls";
import { QRCodeModal } from "@/components/ui/QRCodeModal";
import { useSession } from "@/context/SessionContext";

export function LobbyScreen() {
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
  const {
    session,
    currentUser,
    isHost,
    advanceToSearch,
    leaveRoom,
    kickUser,
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
          onOpenQrCode={() => setIsQrModalOpen(true)}
        />

        {/* 2. Real-Time Joined Member Roster */}
        <MemberRoster
          users={session.users}
          hostName={session.hostName}
          currentUserId={currentUser?.id}
          isHost={isHost}
          onKickUser={kickUser}
        />

        {/* 3. Role-Based Controls (Host CTA / Guest Waiting + Leave) */}
        <LobbyControls
          isHost={isHost}
          onStartSearch={advanceToSearch}
          onLeaveRoom={leaveRoom}
          isLoading={isLoading}
        />

        {/* 4. Interactive QR Code Modal */}
        <QRCodeModal
          isOpen={isQrModalOpen}
          roomCode={session.roomCode}
          onClose={() => setIsQrModalOpen(false)}
        />
      </div>
    </StageContainer>
  );
}
