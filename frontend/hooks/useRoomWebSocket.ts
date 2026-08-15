"use client";

import * as React from "react";
import { stompService } from "@/lib/websocket";
import type { RoomProgressEvent, SessionResultsResponse } from "@/types";

export interface UseRoomWebSocketOptions {
  roomCode?: string;
  onProgress?: (event: RoomProgressEvent) => void;
  onResults?: (results: SessionResultsResponse) => void;
}

export function useRoomWebSocket({
  roomCode,
  onProgress,
  onResults,
}: UseRoomWebSocketOptions) {
  const [isConnected, setIsConnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!roomCode) {
      return;
    }

    const cleanCode = roomCode.trim();

    stompService.connect({
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    const unsubRoom = stompService.subscribeToRoom(cleanCode, (event: RoomProgressEvent) => {
      onProgress?.(event);
    });

    const unsubResults = stompService.subscribeToResults(
      cleanCode,
      (results: SessionResultsResponse) => {
        onResults?.(results);
      }
    );

    return () => {
      unsubRoom();
      unsubResults();
      setIsConnected(false);
    };
  }, [roomCode, onProgress, onResults]);

  return { isConnected };
}
