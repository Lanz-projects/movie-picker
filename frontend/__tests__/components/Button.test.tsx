import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button Component", () => {
  it("renders with default primary variant and text", () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("from-brand-indigo");
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const button = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders swiper circular action buttons correctly", () => {
    render(
      <Button variant="actionPass" aria-label="Pass">
        Pass
      </Button>
    );
    const passButton = screen.getByRole("button", { name: /pass/i });
    expect(passButton).toBeInTheDocument();
    expect(passButton).toHaveClass("rounded-full", "text-brand-coral");
  });

  it("disables button when disabled or loading", () => {
    const { rerender } = render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();

    rerender(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
