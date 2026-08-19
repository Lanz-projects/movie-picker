import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionRack } from "@/components/stages/search/SelectionRack";
import type { MovieSubmissionDto } from "@/types";

describe("SelectionRack", () => {
  const mockSelectedMovies: MovieSubmissionDto[] = [
    {
      tmdbId: 101,
      title: "Inception",
      posterPath: "/inception.jpg",
      releaseYear: 2010,
    },
    {
      tmdbId: 102,
      title: "Interstellar",
      posterPath: "/interstellar.jpg",
      releaseYear: 2014,
    },
  ];

  const mockOnRemoveMovie = vi.fn();
  const mockOnSubmitDeck = vi.fn();
  const mockOnStartVoting = vi.fn();
  const mockOnSelectMovie = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is collapsed by default and shows expand button", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
      />
    );

    expect(screen.getByText("2 / 3 Picked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand movie selection deck" })).toBeInTheDocument();
  });

  it("renders selected movie thumbnails and count badge when expanded", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
        onSelectMovie={mockOnSelectMovie}
        defaultExpanded={true}
      />
    );

    expect(screen.getByText("2 / 3 Picked")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Inception" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Interstellar" })).toBeInTheDocument();
    expect(screen.getByText("Pick")).toBeInTheDocument(); // 1 empty placeholder
  });

  it("calls onSelectMovie when a movie thumbnail is clicked", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
        onSelectMovie={mockOnSelectMovie}
        defaultExpanded={true}
      />
    );

    const movieItem = screen.getByRole("button", { name: "View details for Inception" });
    fireEvent.click(movieItem);

    expect(mockOnSelectMovie).toHaveBeenCalledWith(mockSelectedMovies[0]);
  });

  it("toggles collapse and expand states", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
        onSelectMovie={mockOnSelectMovie}
        defaultExpanded={false}
      />
    );

    // Click Expand button
    const expandBtn = screen.getByRole("button", { name: "Expand movie selection deck" });
    fireEvent.click(expandBtn);

    // Verify expanded view is visible
    expect(screen.getByRole("button", { name: "Minimize movie selection deck" })).toBeInTheDocument();
    expect(screen.getByText("2 / 3 Picked")).toBeInTheDocument();

    // Click Hide
    const hideBtn = screen.getByRole("button", { name: "Minimize movie selection deck" });
    fireEvent.click(hideBtn);

    expect(screen.getByRole("button", { name: "Expand movie selection deck" })).toBeInTheDocument();
  });

  it("calls onRemoveMovie when delete button on thumbnail is clicked", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
        defaultExpanded={true}
      />
    );

    const removeBtn = screen.getByRole("button", { name: "Remove Inception from deck" });
    fireEvent.click(removeBtn);

    expect(mockOnRemoveMovie).toHaveBeenCalledWith(101);
  });

  it("disables Submit Deck button when 0 movies are selected", () => {
    render(
      <SelectionRack
        selectedMovies={[]}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Deck/i });
    expect(submitBtn).toBeDisabled();
  });

  it("triggers onSubmitDeck when Submit Deck button is clicked", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Deck \(2\)/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);
    expect(mockOnSubmitDeck).toHaveBeenCalledTimes(1);
  });

  it("shows submitted state and Host start voting button when hasSubmitted and isHost", () => {
    render(
      <SelectionRack
        selectedMovies={mockSelectedMovies}
        maxSuggestions={3}
        onRemoveMovie={mockOnRemoveMovie}
        onSubmitDeck={mockOnSubmitDeck}
        hasSubmitted={true}
        isHost={true}
        onStartVoting={mockOnStartVoting}
        defaultExpanded={true}
      />
    );

    expect(screen.getByText("Deck Submitted")).toBeInTheDocument();
    const startVotingBtn = screen.getByRole("button", { name: /Start Voting Phase/i });
    expect(startVotingBtn).toBeInTheDocument();

    fireEvent.click(startVotingBtn);
    expect(mockOnStartVoting).toHaveBeenCalledTimes(1);
  });
});
