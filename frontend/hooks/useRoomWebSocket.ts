"use client";

import * as React from "react";
import { stompService } from "@/lib/websocket";
import type { RoomProgressEvent, SessionResultsResponse } from "@/types";

export interface UseRoomWebSocketOptions {
  roomCode?: string;
  userId?: number;
  displayName?: string;
  onRoomEvent?: (event: RoomProgressEvent) => void;
  onProgress?: (event: RoomProgressEvent) => void;
  onResults?: (results: SessionResultsResponse) => void;
}

export function useRoomWebSocket({
  roomCode,
  userId,
  displayName,
  onRoomEvent,
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
      onConnect: () => {
        setIsConnected(true);
        if (userId && displayName) {
          stompService.registerPresence(cleanCode, userId, displayName);
        }
      },
      onDisconnect: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    const unsubRoom = stompService.subscribeToRoom(cleanCode, (event: RoomProgressEvent) => {
      onRoomEvent?.(event);
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
  }, [roomCode, userId, displayName, onRoomEvent, onProgress, onResults]);

  return { isConnected };
}

