import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { RoomProgressEvent, SessionResultsResponse, VoteMessageDto } from "@/types";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/ws`
    : "http://localhost:8080/ws");

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
}

export class StompClientService {
  private client: Client | null = null;
  private isConnecting: boolean = false;
  private activeSubscriptions: Map<string, StompSubscription> = new Map();
  private callbacks: WebSocketCallbacks = {};

  /**
   * Initializes and activates the STOMP connection with SockJS fallback.
   */
  public connect(callbacks: WebSocketCallbacks = {}): void {
    if (this.client?.active) {
      if (callbacks.onConnect) callbacks.onConnect();
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.callbacks = callbacks;
    this.isConnecting = true;

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnecting = false;
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      },
      onDisconnect: () => {
        this.isConnecting = false;
        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect();
        }
      },
      onStompError: (frame) => {
        this.isConnecting = false;
        if (this.callbacks.onError) {
          this.callbacks.onError(frame);
        }
      },
      onWebSocketError: (event) => {
        this.isConnecting = false;
        if (this.callbacks.onError) {
          this.callbacks.onError(event);
        }
      },
    });

    this.client.activate();
  }

  /**
   * Subscribes to room progress events (votes cast, user finished, all finished).
   * Topic: /topic/room/{roomCode}
   */
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

  /**
   * Subscribes to automatic consensus results and winner announcements.
   * Topic: /topic/room/{roomCode}/results
   */
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

  /**
   * Generic subscription helper tracking active subscriptions.
   */
  private subscribe(
    destination: string,
    callback: (message: IMessage) => void
  ): () => void {
    if (!this.client || !this.client.connected) {
      // If client not yet connected, register when connected or queue
      console.warn(`[STOMP] Client is not connected. Subscription to ${destination} deferred.`);
    }

    if (this.activeSubscriptions.has(destination)) {
      this.activeSubscriptions.get(destination)?.unsubscribe();
      this.activeSubscriptions.delete(destination);
    }

    const subscription = this.client?.subscribe(destination, callback);
    if (subscription) {
      this.activeSubscriptions.set(destination, subscription);
    }

    return () => {
      if (this.activeSubscriptions.has(destination)) {
        this.activeSubscriptions.get(destination)?.unsubscribe();
        this.activeSubscriptions.delete(destination);
      }
    };
  }

  /**
   * Publishes a swipe vote to /app/vote.
   */
  public publishVote(payload: VoteMessageDto): void {
    if (!this.client || !this.client.connected) {
      throw new Error("[STOMP] Cannot publish vote: WebSocket is not connected.");
    }

    this.client.publish({
      destination: "/app/vote",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Checks if WebSocket client is currently connected.
   */
  public isConnected(): boolean {
    return !!this.client?.connected;
  }

  /**
   * Gracefully tears down all subscriptions and closes the socket connection.
   */
  public disconnect(): void {
    this.activeSubscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        // Ignore during teardown
      }
    });
    this.activeSubscriptions.clear();

    if (this.client) {
      try {
        this.client.deactivate();
      } catch {
        // Ignore during teardown
      }
      this.client = null;
    }

    this.isConnecting = false;
  }
}

// Export singleton instance
export const stompService = new StompClientService();
