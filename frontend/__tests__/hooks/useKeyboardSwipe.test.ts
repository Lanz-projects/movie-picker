import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useKeyboardSwipe } from "@/hooks/useKeyboardSwipe";

describe("useKeyboardSwipe Hook", () => {
  it("triggers callbacks on arrow and action key presses", () => {
    const handlePass = vi.fn();
    const handleLike = vi.fn();
    const handleSuperlike = vi.fn();
    const handleSkip = vi.fn();
    const handleInfo = vi.fn();
    const handleEscape = vi.fn();

    renderHook(() =>
      useKeyboardSwipe({
        onPass: handlePass,
        onLike: handleLike,
        onSuperlike: handleSuperlike,
        onSkip: handleSkip,
        onInfo: handleInfo,
        onEscape: handleEscape,
        enabled: true,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(handlePass).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(handleLike).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(handleSuperlike).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(handleSkip).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
    expect(handleInfo).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handleEscape).toHaveBeenCalledTimes(1);
  });

  it("does not fire callbacks when enabled is false", () => {
    const handleLike = vi.fn();

    renderHook(() =>
      useKeyboardSwipe({
        onLike: handleLike,
        enabled: false,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(handleLike).not.toHaveBeenCalled();
  });
});
