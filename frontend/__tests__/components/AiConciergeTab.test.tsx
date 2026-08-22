import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AiConciergeTab } from "@/components/stages/search/AiConciergeTab";
import * as aiApi from "@/lib/api/ai";
import type { AiRecommendationResponse, MovieDto } from "@/types";

describe("AiConciergeTab Component", () => {
  const mockOnToggleDeck = vi.fn();

  const sampleMoviesTurn1: MovieDto[] = [
    {
      tmdbId: 603,
      title: "The Matrix",
      overview: "A computer hacker learns about the true nature of his reality.",
      posterPath: "/matrix.jpg",
      releaseYear: 1999,
      voteAverage: 8.2,
      aiReasoning: "Iconic cyberpunk action with mind-bending virtual reality.",
    },
    {
      tmdbId: 550,
      title: "Fight Club",
      overview: "An insomniac office worker looking for a way to change his life.",
      posterPath: "/fightclub.jpg",
      releaseYear: 1999,
      voteAverage: 8.4,
      aiReasoning: "Gritty 90s psychological thriller with unmatched style.",
    },
  ];

  const sampleMoviesTurn2: MovieDto[] = [
    {
      tmdbId: 324857,
      title: "Spider-Man: Into the Spider-Verse",
      overview: "Teen Miles Morales becomes the new Spider-Man.",
      posterPath: "/spiderverse.jpg",
      releaseYear: 2018,
      voteAverage: 8.4,
      aiReasoning: "Groundbreaking animation with witty humor and heart.",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders header, initial welcome message, suggestions chips, and input bar", () => {
    render(
      <AiConciergeTab
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    expect(screen.getByText("Movie Concierge AI")).toBeInTheDocument();
    expect(screen.getByText(/Gemini 3.5 Flash-Lite/i)).toBeInTheDocument();
    expect(screen.getByText(/Hey there! Not sure what to nominate/i)).toBeInTheDocument();
    expect(screen.getByText("Mind-Bending Sci-Fi")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask the Movie Concierge/i)).toBeInTheDocument();
  });

  it("handles multi-turn conversation preserving turn 1 and turn 2 with result counters", async () => {
    const mockResponse1: AiRecommendationResponse = {
      prompt: "90s mind bending thriller",
      replyMessage: "Here are 2 great 90s picks:",
      movies: sampleMoviesTurn1,
      page: 1,
      pageSize: 4,
      totalResults: 2,
      hasMore: false,
    };

    const mockResponse2: AiRecommendationResponse = {
      prompt: "animated gems",
      replyMessage: "Here is an animated masterpiece:",
      movies: sampleMoviesTurn2,
      page: 1,
      pageSize: 4,
      totalResults: 1,
      hasMore: false,
    };

    vi.spyOn(aiApi, "getAiRecommendations")
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    render(
      <AiConciergeTab
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    const input = screen.getByPlaceholderText(/Ask the Movie Concierge/i);
    const askBtn = screen.getByRole("button", { name: /Ask AI/i });

    // Submit Turn 1
    fireEvent.change(input, { target: { value: "90s mind bending thriller" } });
    fireEvent.click(askBtn);

    await waitFor(() => {
      expect(screen.getByText("90s mind bending thriller")).toBeInTheDocument();
      expect(screen.getByText("The Matrix")).toBeInTheDocument();
      expect(screen.getByText("Fight Club")).toBeInTheDocument();
      expect(screen.getByText("2 Results Found")).toBeInTheDocument();
    });

    // Submit Turn 2
    fireEvent.change(input, { target: { value: "animated gems" } });
    fireEvent.click(screen.getByRole("button", { name: /Ask AI/i }));

    await waitFor(() => {
      // Turn 2 is rendered
      expect(screen.getByText("animated gems")).toBeInTheDocument();
      expect(screen.getByText("Spider-Man: Into the Spider-Verse")).toBeInTheDocument();
      expect(screen.getByText("1 Results Found")).toBeInTheDocument();

      // Turn 1 is STILL preserved in history!
      expect(screen.getByText("90s mind bending thriller")).toBeInTheDocument();
      expect(screen.getByText("The Matrix")).toBeInTheDocument();
    });
  });

  it("handles off-topic prompt without rendering movie cards", async () => {
    const offTopicResponse: AiRecommendationResponse = {
      prompt: "write a python script to count 1 to 10",
      replyMessage: "I only write movie scripts, not Python scripts! Tell me your favorite movie genre instead.",
      movies: [],
      page: 1,
      pageSize: 4,
      totalResults: 0,
      hasMore: false,
    };

    vi.spyOn(aiApi, "getAiRecommendations").mockResolvedValueOnce(offTopicResponse);

    render(
      <AiConciergeTab
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    const input = screen.getByPlaceholderText(/Ask the Movie Concierge/i);
    fireEvent.change(input, { target: { value: "write a python script to count 1 to 10" } });
    fireEvent.click(screen.getByRole("button", { name: /Ask AI/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/I only write movie scripts, not Python scripts!/i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/Results Found/i)).not.toBeInTheDocument();
    });
  });

  it("toggles movies in deck when clicking nominate button in cards", async () => {
    const mockResponse: AiRecommendationResponse = {
      prompt: "cyberpunk",
      replyMessage: "Here is a cyberpunk movie:",
      movies: [sampleMoviesTurn1[0]],
      page: 1,
      pageSize: 4,
      totalResults: 1,
      hasMore: false,
    };

    vi.spyOn(aiApi, "getAiRecommendations").mockResolvedValueOnce(mockResponse);

    render(
      <AiConciergeTab
        roomCode="ROOM12"
        deckMovieIds={[]}
        onToggleDeck={mockOnToggleDeck}
        isDeckFull={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Ask the Movie Concierge/i), {
      target: { value: "cyberpunk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ask AI/i }));

    await waitFor(() => {
      expect(screen.getByText("The Matrix")).toBeInTheDocument();
    });

    const nominateBtn = screen.getByRole("button", { name: /Nominate The Matrix/i });
    fireEvent.click(nominateBtn);

    expect(mockOnToggleDeck).toHaveBeenCalledWith(sampleMoviesTurn1[0]);
  });
});
