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
  page: number = 1,
  signal?: AbortSignal
): Promise<MovieSearchResponse> {
  const encodedQuery = encodeURIComponent(query.trim());
  const safePage = Math.max(1, page);
  return request<MovieSearchResponse>(
    `/api/v1/movies/search?query=${encodedQuery}&page=${safePage}`,
    {
      method: "GET",
      signal,
    }
  );
}

export async function getTrendingMovies(
  page: number = 1,
  signal?: AbortSignal
): Promise<MovieSearchResponse> {
  const safePage = Math.max(1, page);
  return request<MovieSearchResponse>(
    `/api/v1/movies/trending?page=${safePage}`,
    {
      method: "GET",
      signal,
    }
  );
}

export interface DiscoverMovieParams {
  genre?: string;
  provider?: string;
  decade?: string;
  minRating?: number;
  minRuntime?: number;
  maxRuntime?: number;
  language?: string;
  sortBy?: string;
  page?: number;
  signal?: AbortSignal;
}

export async function discoverMovies(
  params: DiscoverMovieParams
): Promise<MovieSearchResponse> {
  const safePage = Math.max(1, params.page || 1);
  const searchParams = new URLSearchParams();
  if (params.genre) searchParams.set("genre", params.genre);
  if (params.provider) searchParams.set("provider", params.provider);
  if (params.decade) searchParams.set("decade", params.decade);
  if (params.minRating && params.minRating > 0) searchParams.set("minRating", String(params.minRating));
  if (params.minRuntime && params.minRuntime > 0) searchParams.set("minRuntime", String(params.minRuntime));
  if (params.maxRuntime && params.maxRuntime > 0) searchParams.set("maxRuntime", String(params.maxRuntime));
  if (params.language) searchParams.set("language", params.language);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  searchParams.set("page", String(safePage));

  return request<MovieSearchResponse>(
    `/api/v1/movies/discover?${searchParams.toString()}`,
    {
      method: "GET",
      signal: params.signal,
    }
  );
}

export async function getMovieDetails(
  tmdbId: number,
  signal?: AbortSignal
): Promise<MovieDetailsDto> {
  return request<MovieDetailsDto>(`/api/v1/movies/${tmdbId}`, {
    method: "GET",
    signal,
  });
}

export async function submitMovies(
  sessionId: number,
  requestData: SubmitMoviesRequest
): Promise<MovieSuggestionResponse[]> {
  return request<MovieSuggestionResponse[]>(`/api/v1/sessions/${sessionId}/movies`, {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getSessionMovies(
  sessionId: number
): Promise<MovieSuggestionResponse[]> {
  return request<MovieSuggestionResponse[]>(`/api/v1/sessions/${sessionId}/movies`, {
    method: "GET",
  });
}

export async function startVoting(
  sessionId: number
): Promise<SessionResponse> {
  return request<SessionResponse>(`/api/v1/sessions/${sessionId}/start`, {
    method: "POST",
  });
}
