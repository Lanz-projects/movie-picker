import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchFilterToolbar } from "@/components/stages/search/SearchFilterToolbar";

describe("SearchFilterToolbar Component", () => {
  it("renders search input, genre chips, streaming toggle button, and section heading", () => {
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre={null}
        onSelectGenre={vi.fn()}
        activeProvider={null}
        onSelectProvider={vi.fn()}
        onClearFilters={vi.fn()}
        mode="TRENDING"
        sectionTitle="🔥 Trending This Week"
        totalResults={20}
        currentResultsCount={20}
      />
    );

    expect(screen.getByRole("textbox", { name: /search movies/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trending/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filter by platform/i })).toBeInTheDocument();
    // Streaming provider pills are initially collapsed
    expect(screen.queryByRole("button", { name: /netflix/i })).not.toBeInTheDocument();
    expect(screen.getByText("🔥 Trending This Week")).toBeInTheDocument();
    expect(screen.getByText("20 of 20")).toBeInTheDocument();
  });

  it("expands streaming provider bar when toggle button is clicked", () => {
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre={null}
        onSelectGenre={vi.fn()}
        activeProvider={null}
        onSelectProvider={vi.fn()}
        onClearFilters={vi.fn()}
        mode="TRENDING"
        sectionTitle="🔥 Trending This Week"
        totalResults={20}
        currentResultsCount={20}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /filter by platform/i });
    fireEvent.click(toggleBtn);

    // Now streaming options should be visible
    expect(screen.getByRole("button", { name: /netflix/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disney\+/i })).toBeInTheDocument();
  });

  it("automatically renders streaming options and clear button when activeProvider is set", () => {
    const handleSelectProvider = vi.fn();
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre="Action"
        onSelectGenre={vi.fn()}
        activeProvider="Netflix"
        onSelectProvider={handleSelectProvider}
        onClearFilters={vi.fn()}
        mode="DISCOVER"
        sectionTitle="Action Movies on Netflix"
        totalResults={15}
        currentResultsCount={10}
      />
    );

    expect(screen.getByRole("button", { name: /stream: netflix/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^netflix$/i })).toBeInTheDocument();

    const clearStreamBtn = screen.getByRole("button", { name: /clear stream/i });
    expect(clearStreamBtn).toBeInTheDocument();

    fireEvent.click(clearStreamBtn);
    expect(handleSelectProvider).toHaveBeenCalledWith(null);
  });
});
