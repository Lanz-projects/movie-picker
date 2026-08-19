import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GenreFilterChips, GENRE_OPTIONS } from "@/components/stages/search/GenreFilterChips";

describe("GenreFilterChips Component", () => {
  it("renders all genre chip options including Trending default", () => {
    const handleSelectGenre = vi.fn();
    render(
      <GenreFilterChips
        selectedGenre={null}
        onSelectGenre={handleSelectGenre}
      />
    );

    for (const genre of GENRE_OPTIONS) {
      expect(screen.getByRole("button", { name: new RegExp(genre.label, "i") })).toBeInTheDocument();
    }
  });

  it("marks Trending button as selected when selectedGenre is null", () => {
    render(
      <GenreFilterChips
        selectedGenre={null}
        onSelectGenre={vi.fn()}
      />
    );

    const trendingButton = screen.getByRole("button", { name: /trending/i });
    expect(trendingButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onSelectGenre with genre name when a category chip is clicked", () => {
    const handleSelectGenre = vi.fn();
    render(
      <GenreFilterChips
        selectedGenre={null}
        onSelectGenre={handleSelectGenre}
      />
    );

    const horrorButton = screen.getByRole("button", { name: /horror/i });
    fireEvent.click(horrorButton);

    expect(handleSelectGenre).toHaveBeenCalledWith("Horror");
  });

  it("calls onSelectGenre with null when Trending chip is clicked", () => {
    const handleSelectGenre = vi.fn();
    render(
      <GenreFilterChips
        selectedGenre="Action"
        onSelectGenre={handleSelectGenre}
      />
    );

    const trendingButton = screen.getByRole("button", { name: /trending/i });
    fireEvent.click(trendingButton);

    expect(handleSelectGenre).toHaveBeenCalledWith(null);
  });
});
