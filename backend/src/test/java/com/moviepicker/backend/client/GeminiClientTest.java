package com.moviepicker.backend.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviepicker.backend.config.GeminiProperties;
import com.moviepicker.backend.dto.ai.AiChatMessage;
import com.moviepicker.backend.dto.ai.AiMovieSuggestion;
import com.moviepicker.backend.dto.ai.AiRawGeminiResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

public class GeminiClientTest {

    private GeminiProperties properties;
    private MockRestServiceServer mockServer;
    private GeminiClientImpl geminiClient;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        properties = new GeminiProperties();
        properties.setKey("test-api-key");
        properties.setModel("gemini-2.5-flash-lite");
        properties.setBaseUrl("https://generativelanguage.googleapis.com/v1beta");

        objectMapper = new ObjectMapper();
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        geminiClient = new GeminiClientImpl(properties, builder, objectMapper);
    }

    @Test
    public void testGenerateRecommendations_Success() {
        String innerJson = """
                {
                  "replyMessage": "Here are 2 great 90s sci-fi thrillers:",
                  "suggestions": [
                    {
                      "title": "Dark City",
                      "year": 1998,
                      "vibeMatch": "A stylish noir sci-fi with mind-bending memory manipulation."
                    },
                    {
                      "title": "The Matrix",
                      "year": 1999,
                      "vibeMatch": "Iconic cyberpunk action questioning reality."
                    }
                  ]
                }
                """;

        String outerGeminiResponse = String.format("""
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": %s
                          }
                        ]
                      }
                    }
                  ]
                }
                """, objectMapper.valueToTree(innerJson).toString());

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=test-api-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(outerGeminiResponse, MediaType.APPLICATION_JSON));

        AiRawGeminiResult result = geminiClient.generateRecommendations("90s sci-fi with mind bending twists", null, null, 2);

        assertThat(result).isNotNull();
        assertThat(result.getReplyMessage()).isEqualTo("Here are 2 great 90s sci-fi thrillers:");
        assertThat(result.getSuggestions()).hasSize(2);

        AiMovieSuggestion first = result.getSuggestions().get(0);
        assertThat(first.getTitle()).isEqualTo("Dark City");
        assertThat(first.getYear()).isEqualTo(1998);
        assertThat(first.getVibeMatch()).contains("memory manipulation");

        mockServer.verify();
    }

    @Test
    public void testGenerateRecommendations_WithConversationHistoryAndExclusions() {
        String innerJson = """
                {
                  "replyMessage": "Here is an animated alternative:",
                  "suggestions": [
                    {
                      "title": "Spirited Away",
                      "year": 2001,
                      "vibeMatch": "A breathtaking fantasy adventure with gorgeous hand-drawn animation."
                    }
                  ]
                }
                """;

        String outerGeminiResponse = String.format("""
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": %s
                          }
                        ]
                      }
                    }
                  ]
                }
                """, objectMapper.valueToTree(innerJson).toString());

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=test-api-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(outerGeminiResponse, MediaType.APPLICATION_JSON));

        List<AiChatMessage> history = List.of(
                AiChatMessage.builder().role("user").content("I want cozy vibes").build(),
                AiChatMessage.builder().role("assistant").content("Here are some cozy picks").build()
        );

        AiRawGeminiResult result = geminiClient.generateRecommendations(
                "Make it animated",
                history,
                Set.of("My Neighbor Totoro"),
                1
        );

        assertThat(result).isNotNull();
        assertThat(result.getSuggestions()).hasSize(1);
        assertThat(result.getSuggestions().get(0).getTitle()).isEqualTo("Spirited Away");

        mockServer.verify();
    }

    @Test
    public void testGenerateRecommendations_OffTopicRefusalReturnsEmptySuggestions() {
        String innerJson = """
                {
                  "replyMessage": "I'm your Movie Concierge so I cannot write Python code, but I can recommend great party movies!",
                  "suggestions": []
                }
                """;

        String outerGeminiResponse = String.format("""
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": %s
                          }
                        ]
                      }
                    }
                  ]
                }
                """, objectMapper.valueToTree(innerJson).toString());

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=test-api-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(outerGeminiResponse, MediaType.APPLICATION_JSON));

        AiRawGeminiResult result = geminiClient.generateRecommendations("Write me python code", null, null, 4);

        assertThat(result).isNotNull();
        assertThat(result.getReplyMessage()).contains("cannot write Python code");
        assertThat(result.getSuggestions()).isEmpty();

        mockServer.verify();
    }

    @Test
    public void testGenerateRecommendations_MissingApiKeyThrowsException() {
        properties.setKey("");

        assertThatThrownBy(() -> geminiClient.generateRecommendations("sci-fi", null, null, 4))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GEMINI_API_KEY is not configured");
    }

    @Test
    public void testGenerateRecommendations_WithMarkdownFences() {
        String innerJson = "```json\n" + """
                {
                  "replyMessage": "Here is a movie:",
                  "suggestions": [
                    {
                      "title": "Inception",
                      "year": 2010,
                      "vibeMatch": "Mind-bending dream heist."
                    }
                  ]
                }
                """ + "\n```";

        String outerGeminiResponse = String.format("""
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": %s
                          }
                        ]
                      }
                    }
                  ]
                }
                """, objectMapper.valueToTree(innerJson).toString());

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=test-api-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(outerGeminiResponse, MediaType.APPLICATION_JSON));

        AiRawGeminiResult result = geminiClient.generateRecommendations("mind bending", null, null, 1);
        assertThat(result).isNotNull();
        assertThat(result.getSuggestions()).hasSize(1);
        assertThat(result.getSuggestions().get(0).getTitle()).isEqualTo("Inception");

        mockServer.verify();
    }

    @Test
    public void testPing_Success() {
        String geminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "I am ready to recommend movies!"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        mockServer.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=test-api-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(geminiResponse, MediaType.APPLICATION_JSON));

        String pingResult = geminiClient.testPing("ping");
        assertThat(pingResult).isEqualTo("I am ready to recommend movies!");

        mockServer.verify();
    }
}
