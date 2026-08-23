package com.moviepicker.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviepicker.backend.dto.MovieDto;
import com.moviepicker.backend.dto.ai.AiChatMessage;
import com.moviepicker.backend.dto.ai.AiRecommendationRequest;
import com.moviepicker.backend.dto.ai.AiRecommendationResponse;
import com.moviepicker.backend.exception.GlobalExceptionHandler;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.exception.UnauthorizedException;
import com.moviepicker.backend.security.auth.SessionSecurityService;
import com.moviepicker.backend.service.AiRecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiRecommendationController.class)
@Import(GlobalExceptionHandler.class)
public class AiRecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AiRecommendationService aiRecommendationService;

    @MockitoBean
    private SessionSecurityService sessionSecurityService;

    @Test
    public void testGetRoomRecommendations_Success() throws Exception {
        MovieDto movie = MovieDto.builder()
                .tmdbId(603L)
                .title("The Matrix")
                .releaseYear(1999)
                .overview("A computer hacker learns about reality...")
                .posterPath("/matrix.jpg")
                .aiReasoning("Groundbreaking cyberpunk classic questioning reality.")
                .build();

        AiRecommendationResponse mockResponse = AiRecommendationResponse.builder()
                .prompt("90s mind bending sci-fi")
                .replyMessage("Here are some iconic 90s picks:")
                .movies(List.of(movie))
                .page(1)
                .pageSize(5)
                .totalResults(8)
                .hasMore(true)
                .modelUsed("gemini-3.5-flash-lite")
                .cached(false)
                .build();

        when(aiRecommendationService.getRecommendations(eq("ROOM12"), any(AiRecommendationRequest.class)))
                .thenReturn(mockResponse);

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("90s mind bending sci-fi")
                .page(1)
                .limit(5)
                .conversationHistory(List.of(AiChatMessage.builder().role("user").content("cyberpunk vibe").build()))
                .excludedTmdbIds(Set.of(550L))
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prompt").value("90s mind bending sci-fi"))
                .andExpect(jsonPath("$.replyMessage").value("Here are some iconic 90s picks:"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(5))
                .andExpect(jsonPath("$.totalResults").value(8))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andExpect(jsonPath("$.movies[0].title").value("The Matrix"))
                .andExpect(jsonPath("$.movies[0].aiReasoning").value("Groundbreaking cyberpunk classic questioning reality."));
    }

    @Test
    public void testGetRoomRecommendations_WithValidSessionToken_ValidatesCaller() throws Exception {
        AiRecommendationResponse mockResponse = AiRecommendationResponse.builder()
                .prompt("comedy")
                .replyMessage("Here are comedies:")
                .movies(List.of())
                .page(1)
                .pageSize(5)
                .totalResults(0)
                .hasMore(false)
                .build();

        when(aiRecommendationService.getRecommendations(eq("ROOM12"), any(AiRecommendationRequest.class)))
                .thenReturn(mockResponse);

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("comedy")
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .header("X-Session-Token", "valid-token-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(sessionSecurityService).validateUserToken("ROOM12", null, "valid-token-123");
    }

    @Test
    public void testGetRoomRecommendations_WithInvalidSessionToken_ReturnsUnauthorized() throws Exception {
        when(sessionSecurityService.validateUserToken(eq("ROOM12"), any(), eq("bad-token")))
                .thenThrow(new UnauthorizedException("Invalid session authentication token"));

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("comedy")
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .header("X-Session-Token", "bad-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testGetRoomRecommendations_BlankPromptReturnsBadRequest() throws Exception {
        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("   ")
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testGetRoomRecommendations_InvalidPageOrLimitReturnsBadRequest() throws Exception {
        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("valid prompt")
                .page(0)
                .limit(20) // max is 10
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testGetStandaloneRecommendations_Success() throws Exception {
        AiRecommendationResponse mockResponse = AiRecommendationResponse.builder()
                .prompt("comfort movies")
                .replyMessage("Cozy films:")
                .movies(List.of())
                .page(1)
                .pageSize(5)
                .totalResults(0)
                .hasMore(false)
                .build();

        when(aiRecommendationService.getRecommendations(any(AiRecommendationRequest.class)))
                .thenReturn(mockResponse);

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("comfort movies")
                .build();

        mockMvc.perform(post("/api/v1/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prompt").value("comfort movies"));
    }

    @Test
    public void testGetRoomRecommendations_SessionNotFound_Returns404NotFound() throws Exception {
        when(aiRecommendationService.getRecommendations(eq("NONEXIST"), any(AiRecommendationRequest.class)))
                .thenThrow(new ResourceNotFoundException("Session not found with room code: NONEXIST"));

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("thriller")
                .build();

        mockMvc.perform(post("/api/v1/sessions/NONEXIST/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testGetRoomRecommendations_WithModelAndAssistantRoles_Success() throws Exception {
        AiRecommendationResponse mockResponse = AiRecommendationResponse.builder()
                .prompt("sci fi")
                .replyMessage("Here are picks:")
                .movies(List.of())
                .page(1)
                .pageSize(5)
                .totalResults(0)
                .hasMore(false)
                .build();

        when(aiRecommendationService.getRecommendations(eq("ROOM12"), any(AiRecommendationRequest.class)))
                .thenReturn(mockResponse);

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("sci fi")
                .conversationHistory(List.of(
                        AiChatMessage.builder().role("user").content("first prompt").build(),
                        AiChatMessage.builder().role("model").content("first reply").build(),
                        AiChatMessage.builder().role("assistant").content("second reply").build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    public void testGetRoomRecommendations_WithInvalidRole_ReturnsBadRequest() throws Exception {
        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("sci fi")
                .conversationHistory(List.of(
                        AiChatMessage.builder().role("invalid_role").content("bad message").build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/sessions/ROOM12/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
