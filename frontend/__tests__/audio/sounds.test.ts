import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isSoundMuted,
  setSoundMuted,
  toggleSoundMuted,
  subscribeSoundMuted,
  playSwipePass,
  playSwipeLike,
  playSwipeSuperlike,
  playWinnerFanfare,
} from "@/lib/audio/sounds";

describe("sounds utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to unmuted", () => {
    expect(isSoundMuted()).toBe(false);
  });

  it("sets and persists muted state", () => {
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
    expect(localStorage.getItem("movie_picker_sound_muted")).toBe("true");

    setSoundMuted(false);
    expect(isSoundMuted()).toBe(false);
    expect(localStorage.getItem("movie_picker_sound_muted")).toBe("false");
  });

  it("toggles muted state", () => {
    expect(toggleSoundMuted()).toBe(true);
    expect(isSoundMuted()).toBe(true);
    expect(toggleSoundMuted()).toBe(false);
    expect(isSoundMuted()).toBe(false);
  });

  it("notifies subscribers when muted state changes", () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeSoundMuted(subscriber);

    setSoundMuted(true);
    expect(subscriber).toHaveBeenCalledWith(true);

    unsubscribe();
    setSoundMuted(false);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("does not throw when triggering sound playback in test environment", () => {
    expect(() => playSwipePass()).not.toThrow();
    expect(() => playSwipeLike()).not.toThrow();
    expect(() => playSwipeSuperlike()).not.toThrow();
    expect(() => playWinnerFanfare()).not.toThrow();
  });
});
