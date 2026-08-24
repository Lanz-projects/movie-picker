import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSessionAuth,
  loadSessionAuth,
  clearSessionAuth,
  saveVotedSuggestionId,
  loadVotedSuggestionIds,
  clearVotedSuggestionIds,
  saveAiChatHistory,
  loadAiChatHistory,
  clearAiChatHistory,
  type StoredSessionAuth,
} from "@/lib/storage/sessionStorage";

describe("sessionStorage helper", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and loads valid session auth", () => {
    const auth: StoredSessionAuth = {
      roomCode: "MVE892",
      userId: 10,
      displayName: "Alice",
      isHost: true,
      savedAt: Date.now(),
    };

    saveSessionAuth(auth);
    const loaded = loadSessionAuth();

    expect(loaded).toEqual(auth);
  });

  it("returns null and clears when auth is expired beyond TTL", () => {
    const thirteenHoursAgo = Date.now() - 13 * 60 * 60 * 1000;
    const expiredAuth: StoredSessionAuth = {
      roomCode: "MVE892",
      userId: 10,
      displayName: "Alice",
      isHost: true,
      savedAt: thirteenHoursAgo,
    };

    saveSessionAuth(expiredAuth);
    const loaded = loadSessionAuth();

    expect(loaded).toBeNull();
    expect(sessionStorage.getItem("movie_picker_session_auth")).toBeNull();
  });

  it("returns null and clears when storage is corrupted", () => {
    sessionStorage.setItem("movie_picker_session_auth", "{ corrupt json");
    const loaded = loadSessionAuth();

    expect(loaded).toBeNull();
    expect(sessionStorage.getItem("movie_picker_session_auth")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    sessionStorage.setItem(
      "movie_picker_session_auth",
      JSON.stringify({ displayName: "Alice" })
    );
    const loaded = loadSessionAuth();

    expect(loaded).toBeNull();
    expect(sessionStorage.getItem("movie_picker_session_auth")).toBeNull();
  });

  it("clears session auth cleanly", () => {
    saveSessionAuth({
      roomCode: "MVE892",
      userId: 10,
      displayName: "Alice",
      isHost: true,
      savedAt: Date.now(),
    });

    clearSessionAuth();
    expect(loadSessionAuth()).toBeNull();
  });

  it("saves, loads, and deduplicates voted suggestion IDs", () => {
    expect(loadVotedSuggestionIds("KTQH", 1)).toEqual([]);

    saveVotedSuggestionId("KTQH", 1, 101);
    saveVotedSuggestionId("KTQH", 1, 102);
    saveVotedSuggestionId("KTQH", 1, 101); // duplicate

    expect(loadVotedSuggestionIds("KTQH", 1)).toEqual([101, 102]);
  });

  it("clears voted suggestions for a specific room and user", () => {
    saveVotedSuggestionId("KTQH", 1, 101);
    saveVotedSuggestionId("OTHER", 2, 202);

    clearVotedSuggestionIds("KTQH", 1);
    expect(loadVotedSuggestionIds("KTQH", 1)).toEqual([]);
    expect(loadVotedSuggestionIds("OTHER", 2)).toEqual([202]);
  });

  it("saves, loads, and clears AI chat history for a specific room", () => {
    const mockTurns = [
      {
        id: "turn-1",
        prompt: "90s sci-fi",
        timestamp: new Date("2026-08-22T10:00:00Z"),
        replyMessage: "Here is The Matrix:",
        movies: [
          {
            tmdbId: 603,
            title: "The Matrix",
            overview: "A computer hacker learns...",
            posterPath: "/matrix.jpg",
            releaseYear: 1999,
            voteAverage: 8.2,
          },
        ],
        totalResultsCount: 1,
        hasMore: false,
        page: 1,
      },
    ];

    saveAiChatHistory("ROOM12", mockTurns);
    const loaded = loadAiChatHistory("ROOM12");

    expect(loaded).toHaveLength(1);
    expect(loaded[0].prompt).toBe("90s sci-fi");
    expect(loaded[0].movies[0].title).toBe("The Matrix");
    expect(loaded[0].timestamp).toBeInstanceOf(Date);

    // Clear specific room
    clearAiChatHistory("ROOM12");
    expect(loadAiChatHistory("ROOM12")).toEqual([]);
  });

  it("clears all AI chat histories and voted suggestions on clearSessionAuth", () => {
    saveSessionAuth({
      roomCode: "ROOM12",
      userId: 1,
      displayName: "Alice",
      isHost: true,
      savedAt: Date.now(),
    });
    saveVotedSuggestionId("ROOM12", 1, 999);
    saveAiChatHistory("ROOM12", [
      {
        id: "turn-1",
        prompt: "comedies",
        timestamp: new Date(),
        replyMessage: "Fun picks",
        movies: [],
        totalResultsCount: 0,
        hasMore: false,
        page: 1,
      },
    ]);

    clearSessionAuth();

    expect(loadSessionAuth()).toBeNull();
    expect(loadVotedSuggestionIds("ROOM12", 1)).toEqual([]);
    expect(loadAiChatHistory("ROOM12")).toEqual([]);
  });
});
