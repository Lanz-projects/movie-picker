import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConfettiCelebration } from "@/components/stages/winner/ConfettiCelebration";
import confetti from "canvas-confetti";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("ConfettiCelebration Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires confetti burst on mount for unanimous pick", () => {
    render(<ConfettiCelebration isUnanimous={true} durationMs={1000} />);

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 120,
        disableForReducedMotion: true,
      })
    );

    // Advance timer for interval cannons
    vi.advanceTimersByTime(500);
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 35,
        angle: 60,
      })
    );
  });

  it("fires standard confetti count for non-unanimous pick", () => {
    render(<ConfettiCelebration isUnanimous={false} durationMs={1000} />);

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 80,
      })
    );
  });

  it("cleans up intervals on unmount", () => {
    const { unmount } = render(
      <ConfettiCelebration isUnanimous={true} durationMs={3000} />
    );

    const callCountBefore = vi.mocked(confetti).mock.calls.length;
    unmount();

    vi.advanceTimersByTime(2000);
    const callCountAfter = vi.mocked(confetti).mock.calls.length;
    expect(callCountAfter).toBe(callCountBefore);
  });
});
