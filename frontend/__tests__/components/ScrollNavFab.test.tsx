import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScrollNavFab } from "@/components/ui/ScrollNavFab";

describe("ScrollNavFab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollY = 0;
    window.scrollTo = vi.fn();
  });

  it("is hidden initially when scroll position is 0", () => {
    render(<ScrollNavFab threshold={400} />);
    expect(screen.queryByRole("button", { name: /scroll to top/i })).not.toBeInTheDocument();
  });

  it("becomes visible when user scrolls down beyond threshold", () => {
    render(<ScrollNavFab threshold={400} />);

    window.scrollY = 500;
    fireEvent.scroll(window);

    expect(screen.getByRole("button", { name: /scroll to top/i })).toBeInTheDocument();
  });

  it("scrolls smoothly to top and saves last scroll position when Top is clicked", () => {
    render(<ScrollNavFab threshold={400} />);

    window.scrollY = 800;
    fireEvent.scroll(window);

    const topButton = screen.getByRole("button", { name: /scroll to top/i });
    fireEvent.click(topButton);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    // Simulate scrolling to top
    window.scrollY = 0;
    fireEvent.scroll(window);

    // Should now display the return button
    expect(screen.getByRole("button", { name: /return to previous scroll position/i })).toBeInTheDocument();
  });

  it("restores previous position when Return button is clicked", () => {
    render(<ScrollNavFab threshold={400} />);

    window.scrollY = 650;
    fireEvent.scroll(window);

    const topButton = screen.getByRole("button", { name: /scroll to top/i });
    fireEvent.click(topButton);

    window.scrollY = 0;
    fireEvent.scroll(window);

    const returnButton = screen.getByRole("button", { name: /return to previous scroll position/i });
    fireEvent.click(returnButton);

    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 650, behavior: "smooth" });
  });

  it("clamps to bottom of page if saved position exceeds new scrollHeight", () => {
    // Mock scrollHeight = 1000 and innerHeight = 600 -> maxScroll = 400
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 600,
      configurable: true,
    });

    render(<ScrollNavFab threshold={400} />);

    window.scrollY = 800;
    fireEvent.scroll(window);

    const topButton = screen.getByRole("button", { name: /scroll to top/i });
    fireEvent.click(topButton);

    window.scrollY = 0;
    fireEvent.scroll(window);

    const returnButton = screen.getByRole("button", { name: /return to previous scroll position/i });
    fireEvent.click(returnButton);

    // Should clamp 800 down to maxScroll 400
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 400, behavior: "smooth" });
  });
});
