package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.ai.AiRecommendationRequest;
import com.moviepicker.backend.dto.ai.AiRecommendationResponse;

public interface AiRecommendationService {

    /**
     * Generates vibe-based movie recommendations enriched with TMDB metadata,
     * considering existing room movie nominations and exclusions.
     *
     * @param roomCode The session room code
     * @param request AI recommendation request details
     * @return Enriched recommendations with AI reasoning and movie metadata
     */
    AiRecommendationResponse getRecommendations(String roomCode, AiRecommendationRequest request);

    /**
     * Generates vibe-based movie recommendations enriched with TMDB metadata without room context.
     *
     * @param request AI recommendation request details
     * @return Enriched recommendations with AI reasoning and movie metadata
     */
    AiRecommendationResponse getRecommendations(AiRecommendationRequest request);
}
