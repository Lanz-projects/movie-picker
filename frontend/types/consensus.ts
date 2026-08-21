export interface ScoredMovieDto {
  movieSuggestionId: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  overview: string | null;
  releaseYear?: number | null;
  suggestedBy?: string | null;
  nominators?: string[];
  score: number;
  yesVotes: number;
  superlikeVotes: number;
  noVotes: number;
  skipVotes: number;
  matchPercentage: number;
  isUnanimous: boolean;
  positiveVoters?: string[];
  superlikers?: string[];
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
