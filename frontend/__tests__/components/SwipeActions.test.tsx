import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SwipeActions } from "@/components/stages/swiper/SwipeActions";

describe("SwipeActions Component", () => {
  it("renders all 5 action buttons with accessible labels", () => {
    render(
      <SwipeActions
        onPass={vi.fn()}
        onSkip={vi.fn()}
        onSuperlike={vi.fn()}
        onLike={vi.fn()}
        onInfo={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Pass (Left Arrow)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip (Space)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Superlike (Up Arrow)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like (Right Arrow)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Movie Info (i)" })).toBeInTheDocument();
  });

  it("calls appropriate callback when each button is clicked", async () => {
    const user = userEvent.setup();
    const handlePass = vi.fn();
    const handleSkip = vi.fn();
    const handleSuperlike = vi.fn();
    const handleLike = vi.fn();
    const handleInfo = vi.fn();

    render(
      <SwipeActions
        onPass={handlePass}
        onSkip={handleSkip}
        onSuperlike={handleSuperlike}
        onLike={handleLike}
        onInfo={handleInfo}
      />
    );

    await user.click(screen.getByRole("button", { name: "Pass (Left Arrow)" }));
    expect(handlePass).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Skip (Space)" }));
    expect(handleSkip).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Superlike (Up Arrow)" }));
    expect(handleSuperlike).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Like (Right Arrow)" }));
    expect(handleLike).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Movie Info (i)" }));
    expect(handleInfo).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when disabled prop is true", () => {
    render(
      <SwipeActions
        onPass={vi.fn()}
        onSkip={vi.fn()}
        onSuperlike={vi.fn()}
        onLike={vi.fn()}
        onInfo={vi.fn()}
        disabled={true}
      />
    );

    expect(screen.getByRole("button", { name: "Pass (Left Arrow)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Like (Right Arrow)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Superlike (Up Arrow)" })).toBeDisabled();
  });
});
