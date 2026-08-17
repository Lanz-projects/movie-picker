import { request } from "./client";
import type { SessionResultsResponse } from "@/types";

export async function getResults(
  sessionId: number
): Promise<SessionResultsResponse> {
  return request<SessionResultsResponse>(`/api/sessions/${sessionId}/results`, {
    method: "GET",
  });
}

export async function getResultsByRoomCode(
  roomCode: string
): Promise<SessionResultsResponse> {
  const code = encodeURIComponent(roomCode.trim());
  return request<SessionResultsResponse>(`/api/sessions/room/${code}/results`, {
    method: "GET",
  });
}

export async function calculateResults(
  sessionId: number
): Promise<SessionResultsResponse> {
  return request<SessionResultsResponse>(`/api/sessions/${sessionId}/calculate`, {
    method: "POST",
  });
}

export async function calculateResultsByRoomCode(
  roomCode: string
): Promise<SessionResultsResponse> {
  const code = encodeURIComponent(roomCode.trim());
  return request<SessionResultsResponse>(`/api/sessions/room/${code}/calculate`, {
    method: "POST",
  });
}
