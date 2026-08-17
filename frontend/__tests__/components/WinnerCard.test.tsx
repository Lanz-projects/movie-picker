import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WinnerCard } from "@/components/stages/winner/WinnerCard";
import type { ScoredMovieDto } from "@/types";

describe("WinnerCard Component", () => {
  const mockUnanimousWinner: ScoredMovieDto = {
    movieSuggestionId: 1,
    tmdbId: 550,
    title: "Fight Club",
    posterPath: "/fightclub.jpg",
    overview: "An insomniac office worker looking for a way to change his life...",
    releaseYear: 1999,
    suggestedBy: "Alice",
    score: 6,
    yesVotes: 3,
    superlikeVotes: 1,
    noVotes: 0,
    skipVotes: 0,
    matchPercentage: 100,
    isUnanimous: true,
    positiveVoters: ["Charlie", "Dave"],
    superlikers: ["Bob"],
  };

  const mockNonUnanimousWinner: ScoredMovieDto = {
    movieSuggestionId: 2,
    tmdbId: 27205,
    title: "Inception",
    posterPath: null,
    overview: "A thief who steals corporate secrets...",
    releaseYear: 2010,
    suggestedBy: "Eve",
    score: 3,
    yesVotes: 2,
    superlikeVotes: 0,
    noVotes: 1,
    skipVotes: 0,
    matchPercentage: 67,
    isUnanimous: false,
    positiveVoters: ["Frank", "Grace"],
    superlikers: [],
  };

  it("renders winner title, release year, overview, and nominator accurately", () => {
    render(<WinnerCard winner={mockUnanimousWinner} />);

    expect(screen.getByText("Tonight's Pick")).toBeInTheDocument();
    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("1999")).toBeInTheDocument();
    expect(screen.getByText(/An insomniac office worker/)).toBeInTheDocument();
    expect(screen.getByText("Suggested by")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders 100% Unanimous badge when isUnanimous is true", () => {
    render(<WinnerCard winner={mockUnanimousWinner} />);

    expect(screen.getByText("100% Unanimous")).toBeInTheDocument();
    expect(screen.getByText("+6 pts")).toBeInTheDocument();
  });

  it("renders match percentage badge when isUnanimous is false", () => {
    render(<WinnerCard winner={mockNonUnanimousWinner} />);

    expect(screen.queryByText("100% Unanimous")).not.toBeInTheDocument();
    expect(screen.getByText("67% Match")).toBeInTheDocument();
    expect(screen.getByText("+3 pts")).toBeInTheDocument();
  });

  it("renders group voter reactions and vote counts", () => {
    render(<WinnerCard winner={mockUnanimousWinner} />);

    expect(screen.getByText("Group Votes")).toBeInTheDocument();
    expect(screen.getByText(/Superliked by:/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Liked by:/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie, Dave/)).toBeInTheDocument();
    expect(screen.getByText(/3 Yes/)).toBeInTheDocument();
    expect(screen.getByText(/1 Superlike/)).toBeInTheDocument();
    expect(screen.getByText(/0 Pass/)).toBeInTheDocument();
  });

  it("renders fallback image state when posterPath is null", () => {
    render(<WinnerCard winner={mockNonUnanimousWinner} />);

    expect(screen.getByText("No Poster Available")).toBeInTheDocument();
  });

  it("triggers onOpenDetails when View Full Movie Details button is clicked", () => {
    const handleOpenDetails = vi.fn();
    render(
      <WinnerCard
        winner={mockUnanimousWinner}
        onOpenDetails={handleOpenDetails}
      />
    );

    const detailsButton = screen.getByRole("button", {
      name: /View Full Movie Details/i,
    });
    expect(detailsButton).toBeInTheDocument();

    fireEvent.click(detailsButton);
    expect(handleOpenDetails).toHaveBeenCalledTimes(1);
    expect(handleOpenDetails).toHaveBeenCalledWith(mockUnanimousWinner);
  });
});
