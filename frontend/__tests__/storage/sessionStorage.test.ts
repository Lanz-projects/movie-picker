import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSessionAuth,
  loadSessionAuth,
  clearSessionAuth,
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
});
