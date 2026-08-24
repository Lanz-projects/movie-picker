package com.moviepicker.backend.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviepicker.backend.config.GeminiProperties;
import com.moviepicker.backend.dto.ai.AiChatMessage;
import com.moviepicker.backend.dto.ai.AiMovieSuggestion;
import com.moviepicker.backend.dto.ai.AiRawGeminiResult;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Slf4j
@Component
public class GeminiClientImpl implements GeminiClient {

    private static final String DEFAULT_SYSTEM_INSTRUCTION = """
            You are MoviePicker AI Concierge, a knowledgeable and witty film curator for group movie nights.
            Your sole purpose is to curate real, authentic movie recommendations that match the user's requested mood, genre, or vibe.
            
            RULES:
            1. Recommend ONLY real, commercially released movies that genuinely exist.
            2. Provide a concise, engaging 1-sentence 'vibeMatch' explaining why each movie fits the requested vibe.
            3. STRICT GUARDRAIL: Never generate programming code, answer general homework/trivia, or fulfill off-topic requests. If the user asks for something unrelated to movies, provide a polite movie-themed redirect in 'replyMessage' and return an empty 'suggestions' array.
            """;

    private static final Map<String, Object> GEMINI_SCHEMA = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                    "replyMessage", Map.of("type", "STRING", "description", "Conversational intro addressing the user's request"),
                    "suggestions", Map.of(
                            "type", "ARRAY",
                            "description", "List of curated real movie suggestions",
                            "items", Map.of(
                                    "type", "OBJECT",
                                    "properties", Map.of(
                                            "title", Map.of("type", "STRING", "description", "Exact official title of the movie"),
                                            "year", Map.of("type", "INTEGER", "description", "Release year (4 digits)"),
                                            "vibeMatch", Map.of("type", "STRING", "description", "1-sentence justification of why this fits the vibe")
                                    ),
                                    "required", List.of("title", "year", "vibeMatch")
                            )
                    )
            ),
            "required", List.of("replyMessage", "suggestions")
    );

    private final GeminiProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;
    private String loadedSystemInstruction;

    @Autowired
    public GeminiClientImpl(GeminiProperties properties) {
        this(properties, (RestClient) null, new ObjectMapper(), new DefaultResourceLoader());
    }

    public GeminiClientImpl(GeminiProperties properties, RestClient.Builder restClientBuilder) {
        this(properties, restClientBuilder != null ? restClientBuilder.baseUrl(properties.getBaseUrl()).build() : null, new ObjectMapper(), new DefaultResourceLoader());
    }

    public GeminiClientImpl(GeminiProperties properties, RestClient restClient, ObjectMapper objectMapper) {
        this(properties, restClient, objectMapper, new DefaultResourceLoader());
    }

    public GeminiClientImpl(GeminiProperties properties, RestClient restClient, ObjectMapper objectMapper, ResourceLoader resourceLoader) {
        this.properties = properties;
        if (restClient != null) {
            this.restClient = restClient;
        } else {
            org.springframework.http.client.JdkClientHttpRequestFactory requestFactory = new org.springframework.http.client.JdkClientHttpRequestFactory();
            int timeoutSec = (properties != null && properties.getTimeoutSeconds() > 0) ? properties.getTimeoutSeconds() : 90;
            requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSec));

            this.restClient = RestClient.builder()
                    .baseUrl(properties.getBaseUrl())
                    .requestFactory(requestFactory)
                    .build();
        }
        this.objectMapper = (objectMapper != null) ? objectMapper : new ObjectMapper();
        this.resourceLoader = (resourceLoader != null) ? resourceLoader : new DefaultResourceLoader();
        this.loadedSystemInstruction = loadSystemInstructionPrompt();
    }

    @Override
    @CircuitBreaker(name = "geminiApi", fallbackMethod = "generateRecommendationsFallback")
    @Retry(name = "geminiApi")
    public AiRawGeminiResult generateRecommendations(String prompt, List<AiChatMessage> history, Set<String> excludedTitles, int limit) {
        validateApiKey();

        int targetLimit = (limit > 0 && limit <= 10) ? limit : 4;
        String model = StringUtils.hasText(properties.getModel()) ? properties.getModel() : "gemini-3.5-flash-lite";
        String endpoint = String.format("/models/%s:generateContent?key=%s", model, properties.getKey().trim());

        Map<String, Object> requestBody = buildRecommendationPayload(prompt, history, excludedTitles, targetLimit);

        try {
            log.debug("Sending structured recommendation request to Gemini API (model={})", model);
            String rawJson = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return parseStructuredResponse(rawJson);
        } catch (RestClientResponseException ex) {
            log.error("Gemini API HTTP error (status={}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException("Gemini API Error: " + ex.getStatusCode() + " " + ex.getStatusText(), ex);
        } catch (Exception ex) {
            log.error("Failed to generate AI recommendations from Gemini", ex);
            throw new RuntimeException("Failed to generate AI recommendations: " + ex.getMessage(), ex);
        }
    }

    public AiRawGeminiResult generateRecommendationsFallback(String prompt, List<AiChatMessage> history, Set<String> excludedTitles, int limit, Throwable ex) {
        log.warn("Gemini API circuit breaker/retry fallback triggered for prompt='{}'. Reason: {}", prompt, ex != null ? ex.getMessage() : "Unknown");
        return AiRawGeminiResult.builder()
                .replyMessage("The AI Concierge is momentarily unavailable. Please explore our trending movies or try again in a moment.")
                .suggestions(Collections.emptyList())
                .build();
    }

    @Override
    @CircuitBreaker(name = "geminiApi", fallbackMethod = "testPingFallback")
    @Retry(name = "geminiApi")
    public String testPing(String prompt) {
        validateApiKey();

        String model = StringUtils.hasText(properties.getModel()) ? properties.getModel() : "gemini-3.5-flash-lite";
        String endpoint = String.format("/models/%s:generateContent?key=%s", model, properties.getKey().trim());

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        try {
            String rawJson = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawJson);
            return root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText("No response from Gemini");
        } catch (RestClientResponseException ex) {
            log.error("Gemini API ping error (status={}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException("Gemini API Error: " + ex.getStatusCode() + ": " + ex.getResponseBodyAsString(), ex);
        } catch (Exception ex) {
            log.error("Failed to ping Gemini API", ex);
            throw new RuntimeException("Failed to ping Gemini API: " + ex.getMessage(), ex);
        }
    }

    public String testPingFallback(String prompt, Throwable ex) {
        log.warn("Gemini API ping fallback triggered. Reason: {}", ex != null ? ex.getMessage() : "Unknown");
        return "Gemini API is temporarily unavailable (fallback active).";
    }

    private void validateApiKey() {
        if (!StringUtils.hasText(properties.getKey())) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured in backend environment");
        }
    }

    private String loadSystemInstructionPrompt() {
        String path = properties.getSystemInstructionPath();
        if (StringUtils.hasText(path)) {
            try {
                Resource resource = resourceLoader.getResource(path);
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        String content = new String(is.readAllBytes(), StandardCharsets.UTF_8).trim();
                        if (StringUtils.hasText(content)) {
                            log.debug("Loaded Gemini system instruction from {}", path);
                            return content;
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not load prompt template from {}. Falling back to default instruction.", path, ex);
            }
        }
        return DEFAULT_SYSTEM_INSTRUCTION.trim();
    }

    private Map<String, Object> buildRecommendationPayload(String prompt, List<AiChatMessage> history, Set<String> excludedTitles, int limit) {
        List<Map<String, Object>> contents = new ArrayList<>();

        if (history != null) {
            for (AiChatMessage msg : history) {
                if (msg != null && StringUtils.hasText(msg.getContent())) {
                    String role = "user".equalsIgnoreCase(msg.getRole()) ? "user" : "model";
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", msg.getContent().trim()))
                    ));
                }
            }
        }

        StringBuilder finalPrompt = new StringBuilder(prompt.trim());
        finalPrompt.append(String.format("\n[Instruction: If this is a movie recommendation request, recommend up to %d movies.", limit));
        if (excludedTitles != null && !excludedTitles.isEmpty()) {
            finalPrompt.append(" Do NOT suggest any of these titles: ").append(String.join(", ", excludedTitles)).append(".");
        }
        finalPrompt.append(" If this request is unrelated to movies or cinema, return an empty suggestions array.]");

        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", finalPrompt.toString()))
        ));

        double temp = (properties.getTemperature() != null) ? properties.getTemperature() : 0.7;
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", GEMINI_SCHEMA);
        generationConfig.put("temperature", temp);
        generationConfig.put("maxOutputTokens", 1024);

        Map<String, Object> systemInstructionPayload = Map.of(
                "parts", List.of(Map.of("text", loadedSystemInstruction))
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("system_instruction", systemInstructionPayload);
        payload.put("contents", contents);
        payload.put("generationConfig", generationConfig);

        return payload;
    }

    private AiRawGeminiResult parseStructuredResponse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            String jsonText = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText("")
                    .trim();

            if (!StringUtils.hasText(jsonText)) {
                log.warn("Gemini returned empty text content in candidate part");
                return AiRawGeminiResult.builder()
                        .replyMessage("I couldn't find movies matching that vibe. Try another prompt!")
                        .suggestions(Collections.emptyList())
                        .build();
            }

            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            } else if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();

            JsonNode parsedResult = objectMapper.readTree(jsonText);
            String replyMessage = parsedResult.path("replyMessage").asText("Here are some movies you might like:");

            List<AiMovieSuggestion> suggestions = new ArrayList<>();
            JsonNode suggestionsNode = parsedResult.path("suggestions");
            if (suggestionsNode.isArray()) {
                for (JsonNode item : suggestionsNode) {
                    String title = item.path("title").asText("").trim();
                    int year = item.path("year").asInt(0);
                    String vibeMatch = item.path("vibeMatch").asText("").trim();

                    if (StringUtils.hasText(title)) {
                        suggestions.add(AiMovieSuggestion.builder()
                                .title(title)
                                .year(year > 1800 ? year : null)
                                .vibeMatch(vibeMatch)
                                .build());
                    }
                }
            }

            return AiRawGeminiResult.builder()
                    .replyMessage(replyMessage)
                    .suggestions(suggestions)
                    .build();
        } catch (Exception ex) {
            log.error("Failed to parse Gemini structured JSON response: {}", rawJson, ex);
            throw new RuntimeException("Failed to parse Gemini structured response", ex);
        }
    }
}
