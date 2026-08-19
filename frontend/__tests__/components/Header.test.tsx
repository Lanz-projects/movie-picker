import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "@/components/layout/Header";
import type { UserResponse } from "@/types";

describe("Header Component", () => {
  const mockUsers: UserResponse[] = [
    { id: 1, displayName: "Alice", joinedAt: "2026-01-01T00:00:00" },
    { id: 2, displayName: "Bob", joinedAt: "2026-01-01T00:01:00" },
  ];

  it("renders brand logo, room code, and interactive players dropdown when in room", () => {
    render(
      <Header
        roomCode="MVE892"
        nickname="Alice"
        isHost={true}
        memberCount={2}
        users={mockUsers}
        maxUsers={8}
        hostName="Alice"
        currentUserId={1}
        stage="SEARCH"
      />
    );

    expect(screen.getByText("What Should We Watch")).toBeInTheDocument();
    expect(screen.getByText("MVE892")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view room players and readiness status/i })).toBeInTheDocument();
  });

  it("invokes onLeaveRoom when leave button is clicked", () => {
    const handleLeave = vi.fn();
    render(
      <Header
        roomCode="MVE892"
        nickname="Alice"
        isHost={false}
        users={mockUsers}
        onLeaveRoom={handleLeave}
      />
    );

    const leaveBtn = screen.getByRole("button", { name: /leave room/i });
    fireEvent.click(leaveBtn);

    expect(handleLeave).toHaveBeenCalledTimes(1);
  });
});
