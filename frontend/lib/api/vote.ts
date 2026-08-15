import { request } from "./client";
import type {
  CastVoteRequest,
  VoteResponse,
  VotingProgressResponse,
  SessionResultsResponse,
} from "@/types";

export async function castVote(
  sessionId: number,
  requestData: CastVoteRequest
): Promise<VoteResponse> {
  return request<VoteResponse>(`/api/sessions/${sessionId}/votes`, {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getVotingProgressByRoomCode(
  roomCode: string
): Promise<VotingProgressResponse> {
  const code = encodeURIComponent(roomCode.trim());
  return request<VotingProgressResponse>(
    `/api/sessions/room/${code}/votes/progress`,
    {
      method: "GET",
    }
  );
}

export async function getResultsByRoomCode(
  roomCode: string
): Promise<SessionResultsResponse> {
  const code = encodeURIComponent(roomCode.trim());
  return request<SessionResultsResponse>(
    `/api/sessions/room/${code}/results`,
    {
      method: "GET",
    }
  );
}
