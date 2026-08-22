import { MovieDto } from "./movie";

export interface AiChatMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface AiRecommendationRequest {
  prompt: string;
  conversationHistory?: AiChatMessage[];
  excludedTmdbIds?: number[];
  page?: number;
  limit?: number;
}

export interface AiRecommendationResponse {
  prompt: string;
  replyMessage: string;
  movies: MovieDto[];
  page: number;
  pageSize: number;
  totalResults: number;
  hasMore: boolean;
  modelUsed?: string;
  cached?: boolean;
}
