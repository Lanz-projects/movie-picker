import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NominationsReadinessPill } from "@/components/stages/search/NominationsReadinessPill";
import type { UserResponse } from "@/types";

describe("NominationsReadinessPill", () => {
  const mockUsers: UserResponse[] = [
    { id: 10, displayName: "Alice", joinedAt: "2026-08-14T00:00:00" },
    { id: 11, displayName: "Bob", joinedAt: "2026-08-14T00:01:00" },
    { id: 12, displayName: "Charlie", joinedAt: "2026-08-14T00:02:00" },
  ];

  it("renders submitted count and total room count accurately", () => {
    render(
      <NominationsReadinessPill
        users={mockUsers}
        readyUserIds={[10]}
        submittedCount={1}
        totalCount={3}
      />
    );

    expect(screen.getByText("Room Readiness:")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 Ready")).toBeInTheDocument();
  });

  it("renders participant status chips for all users with ready badges", () => {
    render(
      <NominationsReadinessPill
        users={mockUsers}
        readyUserIds={[10, 12]}
        submittedCount={2}
        totalCount={3}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("highlights readiness badge when all players have submitted", () => {
    render(
      <NominationsReadinessPill
        users={mockUsers}
        readyUserIds={[10, 11, 12]}
        submittedCount={3}
        totalCount={3}
      />
    );

    expect(screen.getByText("3 / 3 Ready")).toBeInTheDocument();
  });
});
