export interface MovieDto {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseYear: number | null;
  voteAverage: number;
}

export interface MovieSearchResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  movies: MovieDto[];
}

export interface MovieSubmissionDto {
  tmdbId: number;
  title: string;
  overview?: string | null;
  posterPath?: string | null;
  releaseYear?: number | null;
}

export interface SubmitMoviesRequest {
  userId: number;
  movies: MovieSubmissionDto[];
}

export interface MovieSuggestionResponse {
  id: number;
  tmdbId: number;
  userId: number;
  userDisplayName: string;
  title: string;
  overview: string | null;
  posterPath: string | null;
  releaseYear: number | null;
  suggestedAt: string;
}
