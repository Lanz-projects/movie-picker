import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodeModal } from "@/components/ui/QRCodeModal";

vi.mock("qrcode", () => ({
  default: {
    toCanvas: vi.fn((_canvas, _url, _options, callback) => {
      if (callback) callback(null);
    }),
  },
}));

describe("QRCodeModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<QRCodeModal isOpen={false} roomCode="MVE892" onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders QR dialog, room code, and instructions when isOpen is true", () => {
    render(<QRCodeModal isOpen={true} roomCode="MVE892" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /scan to join room/i })).toBeInTheDocument();
    expect(screen.getByText("MVE892")).toBeInTheDocument();
    expect(screen.getByText(/point your phone camera to jump straight in/i)).toBeInTheDocument();
  });

  it("calls onClose when clicking close button", async () => {
    const user = userEvent.setup({ delay: null });
    const handleClose = vi.fn();

    render(<QRCodeModal isOpen={true} roomCode="MVE892" onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: /close qr code dialog/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when pressing Escape key", () => {
    const handleClose = vi.fn();
    render(<QRCodeModal isOpen={true} roomCode="MVE892" onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("copies invite link from QR modal to clipboard on click", async () => {
    const user = userEvent.setup({ delay: null });
    const writeSpy = vi.spyOn(navigator.clipboard, "writeText");

    render(<QRCodeModal isOpen={true} roomCode="MVE892" onClose={vi.fn()} />);

    const copyBtn = screen.getByRole("button", { name: /copy invite link from qr modal/i });
    await user.click(copyBtn);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("/?join=MVE892"));
  });
});
