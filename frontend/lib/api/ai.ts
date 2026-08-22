import { request } from "./client";
import type {
  AiRecommendationRequest,
  AiRecommendationResponse,
} from "@/types";

/**
 * Fetches vibe-based movie recommendations for an active movie room.
 * Excludes currently nominated room movies and applies room context.
 */
export async function getAiRecommendations(
  roomCode: string,
  requestData: AiRecommendationRequest,
  signal?: AbortSignal
): Promise<AiRecommendationResponse> {
  const normalizedRoomCode = encodeURIComponent(roomCode.trim().toUpperCase());
  return request<AiRecommendationResponse>(
    `/api/v1/sessions/${normalizedRoomCode}/ai/recommendations`,
    {
      method: "POST",
      body: JSON.stringify(requestData),
      signal,
    }
  );
}

/**
 * Fetches standalone vibe-based movie recommendations without room context.
 */
export async function getStandaloneAiRecommendations(
  requestData: AiRecommendationRequest,
  signal?: AbortSignal
): Promise<AiRecommendationResponse> {
  return request<AiRecommendationResponse>(`/api/v1/ai/recommendations`, {
    method: "POST",
    body: JSON.stringify(requestData),
    signal,
  });
}
