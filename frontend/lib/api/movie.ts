import { request } from "./client";
import type {
  MovieSearchResponse,
  SubmitMoviesRequest,
  MovieSuggestionResponse,
  SessionResponse,
  MovieDetailsDto,
} from "@/types";

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<MovieSearchResponse> {
  const encodedQuery = encodeURIComponent(query.trim());
  const safePage = Math.max(1, page);
  return request<MovieSearchResponse>(
    `/api/movies/search?query=${encodedQuery}&page=${safePage}`,
    {
      method: "GET",
    }
  );
}

export async function getTrendingMovies(
  page: number = 1
): Promise<MovieSearchResponse> {
  const safePage = Math.max(1, page);
  return request<MovieSearchResponse>(
    `/api/movies/trending?page=${safePage}`,
    {
      method: "GET",
    }
  );
}

export async function discoverMovies(params: {
  genre?: string;
  provider?: string;
  sortBy?: string;
  page?: number;
}): Promise<MovieSearchResponse> {
  const safePage = Math.max(1, params.page || 1);
  const searchParams = new URLSearchParams();
  if (params.genre) searchParams.set("genre", params.genre);
  if (params.provider) searchParams.set("provider", params.provider);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  searchParams.set("page", String(safePage));

  return request<MovieSearchResponse>(
    `/api/movies/discover?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );
}

export async function getMovieDetails(
  tmdbId: number
): Promise<MovieDetailsDto> {
  return request<MovieDetailsDto>(`/api/movies/${tmdbId}`, {
    method: "GET",
  });
}

export async function submitMovies(
  sessionId: number,
  requestData: SubmitMoviesRequest
): Promise<MovieSuggestionResponse[]> {
  return request<MovieSuggestionResponse[]>(`/api/sessions/${sessionId}/movies`, {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getSessionMovies(
  sessionId: number
): Promise<MovieSuggestionResponse[]> {
  return request<MovieSuggestionResponse[]>(`/api/sessions/${sessionId}/movies`, {
    method: "GET",
  });
}

export async function startVoting(
  sessionId: number
): Promise<SessionResponse> {
  return request<SessionResponse>(`/api/sessions/${sessionId}/start`, {
    method: "POST",
  });
}
