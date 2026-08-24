import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  SearchFilterModal,
  DEFAULT_FILTER_STATE,
  countActiveFilters,
  type FilterState,
} from "@/components/stages/search/SearchFilterModal";

describe("SearchFilterModal Component", () => {
  it("computes active filter counts correctly", () => {
    expect(countActiveFilters(DEFAULT_FILTER_STATE)).toBe(0);

    const activeState: FilterState = {
      provider: "Netflix",
      decade: "90s",
      minRating: 7.0,
      minRuntime: 90,
      maxRuntime: 120,
      language: "en",
      sortBy: "vote_average.desc",
    };
    expect(countActiveFilters(activeState)).toBe(6);
  });

  it("does not render when isOpen is false", () => {
    render(
      <SearchFilterModal
        isOpen={false}
        onClose={vi.fn()}
        filters={DEFAULT_FILTER_STATE}
        onApplyFilters={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all filter options and sections when isOpen is true", () => {
    render(
      <SearchFilterModal
        isOpen={true}
        onClose={vi.fn()}
        filters={DEFAULT_FILTER_STATE}
        onApplyFilters={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Discovery Filters")).toBeInTheDocument();
    expect(screen.getByText("Streaming Platform")).toBeInTheDocument();
    expect(screen.getByText("Release Era / Decade")).toBeInTheDocument();
    expect(screen.getByText("Minimum Rating")).toBeInTheDocument();
    expect(screen.getByText("Runtime / Duration")).toBeInTheDocument();
    expect(screen.getByText("Original Language")).toBeInTheDocument();
    expect(screen.getByText("Sort Results By")).toBeInTheDocument();
  });

  it("allows selecting options and applying filters", () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    render(
      <SearchFilterModal
        isOpen={true}
        onClose={handleClose}
        filters={DEFAULT_FILTER_STATE}
        onApplyFilters={handleApply}
      />
    );

    // Select Netflix
    fireEvent.click(screen.getByRole("button", { name: "Netflix" }));
    // Select 90s Classics
    fireEvent.click(screen.getByRole("button", { name: "90s Classics" }));
    // Select Rating 7.0+
    fireEvent.click(screen.getByRole("button", { name: "⭐ 7.0+ (Good)" }));

    const applyBtn = screen.getByRole("button", { name: /apply filters \(3\)/i });
    expect(applyBtn).toBeInTheDocument();

    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "Netflix",
        decade: "90s",
        minRating: 7.0,
      })
    );
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("resets all filters when Reset All button is clicked", () => {
    const activeState: FilterState = {
      provider: "Max",
      decade: "2020s",
      minRating: 8.0,
      minRuntime: null,
      maxRuntime: 90,
      language: "ko",
      sortBy: "vote_average.desc",
    };

    render(
      <SearchFilterModal
        isOpen={true}
        onClose={vi.fn()}
        filters={activeState}
        onApplyFilters={vi.fn()}
      />
    );

    const resetBtn = screen.getByRole("button", { name: /reset all/i });
    fireEvent.click(resetBtn);

    // Active count on apply button should now be 0
    expect(screen.getByRole("button", { name: /^apply filters$/i })).toBeInTheDocument();
  });
});
