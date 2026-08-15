import { request } from "./client";
import type {
  SessionResponse,
  CreateSessionRequest,
  JoinSessionRequest,
  LeaveSessionResponse,
  LeaveSessionRequest,
  UpdateSessionStatusRequest,
  SessionStatus,
} from "@/types";

export async function createSession(
  requestData: CreateSessionRequest
): Promise<SessionResponse> {
  return request<SessionResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getSessionByRoomCode(
  roomCode: string
): Promise<SessionResponse> {
  const code = encodeURIComponent(roomCode.trim());
  return request<SessionResponse>(`/api/sessions/${code}`, {
    method: "GET",
  });
}

export async function joinSession(
  requestData: JoinSessionRequest
): Promise<SessionResponse> {
  return request<SessionResponse>("/api/sessions/join", {
    method: "POST",
    body: JSON.stringify({
      roomCode: requestData.roomCode.trim(),
      displayName: requestData.displayName.trim(),
    }),
  });
}

export async function updateSessionStatus(
  roomCode: string,
  status: SessionStatus
): Promise<SessionResponse> {
  const code = encodeURIComponent(roomCode.trim());
  const body: UpdateSessionStatusRequest = { status };
  return request<SessionResponse>(`/api/sessions/${code}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function leaveSessionByRoomCode(
  roomCode: string,
  displayName: string
): Promise<LeaveSessionResponse> {
  const code = encodeURIComponent(roomCode.trim());
  const body: LeaveSessionRequest = { displayName: displayName.trim() };
  return request<LeaveSessionResponse>(`/api/sessions/room/${code}/leave`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
