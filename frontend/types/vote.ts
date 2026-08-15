export type VoteType = "LIKE" | "PASS" | "SUPERLIKE";

export type RoomEventType = "VOTE_CAST" | "USER_COMPLETED" | "ALL_VOTING_COMPLETED";

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

export interface ScoredMovieDto {
  movieSuggestionId: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  overview: string;
  releaseYear?: number | null;
  score: number;
  yesVotes: number;
  superlikeVotes: number;
  noVotes: number;
  skipVotes: number;
  matchPercentage: number;
  isUnanimous: boolean;
}

export interface SessionResultsResponse {
  sessionId: number;
  roomCode: string;
  totalParticipants: number;
  totalMovies: number;
  winner: ScoredMovieDto | null;
  rankedMovies: ScoredMovieDto[];
  calculatedAt?: string;
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
  userId: number;
  userDisplayName: string;
  movieSuggestionId: number;
  tmdbId: number;
  movieTitle: string;
  voteType: VoteType;
  progress: VotingProgressResponse;
}
