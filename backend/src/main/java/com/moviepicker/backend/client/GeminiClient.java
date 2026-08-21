package com.moviepicker.backend.client;

public interface GeminiClient {
    /**
     * Sends a simple text prompt to Gemini to verify connectivity and API key validity.
     *
     * @param prompt Text prompt (e.g. "How are you?")
     * @return Generated text response from Gemini
     */
    String testPing(String prompt);
}
