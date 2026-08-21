import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSession,
  getSessionByRoomCode,
  joinSession,
  updateSessionStatus,
  leaveSessionByRoomCode,
  kickUser,
} from "@/lib/api/session";
import { ApiClientError } from "@/lib/api/client";
import type { SessionResponse, LeaveSessionResponse } from "@/types/session";

describe("Session API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createSession sends POST and returns SessionResponse", async () => {
    const mockResponse: SessionResponse = {
      id: 1,
      roomCode: "ABCD",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await createSession({ hostName: "Alice" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hostName: "Alice" }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("getSessionByRoomCode encodes room code and returns SessionResponse", async () => {
    const mockResponse: SessionResponse = {
      id: 1,
      roomCode: "ABCD",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [],
      createdAt: "2026-08-14T00:00:00",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await getSessionByRoomCode("ABCD");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/ABCD",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.roomCode).toBe("ABCD");
  });

  it("joinSession trims inputs and sends POST", async () => {
    const mockResponse: SessionResponse = {
      id: 1,
      roomCode: "ABCD",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [
        { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
        { id: 11, displayName: "Bob", isHost: false, joinedAt: "2026-08-14T00:01:00" },
      ],
      createdAt: "2026-08-14T00:00:00",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await joinSession({ roomCode: " ABCD ", displayName: " Bob " });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roomCode: "ABCD", displayName: "Bob" }),
      })
    );
    expect(result.users).toHaveLength(2);
  });

  it("updateSessionStatus sends PATCH with new status", async () => {
    const mockResponse: SessionResponse = {
      id: 1,
      roomCode: "ABCD",
      hostName: "Alice",
      status: "SUGGESTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [],
      createdAt: "2026-08-14T00:00:00",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await updateSessionStatus("ABCD", "SUGGESTING");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/ABCD/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "SUGGESTING" }),
      })
    );
    expect(result.status).toBe("SUGGESTING");
  });

  it("leaveSessionByRoomCode sends POST and returns LeaveSessionResponse", async () => {
    const mockResponse: LeaveSessionResponse = {
      message: "User Bob left the session.",
      newHostName: null,
      sessionClosed: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await leaveSessionByRoomCode("ABCD", 11);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/room/ABCD/leave",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userId: 11 }),
      })
    );
    expect(result.sessionClosed).toBe(false);
  });

  it("throws ApiClientError with backend message on HTTP 400", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        status: 400,
        message: "Display name 'Alice' is already taken in this session.",
        timestamp: "2026-08-14T00:00:00",
      }),
    } as unknown as Response);

    await expect(joinSession({ roomCode: "ABCD", displayName: "Alice" })).rejects.toThrow(
      ApiClientError
    );

    try {
      await joinSession({ roomCode: "ABCD", displayName: "Alice" });
    } catch (err) {
      const apiError = err as ApiClientError;
      expect(apiError.status).toBe(400);
      expect(apiError.message).toBe("Display name 'Alice' is already taken in this session.");
    }
  });

  it("throws ApiClientError on HTTP 404 when room is not found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({
        status: 404,
        message: "Session not found with room code: ZZZZ",
      }),
    } as unknown as Response);

    await expect(getSessionByRoomCode("ZZZZ")).rejects.toThrow(
      "Session not found with room code: ZZZZ"
    );
  });

  it("kickUser sends POST to kick endpoint and returns LeaveSessionResponse", async () => {
    const mockResponse: LeaveSessionResponse = {
      message: "User Bob was removed from the session by the host.",
      newHostName: null,
      sessionClosed: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await kickUser("ABCD", 10, 11);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/room/ABCD/kick",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hostUserId: 10, targetUserId: 11 }),
      })
    );
    expect(result.message).toContain("Bob");
  });

  it("kickUser with banPermanently sends flag in POST body", async () => {
    const mockResponse: LeaveSessionResponse = {
      message: "User Bob was permanently banned from the session by the host.",
      newHostName: null,
      sessionClosed: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await kickUser("ABCD", 10, 11, true);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/sessions/room/ABCD/kick",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hostUserId: 10, targetUserId: 11, banPermanently: true }),
      })
    );
    expect(result.message).toContain("permanently banned");
  });
});
