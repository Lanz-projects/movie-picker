import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "@/components/stages/search/SearchBar";

describe("SearchBar", () => {
  const mockOnChange = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with placeholder and value", () => {
    render(
      <SearchBar
        value="Inception"
        onChange={mockOnChange}
        onClear={mockOnClear}
        placeholder="Search for movies..."
      />
    );

    const input = screen.getByRole("textbox", { name: "Search movies" });
    expect(input).toHaveValue("Inception");
    expect(input).toHaveAttribute("placeholder", "Search for movies...");
  });

  it("calls onChange when typing", () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const input = screen.getByRole("textbox", { name: "Search movies" });
    fireEvent.change(input, { target: { value: "Batman" } });

    expect(mockOnChange).toHaveBeenCalledWith("Batman");
  });

  it("shows clear button when value is non-empty and calls onClear on click", () => {
    render(
      <SearchBar
        value="Interstellar"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it("clears on Escape key press", () => {
    render(
      <SearchBar
        value="Dune"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const input = screen.getByRole("textbox", { name: "Search movies" });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it("shows loading spinner when isLoading is true", () => {
    render(
      <SearchBar
        value="Matrix"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={true}
      />
    );

    expect(screen.getByTestId("search-spinner")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });
});
