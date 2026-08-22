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
  onReconnect?: () => void;
}

export function useRoomWebSocket({
  roomCode,
  userId,
  displayName,
  onRoomEvent,
  onProgress,
  onResults,
  onReconnect,
}: UseRoomWebSocketOptions) {
  const [isConnected, setIsConnected] = React.useState<boolean>(false);

  const onRoomEventRef = React.useRef(onRoomEvent);
  onRoomEventRef.current = onRoomEvent;

  const onProgressRef = React.useRef(onProgress);
  onProgressRef.current = onProgress;

  const onResultsRef = React.useRef(onResults);
  onResultsRef.current = onResults;

  const onReconnectRef = React.useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  React.useEffect(() => {
    if (!roomCode) {
      return;
    }

    const cleanCode = roomCode.trim();
    let hasConnectedOnce = false;

    stompService.connect({
      onConnect: () => {
        setIsConnected(true);
        if (userId && displayName) {
          stompService.registerPresence?.(cleanCode, userId, displayName);
        }
        if (hasConnectedOnce) {
          onReconnectRef.current?.();
        }
        hasConnectedOnce = true;
      },
      onDisconnect: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    const unsubRoom = stompService.subscribeToRoom(cleanCode, (event: RoomProgressEvent) => {
      onRoomEventRef.current?.(event);
      onProgressRef.current?.(event);
    });

    const unsubResults = stompService.subscribeToResults(
      cleanCode,
      (results: SessionResultsResponse) => {
        onResultsRef.current?.(results);
      }
    );

    return () => {
      unsubRoom();
      unsubResults();
      setIsConnected(false);
    };
  }, [roomCode, userId, displayName]);

  React.useEffect(() => {
    if (roomCode && userId && displayName && stompService.isConnected()) {
      stompService.registerPresence?.(roomCode.trim(), userId, displayName);
    }
  }, [roomCode, userId, displayName]);

  return { isConnected };
}
