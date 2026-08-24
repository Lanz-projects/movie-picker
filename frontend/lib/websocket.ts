import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { RoomProgressEvent, SessionResultsResponse, VoteMessageDto } from "@/types";

export function getWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/ws`;
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8080/ws`;
  }
  return "http://localhost:8080/ws";
}

export const WS_BASE_URL = getWebSocketUrl();

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
}

interface QueuedSubscription {
  destination: string;
  callback: (message: IMessage) => void;
}

export class StompClientService {
  private client: Client | null = null;
  private isConnecting: boolean = false;
  private activeSubscriptions: Map<string, StompSubscription> = new Map();
  private pendingSubscriptions: Map<string, QueuedSubscription> = new Map();
  private callbacks: WebSocketCallbacks = {};

  public connect(callbacks: WebSocketCallbacks = {}): void {
    this.callbacks = { ...this.callbacks, ...callbacks };

    if (this.client?.connected) {
      this.callbacks.onConnect?.();
      return;
    }

    if (this.isConnecting && this.client?.active) {
      return;
    }

    this.isConnecting = true;

    const wsUrl = getWebSocketUrl();
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnecting = false;
        this.callbacks.onConnect?.();
        this.flushPendingSubscriptions();
      },
      onDisconnect: () => {
        this.isConnecting = false;
        this.callbacks.onDisconnect?.();
      },
      onStompError: (frame) => {
        this.isConnecting = false;
        this.callbacks.onError?.(frame);
      },
      onWebSocketError: (event) => {
        this.isConnecting = false;
        this.callbacks.onError?.(event);
      },
    });

    this.client.activate();
  }

  private flushPendingSubscriptions(): void {
    if (!this.client || !this.client.connected) return;

    this.pendingSubscriptions.forEach(({ destination, callback }) => {
      if (!this.activeSubscriptions.has(destination)) {
        const sub = this.client?.subscribe(destination, callback);
        if (sub) {
          this.activeSubscriptions.set(destination, sub);
        }
      }
    });
  }

  public subscribeToRoom(
    roomCode: string,
    onProgressEvent: (event: RoomProgressEvent) => void
  ): () => void {
    const destination = `/topic/room/${roomCode.trim()}`;
    return this.subscribe(destination, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body) as RoomProgressEvent;
        onProgressEvent(data);
      } catch (err) {
        console.error(`[STOMP] Failed to parse room event from ${destination}:`, err);
      }
    });
  }

  public subscribeToResults(
    roomCode: string,
    onResultsEvent: (results: SessionResultsResponse) => void
  ): () => void {
    const destination = `/topic/room/${roomCode.trim()}/results`;
    return this.subscribe(destination, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body) as SessionResultsResponse;
        onResultsEvent(data);
      } catch (err) {
        console.error(`[STOMP] Failed to parse results from ${destination}:`, err);
      }
    });
  }

  private subscribe(
    destination: string,
    callback: (message: IMessage) => void
  ): () => void {
    this.pendingSubscriptions.set(destination, { destination, callback });

    if (this.client && this.client.connected) {
      if (this.activeSubscriptions.has(destination)) {
        this.activeSubscriptions.get(destination)?.unsubscribe();
        this.activeSubscriptions.delete(destination);
      }

      try {
        const subscription = this.client.subscribe(destination, callback);
        if (subscription) {
          this.activeSubscriptions.set(destination, subscription);
        }
      } catch (err) {
        console.warn(`[STOMP] Failed to subscribe to ${destination}, queued for reconnect:`, err);
      }
    }

    return () => {
      this.pendingSubscriptions.delete(destination);
      if (this.activeSubscriptions.has(destination)) {
        this.activeSubscriptions.get(destination)?.unsubscribe();
        this.activeSubscriptions.delete(destination);
      }
    };
  }

  public publishVote(payload: VoteMessageDto): void {
    if (!this.client || !this.client.connected) {
      console.warn("[STOMP] Client not connected. Cannot publish vote payload:", payload);
      return;
    }

    try {
      this.client.publish({
        destination: "/app/vote",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[STOMP] Failed to publish vote to /app/vote:", err);
    }
  }

  public registerPresence(roomCode: string, userId: number, displayName: string): void {
    if (!this.client || !this.client.connected) {
      console.warn("[STOMP] Client not connected. Cannot register presence for:", displayName);
      return;
    }

    try {
      this.client.publish({
        destination: "/app/room/register",
        body: JSON.stringify({
          roomCode: roomCode.trim(),
          userId,
          displayName: displayName.trim(),
        }),
      });
    } catch (err) {
      console.error("[STOMP] Failed to register presence on /app/room/register:", err);
    }
  }

  public disconnect(): void {
    this.activeSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeSubscriptions.clear();
    this.pendingSubscriptions.clear();

    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
    this.isConnecting = false;
    this.callbacks = {};
  }

  public isConnected(): boolean {
    return Boolean(this.client?.connected);
  }
}

export const stompService = new StompClientService();
