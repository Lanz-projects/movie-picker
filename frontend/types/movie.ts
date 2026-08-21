export interface StreamingProviderDto {
  providerId: number;
  providerName: string;
  logoPath: string | null;
  type: string; // "Stream", "Rent", "Buy"
}

export interface MovieDetailsDto {
  tmdbId: number;
  title: string;
  tagline?: string | null;
  overview: string;
  posterPath: string | null;
  backdropPath?: string | null;
  releaseYear: number | null;
  releaseDate?: string | null;
  runtime?: number | null;
  formattedRuntime?: string | null;
  contentRating?: string | null;
  voteAverage: number;
  voteCount?: number;
  popularity?: number;
  originalLanguage?: string;
  genres: string[];
  directors: string[];
  topCast: string[];
  streamingProviders: StreamingProviderDto[];
  tmdbUrl?: string | null;
}

export interface MovieDto {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath?: string | null;
  releaseYear: number | null;
  releaseDate?: string | null;
  voteAverage: number;
  voteCount?: number;
  popularity?: number;
  originalLanguage?: string;
  genres?: string[];
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
  backdropPath?: string | null;
  releaseYear?: number | null;
  releaseDate?: string | null;
  voteAverage?: number;
  voteCount?: number;
  genres?: string[];
  originalLanguage?: string;
}

export interface SubmitMoviesRequest {
  userId: number;
  movies: MovieSubmissionDto[];
}

export interface MovieSuggestionResponse {
  id: number;
  tmdbId: number;
  userId?: number | null;
  userDisplayName?: string | null;
  nominators?: string[];
  title: string;
  overview: string | null;
  posterPath: string | null;
  releaseYear: number | null;
  suggestedAt: string;
}
