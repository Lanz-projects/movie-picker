import { request } from "./client";
import type {
  MovieSearchResponse,
  SubmitMoviesRequest,
  MovieSuggestionResponse,
  SessionResponse,
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
