import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RoomUsersDropdown } from "@/components/layout/RoomUsersDropdown";
import type { UserResponse } from "@/types";

describe("RoomUsersDropdown Component", () => {
  const mockUsers: UserResponse[] = [
    { id: 1, displayName: "Alice", joinedAt: "2026-01-01T00:00:00" },
    { id: 2, displayName: "Bob", joinedAt: "2026-01-01T00:01:00" },
    { id: 3, displayName: "Charlie", joinedAt: "2026-01-01T00:02:00" },
  ];

  it("renders trigger button with member count and closed state initially", () => {
    render(
      <RoomUsersDropdown
        users={mockUsers}
        maxUsers={8}
        hostName="Alice"
        currentUserId={1}
        isHost={true}
        stage="SEARCH"
        submissionProgress={{
          submittedCount: 1,
          totalCount: 3,
          readyUserIds: [1],
        }}
      />
    );

    expect(screen.getByRole("button", { name: /view room players and readiness status/i })).toBeInTheDocument();
    expect(screen.getByText("3/8")).toBeInTheDocument();
    expect(screen.getByText("(1/3 Ready)")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens dropdown menu on click, displaying members and readiness checkmarks", () => {
    render(
      <RoomUsersDropdown
        users={mockUsers}
        maxUsers={8}
        hostName="Alice"
        currentUserId={1}
        isHost={true}
        stage="SEARCH"
        submissionProgress={{
          submittedCount: 2,
          totalCount: 3,
          readyUserIds: [1, 2],
        }}
      />
    );

    const triggerBtn = screen.getByRole("button", { name: /view room players and readiness status/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Room Members")).toBeInTheDocument();
    expect(screen.getByText("2 of 3 Ready")).toBeInTheDocument();

    // Alice is host, user 1, ready
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("(You)")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();

    // Bob is user 2, ready
    expect(screen.getByText("Bob")).toBeInTheDocument();

    // Charlie is user 3, picking
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Picking...")).toBeInTheDocument();
  });

  it("allows host to kick a non-host member with confirmation", () => {
    const handleKick = vi.fn();
    render(
      <RoomUsersDropdown
        users={mockUsers}
        maxUsers={8}
        hostName="Alice"
        currentUserId={1}
        isHost={true}
        stage="SEARCH"
        onKickUser={handleKick}
      />
    );

    const triggerBtn = screen.getByRole("button", { name: /view room players and readiness status/i });
    fireEvent.click(triggerBtn);

    // Host can kick Bob
    const kickBobBtn = screen.getByRole("button", { name: /kick bob from room/i });
    expect(kickBobBtn).toBeInTheDocument();

    fireEvent.click(kickBobBtn);

    // Confirm panel shows
    expect(screen.getByText(/remove bob\?/i)).toBeInTheDocument();
    const confirmKickBtn = screen.getByRole("button", { name: /^kick$/i });
    fireEvent.click(confirmKickBtn);

    expect(handleKick).toHaveBeenCalledWith(2, false);
  });

  it("does not render kick buttons when current user is not host", () => {
    render(
      <RoomUsersDropdown
        users={mockUsers}
        maxUsers={8}
        hostName="Alice"
        currentUserId={2} // Bob is not host
        isHost={false}
        stage="SEARCH"
      />
    );

    const triggerBtn = screen.getByRole("button", { name: /view room players and readiness status/i });
    fireEvent.click(triggerBtn);

    expect(screen.queryByRole("button", { name: /kick/i })).not.toBeInTheDocument();
  });
});
