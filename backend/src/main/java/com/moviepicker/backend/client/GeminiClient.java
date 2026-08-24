package com.moviepicker.backend.client;

import com.moviepicker.backend.dto.ai.AiChatMessage;
import com.moviepicker.backend.dto.ai.AiRawGeminiResult;

import java.util.List;
import java.util.Set;

public interface GeminiClient {

    /**
     * Generates structured movie recommendations with release years and vibe justifications.
     *
     * @param prompt User's natural language vibe or request
     * @param history Optional list of previous chat turns
     * @param excludedTitles Set of movie titles to exclude (e.g. already nominated)
     * @param limit Target number of movie suggestions
     * @return Structured result containing conversational reply and movie suggestions
     */
    AiRawGeminiResult generateRecommendations(String prompt, List<AiChatMessage> history, Set<String> excludedTitles, int limit);

    /**
     * Sends a simple text prompt to Gemini to verify connectivity and API key validity.
     *
     * @param prompt Text prompt
     * @return Generated text response from Gemini
     */
    String testPing(String prompt);
}
