import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchFilterToolbar } from "@/components/stages/search/SearchFilterToolbar";
import { DEFAULT_FILTER_STATE } from "@/components/stages/search/SearchFilterModal";

describe("SearchFilterToolbar Component", () => {
  it("renders search input, genre chips, filter options button, and section heading", () => {
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre={null}
        onSelectGenre={vi.fn()}
        filters={DEFAULT_FILTER_STATE}
        onFiltersChange={vi.fn()}
        activeFilterCount={0}
        onClearFilters={vi.fn()}
        mode="TRENDING"
        sectionTitle="🔥 Trending This Week"
        totalResults={20}
        currentResultsCount={20}
      />
    );

    expect(screen.getByRole("textbox", { name: /search movies/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trending/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open filter options/i })).toBeInTheDocument();
    expect(screen.getByText("🔥 Trending This Week")).toBeInTheDocument();
    expect(screen.getByText("20 of 20")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back to trending/i })).not.toBeInTheDocument();
  });

  it("opens filter modal when Filter Options button is clicked", () => {
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre={null}
        onSelectGenre={vi.fn()}
        filters={DEFAULT_FILTER_STATE}
        onFiltersChange={vi.fn()}
        activeFilterCount={0}
        onClearFilters={vi.fn()}
        mode="TRENDING"
        sectionTitle="🔥 Trending This Week"
        totalResults={20}
        currentResultsCount={20}
      />
    );

    const filterBtn = screen.getByRole("button", { name: /open filter options/i });
    fireEvent.click(filterBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Discovery Filters")).toBeInTheDocument();
  });

  it("renders active filter chips and allows removing individual filters", () => {
    const handleFiltersChange = vi.fn();
    render(
      <SearchFilterToolbar
        query=""
        onQueryChange={vi.fn()}
        onClearQuery={vi.fn()}
        isLoading={false}
        activeGenre="Action"
        onSelectGenre={vi.fn()}
        filters={{
          ...DEFAULT_FILTER_STATE,
          provider: "Netflix",
          decade: "90s",
        }}
        onFiltersChange={handleFiltersChange}
        activeFilterCount={2}
        onClearFilters={vi.fn()}
        mode="DISCOVER"
        sectionTitle="90s Action Movies on Netflix"
        totalResults={15}
        currentResultsCount={10}
      />
    );

    expect(screen.getByText("📺 Netflix")).toBeInTheDocument();
    expect(screen.getByText("📅 90s")).toBeInTheDocument();

    const removeNetflixBtn = screen.getByRole("button", { name: /remove netflix filter/i });
    fireEvent.click(removeNetflixBtn);

    expect(handleFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: null,
        decade: "90s",
      })
    );
  });
});
