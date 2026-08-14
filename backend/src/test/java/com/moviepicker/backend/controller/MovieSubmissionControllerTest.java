package com.moviepicker.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviepicker.backend.dto.MovieSubmissionDto;
import com.moviepicker.backend.dto.MovieSuggestionResponse;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.SubmitMoviesRequest;
import com.moviepicker.backend.exception.EmptyMoviePoolException;
import com.moviepicker.backend.exception.GlobalExceptionHandler;
import com.moviepicker.backend.exception.MovieSuggestionLimitExceededException;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.service.MovieSubmissionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MovieSubmissionController.class)
@Import(GlobalExceptionHandler.class)
public class MovieSubmissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private MovieSubmissionService movieSubmissionService;

    @Test
    public void testSubmitMovies_Success() throws Exception {
        MovieSubmissionDto movieDto = MovieSubmissionDto.builder()
                .tmdbId(550L)
                .title("Fight Club")
                .releaseYear(1999)
                .build();

        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(10L)
                .movies(List.of(movieDto))
                .build();

        MovieSuggestionResponse suggestionResponse = MovieSuggestionResponse.builder()
                .id(100L)
                .tmdbId(550L)
                .userId(10L)
                .userDisplayName("Alice")
                .title("Fight Club")
                .releaseYear(1999)
                .suggestedAt(LocalDateTime.now())
                .build();

        when(movieSubmissionService.submitMovies(eq(1L), any(SubmitMoviesRequest.class)))
                .thenReturn(List.of(suggestionResponse));

        mockMvc.perform(post("/api/sessions/1/movies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].tmdbId").value(550))
                .andExpect(jsonPath("$[0].title").value("Fight Club"))
                .andExpect(jsonPath("$[0].userDisplayName").value("Alice"));
    }

    @Test
    public void testSubmitMovies_ExceedsLimitReturnsBadRequest() throws Exception {
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(10L)
                .movies(List.of(MovieSubmissionDto.builder().tmdbId(550L).title("Fight Club").build()))
                .build();

        when(movieSubmissionService.submitMovies(eq(1L), any(SubmitMoviesRequest.class)))
                .thenThrow(new MovieSuggestionLimitExceededException("Quota exceeded"));

        mockMvc.perform(post("/api/sessions/1/movies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Quota exceeded"));
    }

    @Test
    public void testGetSessionMovies_Success() throws Exception {
        MovieSuggestionResponse suggestionResponse = MovieSuggestionResponse.builder()
                .id(100L)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        when(movieSubmissionService.getSessionMovies(1L)).thenReturn(List.of(suggestionResponse));

        mockMvc.perform(get("/api/sessions/1/movies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].title").value("Fight Club"));
    }

    @Test
    public void testStartVoting_Success() throws Exception {
        SessionResponse sessionResponse = SessionResponse.builder()
                .id(1L)
                .roomCode("SUBMIT")
                .hostName("Alice")
                .status(SessionStatus.VOTING)
                .build();

        when(movieSubmissionService.startVoting(1L)).thenReturn(sessionResponse);

        mockMvc.perform(post("/api/sessions/1/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("VOTING"));
    }

    @Test
    public void testStartVoting_EmptyPoolReturnsBadRequest() throws Exception {
        when(movieSubmissionService.startVoting(1L))
                .thenThrow(new EmptyMoviePoolException("Cannot start voting with zero submitted movies"));

        mockMvc.perform(post("/api/sessions/1/start"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot start voting with zero submitted movies"));
    }
}
