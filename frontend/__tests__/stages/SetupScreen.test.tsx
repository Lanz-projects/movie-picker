import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetupScreen } from "@/components/stages/SetupScreen";
import { SessionProvider } from "@/context/SessionContext";
import * as api from "@/lib/api";
import type { SessionResponse } from "@/types";

vi.mock("@/lib/api");
vi.mock("@/lib/websocket", () => ({
  stompService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    subscribeToRoom: vi.fn().mockReturnValue(vi.fn()),
    subscribeToResults: vi.fn().mockReturnValue(vi.fn()),
    publishVote: vi.fn(),
  },
}));

describe("SetupScreen Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSetupScreen = () => {
    return render(
      <SessionProvider>
        <SetupScreen />
      </SessionProvider>
    );
  };

  it("renders cinema hero header and default Host a Room tab", () => {
    renderSetupScreen();

    expect(
      screen.getByRole("heading", { name: /what should we watch\?/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /host a room/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join with code/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. lanz, sarah/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create cinema room/i })
    ).toBeInTheDocument();
  });

  it("switches to Join with Code tab when clicked", async () => {
    renderSetupScreen();

    const joinTab = screen.getByRole("button", { name: /join with code/i });
    await userEvent.click(joinTab);

    expect(screen.getByPlaceholderText(/mve8/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join cinema room/i })
    ).toBeInTheDocument();
  });

  it("validates host nickname and submits create room request", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Lanz",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [{ id: 10, displayName: "Lanz", isHost: true, joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    renderSetupScreen();

    const submitButton = screen.getByRole("button", { name: /create cinema room/i });

    // Submit empty
    await userEvent.click(submitButton);
    expect(screen.getByText(/please enter your nickname\./i)).toBeInTheDocument();

    // Type nickname
    const nameInput = screen.getByPlaceholderText(/e\.g\. lanz, sarah/i);
    await userEvent.type(nameInput, "Lanz");

    await userEvent.click(submitButton);

    expect(api.createSession).toHaveBeenCalledWith({
      hostName: "Lanz",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
    });
  });

  it("updates max players and suggestions using stepper buttons", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Lanz",
      status: "WAITING",
      maxUsers: 11,
      maxSuggestionsPerUser: 4,
      users: [{ id: 10, displayName: "Lanz", isHost: true, joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    renderSetupScreen();

    // Increase max players from 10 to 11
    const increasePlayersBtn = screen.getByRole("button", { name: /increase max players/i });
    await userEvent.click(increasePlayersBtn);

    // Decrease movies per player from 5 to 4
    const decreaseMoviesBtn = screen.getByRole("button", { name: /decrease movies per player/i });
    await userEvent.click(decreaseMoviesBtn);

    const nameInput = screen.getByPlaceholderText(/e\.g\. lanz, sarah/i);
    await userEvent.type(nameInput, "Lanz");

    const submitButton = screen.getByRole("button", { name: /create cinema room/i });
    await userEvent.click(submitButton);

    expect(api.createSession).toHaveBeenCalledWith({
      hostName: "Lanz",
      maxUsers: 11,
      maxSuggestionsPerUser: 4,
    });
  });

  it("allows directly typing numbers into max players and suggestions inputs", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "MVE8",
      hostName: "Lanz",
      status: "WAITING",
      maxUsers: 16,
      maxSuggestionsPerUser: 8,
      users: [{ id: 10, displayName: "Lanz", isHost: true, joinedAt: "2026-08-14T00:00:00" }],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.createSession).mockResolvedValue(mockSession);

    renderSetupScreen();

    const maxPlayersInput = screen.getByLabelText(/max players input/i);
    await userEvent.clear(maxPlayersInput);
    await userEvent.type(maxPlayersInput, "16");

    const maxSuggestionsInput = screen.getByLabelText(/movies per player input/i);
    await userEvent.clear(maxSuggestionsInput);
    await userEvent.type(maxSuggestionsInput, "8");

    const nameInput = screen.getByPlaceholderText(/e\.g\. lanz, sarah/i);
    await userEvent.type(nameInput, "Lanz");

    const submitButton = screen.getByRole("button", { name: /create cinema room/i });
    await userEvent.click(submitButton);

    expect(api.createSession).toHaveBeenCalledWith({
      hostName: "Lanz",
      maxUsers: 16,
      maxSuggestionsPerUser: 8,
    });
  });

  it("validates join room code mask, auto-uppercases, and submits join request", async () => {
    const mockSession: SessionResponse = {
      id: 1,
      roomCode: "ABCD",
      hostName: "HostUser",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [
        { id: 1, displayName: "HostUser", isHost: true, joinedAt: "2026-08-14T00:00:00" },
        { id: 2, displayName: "Alex", isHost: false, joinedAt: "2026-08-14T00:01:00" },
      ],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.joinSession).mockResolvedValue(mockSession);

    renderSetupScreen();

    // Switch to Join tab
    await userEvent.click(screen.getByRole("button", { name: /join with code/i }));

    const codeInput = screen.getByPlaceholderText(/mve8/i);
    const nameInput = screen.getByPlaceholderText(/e\.g\. alex/i);
    const submitButton = screen.getByRole("button", { name: /join cinema room/i });

    // Type lowercase code (should auto-uppercase)
    await userEvent.type(codeInput, "abcd");
    expect(codeInput).toHaveValue("ABCD");

    await userEvent.type(nameInput, "Alex");
    await userEvent.click(submitButton);

    expect(api.joinSession).toHaveBeenCalledWith({
      roomCode: "ABCD",
      displayName: "Alex",
    });
  });

  it("displays server error banner when room creation or join fails", async () => {
    vi.mocked(api.createSession).mockRejectedValue(
      new Error("Room creation failed due to database error.")
    );

    renderSetupScreen();

    const nameInput = screen.getByPlaceholderText(/e\.g\. lanz, sarah/i);
    await userEvent.type(nameInput, "Lanz");

    const submitButton = screen.getByRole("button", { name: /create cinema room/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/room creation failed due to database error\./i)
      ).toBeInTheDocument();
    });

    // Dismiss error button
    const dismissButton = screen.getByTitle(/dismiss error/i);
    await userEvent.click(dismissButton);

    expect(
      screen.queryByText(/room creation failed due to database error\./i)
    ).not.toBeInTheDocument();
  });
});
