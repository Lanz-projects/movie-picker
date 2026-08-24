import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LeaderboardList } from "@/components/stages/winner/leaderboard/LeaderboardList";
import type { ScoredMovieDto } from "@/types";

describe("LeaderboardList Component", () => {
  const mockRankedMovies: ScoredMovieDto[] = [
    {
      movieSuggestionId: 2,
      tmdbId: 27205,
      title: "Inception",
      posterPath: "/inception.jpg",
      overview: "Overview 1",
      releaseYear: 2010,
      suggestedBy: "Bob",
      score: 4,
      yesVotes: 2,
      superlikeVotes: 1,
      noVotes: 0,
      skipVotes: 0,
      matchPercentage: 80,
      isUnanimous: false,
    },
    {
      movieSuggestionId: 3,
      tmdbId: 157336,
      title: "Interstellar",
      posterPath: "/interstellar.jpg",
      overview: "Overview 2",
      releaseYear: 2014,
      suggestedBy: "Charlie",
      score: 2,
      yesVotes: 1,
      superlikeVotes: 0,
      noVotes: 1,
      skipVotes: 0,
      matchPercentage: 50,
      isUnanimous: false,
    },
  ];

  it("renders runner-ups heading and list of ranked movies starting at #2", () => {
    render(<LeaderboardList rankedMovies={mockRankedMovies} />);

    expect(screen.getByText("Runner-Ups & Rankings")).toBeInTheDocument();
    expect(screen.getByText("2 movies")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("Interstellar")).toBeInTheDocument();
  });

  it("renders clean empty state when no runner-ups exist", () => {
    render(<LeaderboardList rankedMovies={[]} />);

    expect(screen.getByText("No runner-up movies")).toBeInTheDocument();
    expect(
      screen.getByText(/Only one movie was in this session's nomination pool/i)
    ).toBeInTheDocument();
  });

  it("propagates onOpenDetails callback when row details button is clicked", () => {
    const handleOpenDetails = vi.fn();
    render(
      <LeaderboardList
        rankedMovies={mockRankedMovies}
        onOpenDetails={handleOpenDetails}
      />
    );

    const infoButtons = screen.getAllByRole("button", {
      name: /View details for/i,
    });
    expect(infoButtons).toHaveLength(2);

    fireEvent.click(infoButtons[0]);
    expect(handleOpenDetails).toHaveBeenCalledTimes(1);
    expect(handleOpenDetails).toHaveBeenCalledWith(mockRankedMovies[0]);
  });
});
