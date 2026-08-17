import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SwiperFinishedView } from "@/components/stages/swiper/SwiperFinishedView";
import type { VotingProgressResponse } from "@/types";

const mockProgress: VotingProgressResponse = {
  sessionId: 1,
  roomCode: "MVE892",
  totalMovies: 5,
  totalUsers: 2,
  completedUserCount: 1,
  allUsersCompleted: false,
  users: [
    { userId: 10, displayName: "Alice", votedCount: 5, completed: true },
    { userId: 11, displayName: "Bob", votedCount: 2, completed: false },
  ],
};

describe("SwiperFinishedView Component", () => {
  it("renders locked votes header, waiting message, and member progress", () => {
    render(
      <SwiperFinishedView
        progress={mockProgress}
        currentUserId={10}
      />
    );

    expect(screen.getByText(/Your Votes Are Locked In!/i)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for Room Consensus/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice \(You\)/i)).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Swiping\.\.\./i)).toBeInTheDocument();
  });
});
