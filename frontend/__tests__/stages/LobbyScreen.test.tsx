import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LobbyScreen } from "@/components/stages/LobbyScreen";
import { SessionProvider, useSession } from "@/context/SessionContext";
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

// Helper component to initialize SessionContext in LOBBY state for testing
function LobbyTestHostWrapper({
  isHost = true,
  customSession,
}: {
  isHost?: boolean;
  customSession?: SessionResponse;
}) {
  const { createRoom, joinRoom } = useSession();

  const mockHostSession: SessionResponse = {
    id: 1,
    roomCode: "MVE892",
    hostName: "Alice",
    status: "WAITING",
    maxUsers: 10,
    maxSuggestionsPerUser: 5,
    users: [
      { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
      { id: 11, displayName: "Bob", isHost: false, joinedAt: "2026-08-14T00:01:00" },
    ],
    createdAt: "2026-08-14T00:00:00",
  };

  const handleInit = async () => {
    const sessionToUse = customSession || mockHostSession;
    if (isHost) {
      vi.mocked(api.createSession).mockResolvedValue(sessionToUse);
      await createRoom("Alice");
    } else {
      vi.mocked(api.joinSession).mockResolvedValue(sessionToUse);
      await joinRoom("MVE892", "Bob");
    }
  };

  return (
    <div>
      <button onClick={handleInit} data-testid="init-lobby-btn">
        Init Lobby
      </button>
      <LobbyScreen />
    </div>
  );
}

describe("LobbyScreen Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLobbyScreen = async (isHost = true, customSession?: SessionResponse) => {
    const user = userEvent.setup({ delay: null });
    const view = render(
      <SessionProvider>
        <LobbyTestHostWrapper isHost={isHost} customSession={customSession} />
      </SessionProvider>
    );

    // Initialize the lobby state
    const initBtn = screen.getByTestId("init-lobby-btn");
    await user.click(initBtn);

    return { user, view };
  };

  it("renders 4-letter room code and copies to clipboard on click", async () => {
    const { user } = await renderLobbyScreen(true);

    expect(screen.getByText("MVE892")).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 10 players/i)).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: /copy room code/i });
    expect(copyButton).toBeInTheDocument();

    await user.click(copyButton);
    expect(screen.getByText(/copied to clipboard!/i)).toBeInTheDocument();
  });

  it("renders real-time member roster with Host crown and (You) badges", async () => {
    await renderLobbyScreen(true);

    expect(screen.getByText("Joined Members (2)")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("renders 'Start Adding Movies' CTA for host and advances to search stage", async () => {
    const { user } = await renderLobbyScreen(true);

    const updatedSession: SessionResponse = {
      id: 1,
      roomCode: "MVE892",
      hostName: "Alice",
      status: "SUGGESTING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [
        { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
      ],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.updateSessionStatus).mockResolvedValue(updatedSession);

    const startButton = screen.getByRole("button", { name: /start adding movies/i });
    expect(startButton).toBeInTheDocument();

    await user.click(startButton);
    expect(api.updateSessionStatus).toHaveBeenCalledWith("MVE892", "SUGGESTING");
  });

  it("renders waiting indicator for guest and hides start button", async () => {
    await renderLobbyScreen(false);

    expect(screen.getByText(/waiting for host/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start adding movies/i })
    ).not.toBeInTheDocument();
  });

  it("invokes leaveRoom when clicking Leave Room button", async () => {
    const { user } = await renderLobbyScreen(true);

    vi.mocked(api.leaveSessionByRoomCode).mockResolvedValue({
      message: "User Alice left the session.",
      newHostName: "Bob",
      sessionClosed: false,
    });

    const leaveButton = screen.getByRole("button", { name: /leave room/i });
    await user.click(leaveButton);

    expect(api.leaveSessionByRoomCode).toHaveBeenCalledWith("MVE892", 10);
  });

  it("renders kick button for host and allows kicking guest members", async () => {
    const { user } = await renderLobbyScreen(true);

    vi.mocked(api.kickUser).mockResolvedValue({
      message: "User Bob was removed from the session by the host.",
      newHostName: null,
      sessionClosed: false,
    });

    const kickBobBtn = screen.getByRole("button", { name: /kick bob/i });
    expect(kickBobBtn).toBeInTheDocument();

    // First click asks for confirmation ("Confirm?")
    await user.click(kickBobBtn);
    expect(screen.getByText(/confirm\?/i)).toBeInTheDocument();

    // Second click triggers kick API
    await user.click(kickBobBtn);
    expect(api.kickUser).toHaveBeenCalledWith("MVE892", 10, 11, false);
  });

  it("renders Strike badge and gives host option to Ban Permanently for repeat offenders", async () => {
    const mockSessionWithRepeatOffender: SessionResponse = {
      id: 1,
      roomCode: "MVE892",
      hostName: "Alice",
      status: "WAITING",
      maxUsers: 10,
      maxSuggestionsPerUser: 5,
      users: [
        { id: 10, displayName: "Alice", isHost: true, joinedAt: "2026-08-14T00:00:00" },
        { id: 11, displayName: "Bob", isHost: false, joinedAt: "2026-08-14T00:01:00", kickCount: 1 },
      ],
      createdAt: "2026-08-14T00:00:00",
    };

    vi.mocked(api.kickUser).mockResolvedValue({
      message: "User Bob was permanently banned from the session by the host.",
      newHostName: null,
      sessionClosed: false,
    });

    const { user } = await renderLobbyScreen(true, mockSessionWithRepeatOffender);

    // Verify Strike badge renders
    expect(screen.getByText(/strike 1/i)).toBeInTheDocument();

    const kickBobBtn = screen.getByRole("button", { name: /kick bob/i });
    await user.click(kickBobBtn);

    // Host sees both Kick Round and Ban Perm
    const kickRoundBtn = screen.getByRole("button", { name: /kick bob for round/i });
    const banPermBtn = screen.getByRole("button", { name: /ban bob permanently/i });
    expect(kickRoundBtn).toBeInTheDocument();
    expect(banPermBtn).toBeInTheDocument();

    // Click Ban Perm
    await user.click(banPermBtn);
    expect(api.kickUser).toHaveBeenCalledWith("MVE892", 10, 11, true);
  });

  it("does not render kick button when user is a guest", async () => {
    await renderLobbyScreen(false);

    expect(screen.queryByRole("button", { name: /kick alice/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /kick bob/i })).not.toBeInTheDocument();
  });
});
