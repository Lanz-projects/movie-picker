import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StreamingFilterBar, STREAMING_OPTIONS } from "@/components/stages/search/StreamingFilterBar";

describe("StreamingFilterBar Component", () => {
  it("renders all streaming provider options including All Platforms", () => {
    const handleSelectProvider = vi.fn();
    render(
      <StreamingFilterBar
        selectedProvider={null}
        onSelectProvider={handleSelectProvider}
      />
    );

    for (const provider of STREAMING_OPTIONS) {
      expect(screen.getByRole("button", { name: new RegExp(provider.label, "i") })).toBeInTheDocument();
    }
  });

  it("marks All Platforms button as selected when selectedProvider is null", () => {
    render(
      <StreamingFilterBar
        selectedProvider={null}
        onSelectProvider={vi.fn()}
      />
    );

    const allButton = screen.getByRole("button", { name: /all platforms/i });
    expect(allButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onSelectProvider with provider name when clicked", () => {
    const handleSelectProvider = vi.fn();
    render(
      <StreamingFilterBar
        selectedProvider={null}
        onSelectProvider={handleSelectProvider}
      />
    );

    const netflixButton = screen.getByRole("button", { name: /netflix/i });
    fireEvent.click(netflixButton);

    expect(handleSelectProvider).toHaveBeenCalledWith("Netflix");
  });
});
