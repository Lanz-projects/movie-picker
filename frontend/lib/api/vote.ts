import { request } from "./client";
import type {
  CastVoteRequest,
  VoteResponse,
  VotingProgressResponse,
} from "@/types";

export async function castVote(
  sessionId: number,
  requestData: CastVoteRequest
): Promise<VoteResponse> {
  return request<VoteResponse>(`/api/v1/sessions/${sessionId}/votes`, {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getVotingProgressByRoomCode(
  roomCode: string
): Promise<VotingProgressResponse> {
  const code = encodeURIComponent(roomCode.trim());
  return request<VotingProgressResponse>(
    `/api/v1/sessions/room/${code}/votes/progress`,
    {
      method: "GET",
    }
  );
}
