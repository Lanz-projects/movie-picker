package com.moviepicker.backend.service;

import com.moviepicker.backend.client.GeminiClient;
import com.moviepicker.backend.config.GeminiProperties;
import com.moviepicker.backend.dto.MovieDto;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.dto.ai.AiMovieSuggestion;
import com.moviepicker.backend.dto.ai.AiRawGeminiResult;
import com.moviepicker.backend.dto.ai.AiRecommendationRequest;
import com.moviepicker.backend.dto.ai.AiRecommendationResponse;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AiRecommendationServiceTest {

    @Mock
    private GeminiClient geminiClient;

    @Mock
    private MovieSearchService movieSearchService;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private MovieSuggestionRepository movieSuggestionRepository;

    @Mock
    private GeminiProperties geminiProperties;

    @InjectMocks
    private AiRecommendationServiceImpl aiRecommendationService;

    private Session testSession;

    @BeforeEach
    public void setUp() {
        aiRecommendationService.clearCache();
        testSession = Session.builder()
                .id(100L)
                .roomCode("VIBE12")
                .build();
    }

    @Test
    public void testGetRecommendations_WithRoomCode_SuccessEnrichmentAndPagination() {
        when(sessionRepository.findByRoomCode("VIBE12")).thenReturn(Optional.of(testSession));
        when(geminiProperties.getModel()).thenReturn("gemini-2.5-flash-lite");

        MovieSuggestion existingMovie = MovieSuggestion.builder()
                .id(1L)
                .tmdbId(999L)
                .title("The Matrix")
                .build();
        when(movieSuggestionRepository.findBySessionId(100L)).thenReturn(List.of(existingMovie));

        AiRawGeminiResult geminiResult = AiRawGeminiResult.builder()
                .replyMessage("Here are some great sci-fi movies:")
                .suggestions(List.of(
                        AiMovieSuggestion.builder().title("Dark City").year(1998).vibeMatch("Dark dystopian neo-noir.").build(),
                        AiMovieSuggestion.builder().title("Inception").year(2010).vibeMatch("Mind-bending dream layers.").build()
                ))
                .build();

        when(geminiClient.generateRecommendations(
                eq("90s sci fi"),
                any(),
                eq(Set.of("The Matrix")),
                anyInt()
        )).thenReturn(geminiResult);

        MovieDto tmdbDarkCity = MovieDto.builder()
                .tmdbId(268L)
                .title("Dark City")
                .releaseYear(1998)
                .overview("A man struggles with memories...")
                .posterPath("/darkcity.jpg")
                .voteAverage(7.6)
                .build();

        MovieDto tmdbInception = MovieDto.builder()
                .tmdbId(27205L)
                .title("Inception")
                .releaseYear(2010)
                .overview("A thief who steals corporate secrets...")
                .posterPath("/inception.jpg")
                .voteAverage(8.4)
                .build();

        when(movieSearchService.searchMovies(eq("Dark City"), eq(1)))
                .thenReturn(MovieSearchResponse.builder().movies(List.of(tmdbDarkCity)).build());
        when(movieSearchService.searchMovies(eq("Inception"), eq(1)))
                .thenReturn(MovieSearchResponse.builder().movies(List.of(tmdbInception)).build());

        AiRecommendationRequest requestPage1 = AiRecommendationRequest.builder()
                .prompt("90s sci fi")
                .page(1)
                .limit(1)
                .build();

        AiRecommendationResponse response1 = aiRecommendationService.getRecommendations("VIBE12", requestPage1);

        assertThat(response1).isNotNull();
        assertThat(response1.getReplyMessage()).isEqualTo("Here are some great sci-fi movies:");
        assertThat(response1.getMovies()).hasSize(1);
        assertThat(response1.getTotalResults()).isEqualTo(2);
        assertThat(response1.isHasMore()).isTrue();
        assertThat(response1.isCached()).isFalse();

        MovieDto first = response1.getMovies().get(0);
        assertThat(first.getTitle()).isEqualTo("Dark City");
        assertThat(first.getTmdbId()).isEqualTo(268L);
        assertThat(first.getAiReasoning()).isEqualTo("Dark dystopian neo-noir.");

        // Request Page 2 (should hit cache, no extra Gemini call)
        AiRecommendationRequest requestPage2 = AiRecommendationRequest.builder()
                .prompt("90s sci fi")
                .page(2)
                .limit(1)
                .build();

        AiRecommendationResponse response2 = aiRecommendationService.getRecommendations("VIBE12", requestPage2);

        assertThat(response2).isNotNull();
        assertThat(response2.getMovies()).hasSize(1);
        assertThat(response2.getTotalResults()).isEqualTo(2);
        assertThat(response2.isHasMore()).isFalse();
        assertThat(response2.isCached()).isTrue();

        MovieDto second = response2.getMovies().get(0);
        assertThat(second.getTitle()).isEqualTo("Inception");
        assertThat(second.getTmdbId()).isEqualTo(27205L);

        // Verify Gemini client was only called ONCE thanks to caching
        verify(geminiClient, times(1)).generateRecommendations(anyString(), any(), any(), anyInt());
    }

    @Test
    public void testGetRecommendations_OffTopicPrompt_ReturnsEmptyMoviesWithPoliteReply() {
        when(geminiProperties.getModel()).thenReturn("gemini-2.5-flash-lite");

        AiRawGeminiResult geminiResult = AiRawGeminiResult.builder()
                .replyMessage("I am a movie recommender. I cannot solve math problems.")
                .suggestions(List.of())
                .build();

        when(geminiClient.generateRecommendations(
                eq("Solve 2+2"),
                any(),
                any(),
                anyInt()
        )).thenReturn(geminiResult);

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("Solve 2+2")
                .build();

        AiRecommendationResponse response = aiRecommendationService.getRecommendations(request);

        assertThat(response).isNotNull();
        assertThat(response.getReplyMessage()).contains("I am a movie recommender");
        assertThat(response.getMovies()).isEmpty();
        assertThat(response.getTotalResults()).isEqualTo(0);
        assertThat(response.isHasMore()).isFalse();
    }

    @Test
    public void testGetRecommendations_SessionNotFound_ThrowsResourceNotFoundException() {
        when(sessionRepository.findByRoomCode("BADCODE")).thenReturn(Optional.empty());

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("any prompt")
                .build();

        assertThatThrownBy(() -> aiRecommendationService.getRecommendations("BADCODE", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Session not found");
    }

    @Test
    public void testGetRecommendations_BlankPrompt_ReturnsHelpfulMessage() {
        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("   ")
                .build();

        AiRecommendationResponse response = aiRecommendationService.getRecommendations(request);

        assertThat(response).isNotNull();
        assertThat(response.getReplyMessage()).contains("Please provide a mood, genre, or vibe");
        assertThat(response.getMovies()).isEmpty();
        assertThat(response.getTotalResults()).isEqualTo(0);
    }

    @Test
    public void testGetRecommendations_TmdbSearchEmpty_ReturnsFallbackDtoWithVibeMatch() {
        when(geminiProperties.getModel()).thenReturn("gemini-2.5-flash-lite");

        AiRawGeminiResult geminiResult = AiRawGeminiResult.builder()
                .replyMessage("Here is an obscure indie gem:")
                .suggestions(List.of(
                        AiMovieSuggestion.builder().title("Obscure Underground Film").year(1995).vibeMatch("Ultra rare indie film.").build()
                ))
                .build();

        when(geminiClient.generateRecommendations(anyString(), any(), any(), anyInt()))
                .thenReturn(geminiResult);

        when(movieSearchService.searchMovies("Obscure Underground Film", 1))
                .thenReturn(MovieSearchResponse.builder().movies(List.of()).build());

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("obscure film")
                .limit(1)
                .build();

        AiRecommendationResponse response = aiRecommendationService.getRecommendations(request);

        assertThat(response).isNotNull();
        assertThat(response.getMovies()).hasSize(1);
        MovieDto fallback = response.getMovies().get(0);
        assertThat(fallback.getTitle()).isEqualTo("Obscure Underground Film");
        assertThat(fallback.getReleaseYear()).isEqualTo(1995);
        assertThat(fallback.getAiReasoning()).isEqualTo("Ultra rare indie film.");
    }

    @Test
    public void testGetRecommendations_GeminiFails_ReturnsGracefulNotice() {
        when(geminiProperties.getModel()).thenReturn("gemini-2.5-flash-lite");

        when(geminiClient.generateRecommendations(anyString(), any(), any(), anyInt()))
                .thenThrow(new RuntimeException("Resource exhausted (quota limit)"));

        AiRecommendationRequest request = AiRecommendationRequest.builder()
                .prompt("popular movies")
                .build();

        AiRecommendationResponse response = aiRecommendationService.getRecommendations(request);

        assertThat(response).isNotNull();
        assertThat(response.getReplyMessage()).contains("AI Concierge is currently experiencing high demand");
        assertThat(response.getMovies()).isEmpty();
        assertThat(response.getTotalResults()).isEqualTo(0);
    }
}
