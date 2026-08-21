package com.moviepicker.backend.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviepicker.backend.config.GeminiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiClientImpl implements GeminiClient {

    private final RestClient restClient;
    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;

    @Autowired
    public GeminiClientImpl(RestClient.Builder restClientBuilder, GeminiProperties properties) {
        this(restClientBuilder, properties, new ObjectMapper());
    }

    public GeminiClientImpl(RestClient.Builder restClientBuilder, GeminiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String testPing(String prompt) {
        if (!StringUtils.hasText(properties.getKey())) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured in backend environment");
        }

        String model = StringUtils.hasText(properties.getModel()) ? properties.getModel() : "gemini-3.6-flash";
        String endpoint = String.format("/models/%s:generateContent?key=%s", model, properties.getKey().trim());

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", StringUtils.hasText(prompt) ? prompt : "How are you?")
                        ))
                )
        );

        try {
            String rawJson = restClient.post()
                    .uri(endpoint)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!textNode.isMissingNode()) {
                return textNode.asText().trim();
            }
            return rawJson;
        } catch (Exception e) {
            log.error("Failed to connect to Gemini API: {}", e.getMessage(), e);
            throw new RuntimeException("Gemini API Error: " + e.getMessage(), e);
        }
    }
}
