export type SessionStatus = "WAITING" | "SUGGESTING" | "VOTING" | "COMPLETED";

export interface UserResponse {
  id: number;
  displayName: string;
  isHost?: boolean;
  joinedAt: string;
}

export interface SessionResponse {
  id: number;
  roomCode: string;
  hostName: string;
  status: SessionStatus;
  maxUsers: number;
  maxSuggestionsPerUser: number;
  users: UserResponse[];
  createdAt: string;
}

export interface CreateSessionRequest {
  hostName: string;
  maxUsers?: number;
  maxSuggestionsPerUser?: number;
}

export interface JoinSessionRequest {
  roomCode: string;
  displayName: string;
}

export interface LeaveSessionRequest {
  userId: number;
}

export interface LeaveSessionResponse {
  message: string;
  newHostName: string | null;
  sessionClosed: boolean;
}

export interface UpdateSessionStatusRequest {
  status: SessionStatus;
}
