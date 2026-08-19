import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchFilterToolbar } from "@/components/stages/search/SearchFilterToolbar";

describe("SearchFilterToolbar Component", () => {
  it("renders search input, genre chips, streaming filters, and section heading", () => {
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
    expect(screen.getByRole("button", { name: /netflix/i })).toBeInTheDocument();
    expect(screen.getByText("🔥 Trending This Week")).toBeInTheDocument();
    expect(screen.getByText("20 of 20")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back to trending/i })).not.toBeInTheDocument();
  });

  it("shows 'Back to Trending' button and triggers onClearFilters when in DISCOVER mode", () => {
    const handleClearFilters = vi.fn();
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre="Horror"
        onSelectGenre={vi.fn()}
        activeProvider="Netflix"
        onSelectProvider={vi.fn()}
        onClearFilters={handleClearFilters}
        mode="DISCOVER"
        sectionTitle="Horror Movies on Netflix"
        totalResults={10}
        currentResultsCount={5}
      />
    );

    const backButton = screen.getByRole("button", { name: /back to trending/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(handleClearFilters).toHaveBeenCalledTimes(1);
  });
});
