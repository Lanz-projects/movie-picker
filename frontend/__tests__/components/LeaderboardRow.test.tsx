import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LeaderboardRow } from "@/components/stages/winner/leaderboard/LeaderboardRow";
import type { ScoredMovieDto } from "@/types";

describe("LeaderboardRow Component", () => {
  const mockMovie: ScoredMovieDto = {
    movieSuggestionId: 2,
    tmdbId: 27205,
    title: "Inception",
    posterPath: "/inception.jpg",
    overview: "A thief who steals corporate secrets...",
    releaseYear: 2010,
    suggestedBy: "Bob",
    score: 4,
    yesVotes: 2,
    superlikeVotes: 1,
    noVotes: 0,
    skipVotes: 0,
    matchPercentage: 80,
    isUnanimous: false,
    positiveVoters: ["Alice", "Bob"],
    superlikers: ["Bob"],
  };

  it("renders rank badge, movie title, release year, and nominator", () => {
    render(<LeaderboardRow movie={mockMovie} rank={2} />);

    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("2010")).toBeInTheDocument();
    expect(screen.getByText("Suggested by")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders match percentage and score badges", () => {
    render(<LeaderboardRow movie={mockMovie} rank={2} />);

    expect(screen.getByText("80% Match")).toBeInTheDocument();
    expect(screen.getByText("+4 pts")).toBeInTheDocument();
  });

  it("renders vote tallies accurately", () => {
    render(<LeaderboardRow movie={mockMovie} rank={2} />);

    expect(screen.getByText("2")).toBeInTheDocument(); // yesVotes
    expect(screen.getByText("1")).toBeInTheDocument(); // superlikeVotes
  });

  it("triggers onOpenDetails when info button is clicked", () => {
    const handleOpenDetails = vi.fn();
    render(
      <LeaderboardRow
        movie={mockMovie}
        rank={2}
        onOpenDetails={handleOpenDetails}
      />
    );

    const infoButton = screen.getByRole("button", {
      name: /View details for Inception/i,
    });
    expect(infoButton).toBeInTheDocument();

    fireEvent.click(infoButton);
    expect(handleOpenDetails).toHaveBeenCalledTimes(1);
    expect(handleOpenDetails).toHaveBeenCalledWith(mockMovie);
  });
});
