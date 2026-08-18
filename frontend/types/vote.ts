import type { UserResponse, SessionStatus } from "./session";

export type VoteType = "LIKE" | "PASS" | "SUPERLIKE";

export type RoomEventType =
  | "USER_JOINED"
  | "USER_LEFT"
  | "USER_KICKED"
  | "HOST_CHANGED"
  | "STAGE_CHANGED"
  | "DECK_SUBMITTED"
  | "VOTE_CAST"
  | "USER_COMPLETED"
  | "ALL_VOTING_COMPLETED";

export interface CastVoteRequest {
  userId: number;
  movieSuggestionId: number;
  voteType: VoteType;
}

export interface VoteResponse {
  id: number;
  sessionId: number;
  userId: number;
  userDisplayName: string;
  movieSuggestionId: number;
  tmdbId: number;
  movieTitle: string;
  voteType: VoteType;
  votedAt: string;
}

export interface UserVotingProgressDto {
  userId: number;
  displayName: string;
  votedCount: number;
  completed: boolean;
}

export interface VotingProgressResponse {
  sessionId: number;
  roomCode?: string;
  totalMovies: number;
  totalUsers: number;
  completedUserCount: number;
  allUsersCompleted: boolean;
  users: UserVotingProgressDto[];
}

export interface VoteMessageDto {
  roomCode: string;
  userId: number;
  movieSuggestionId: number;
  voteType: VoteType;
}

export interface RoomProgressEvent {
  eventType: RoomEventType;
  roomCode: string;
  userId?: number;
  kickedUserId?: number;
  userDisplayName?: string;
  hostName?: string;
  sessionStatus?: SessionStatus;
  users?: UserResponse[];
  submittedUserCount?: number;
  totalUserCount?: number;
  message?: string;

  movieSuggestionId?: number;
  tmdbId?: number;
  movieTitle?: string;
  voteType?: VoteType;
  progress?: VotingProgressResponse;
}
