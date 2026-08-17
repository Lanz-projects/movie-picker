import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VotingProgressHeader } from "@/components/stages/swiper/VotingProgressHeader";
import type { VotingProgressResponse } from "@/types";

const mockProgress: VotingProgressResponse = {
  sessionId: 1,
  roomCode: "MVE892",
  totalMovies: 8,
  totalUsers: 3,
  completedUserCount: 2,
  allUsersCompleted: false,
  users: [
    { userId: 10, displayName: "Alice", votedCount: 8, completed: true },
    { userId: 11, displayName: "Bob", votedCount: 8, completed: true },
    { userId: 12, displayName: "Charlie", votedCount: 3, completed: false },
  ],
};

describe("VotingProgressHeader Component", () => {
  it("renders movie counter and multiplayer progress badge", () => {
    render(
      <VotingProgressHeader
        currentIndex={2}
        totalMovies={8}
        progress={mockProgress}
      />
    );

    expect(screen.getByText("Movie 3 of 8")).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 3 Ready/i)).toBeInTheDocument();
  });
});
