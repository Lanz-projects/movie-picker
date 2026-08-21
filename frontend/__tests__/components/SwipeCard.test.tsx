import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SwipeCard } from "@/components/stages/swiper/SwipeCard";
import type { MovieSuggestionResponse } from "@/types";

const mockMovie: MovieSuggestionResponse = {
  id: 101,
  tmdbId: 550,
  userId: 10,
  userDisplayName: "Alice",
  title: "Fight Club",
  overview: "An insomniac office worker looking for a way to change his life...",
  posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  releaseYear: 1999,
  suggestedAt: "2026-08-14T00:00:00",
};

describe("SwipeCard Component", () => {
  it("renders movie title, release year, and overview for blind anonymous voting", () => {
    render(<SwipeCard movie={mockMovie} isTop={true} />);

    expect(screen.getByRole("article", { name: "Fight Club" })).toBeInTheDocument();
    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("1999")).toBeInTheDocument();
    expect(screen.queryByText(/Nominated by/i)).not.toBeInTheDocument();
    expect(screen.getByText(/An insomniac office worker/i)).toBeInTheDocument();
  });

  it("calls onOpenDetails when info button is clicked", async () => {
    const user = userEvent.setup();
    const handleOpenDetails = vi.fn();

    render(
      <SwipeCard
        movie={mockMovie}
        isTop={true}
        onOpenDetails={handleOpenDetails}
      />
    );

    const infoBtn = screen.getByRole("button", { name: /view details for fight club/i });
    await user.click(infoBtn);

    expect(handleOpenDetails).toHaveBeenCalledWith(mockMovie);
  });

  it("renders fallback placeholder when posterPath is null", () => {
    const movieWithoutPoster: MovieSuggestionResponse = {
      ...mockMovie,
      posterPath: null,
    };

    render(<SwipeCard movie={movieWithoutPoster} isTop={true} />);

    expect(screen.getByRole("heading", { name: "Fight Club" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("triggers LIKE swipe when dragged to the right beyond threshold", () => {
    const handleSwipe = vi.fn();
    render(<SwipeCard movie={mockMovie} isTop={true} onSwipe={handleSwipe} />);

    const card = screen.getByRole("article", { name: "Fight Club" });

    // Simulate pointer drag to the right (+120px)
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 220, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 220, clientY: 100, pointerId: 1 });

    expect(handleSwipe).toHaveBeenCalledWith("LIKE");
  });

  it("triggers PASS swipe when dragged to the left beyond threshold", () => {
    const handleSwipe = vi.fn();
    render(<SwipeCard movie={mockMovie} isTop={true} onSwipe={handleSwipe} />);

    const card = screen.getByRole("article", { name: "Fight Club" });

    // Simulate pointer drag to the left (-120px)
    fireEvent.pointerDown(card, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 80, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 80, clientY: 100, pointerId: 1 });

    expect(handleSwipe).toHaveBeenCalledWith("PASS");
  });

  it("triggers SUPERLIKE swipe when dragged upwards beyond threshold", () => {
    const handleSwipe = vi.fn();
    render(<SwipeCard movie={mockMovie} isTop={true} onSwipe={handleSwipe} />);

    const card = screen.getByRole("article", { name: "Fight Club" });

    // Simulate pointer drag upwards (-100px Y)
    fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 100, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 100, clientY: 90, pointerId: 1 });

    expect(handleSwipe).toHaveBeenCalledWith("SUPERLIKE");
  });

  it("does not trigger swipe when drag is released below threshold", () => {
    const handleSwipe = vi.fn();
    render(<SwipeCard movie={mockMovie} isTop={true} onSwipe={handleSwipe} />);

    const card = screen.getByRole("article", { name: "Fight Club" });

    // Small drag (+30px)
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 130, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 130, clientY: 100, pointerId: 1 });

    expect(handleSwipe).not.toHaveBeenCalled();
  });
});
