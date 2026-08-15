export interface MovieDto {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
}

export interface MovieSearchResponse {
  results: MovieDto[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface MovieSubmissionDto {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
}

export interface SubmitMoviesRequest {
  userId: number;
  movies: MovieSubmissionDto[];
}

export interface MovieSuggestionResponse {
  id: number;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  suggestedByUserId: number;
  suggestedByUserDisplayName: string;
}
