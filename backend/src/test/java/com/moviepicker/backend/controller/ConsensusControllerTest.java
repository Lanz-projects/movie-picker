package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.ScoredMovieDto;
import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.exception.GlobalExceptionHandler;
import com.moviepicker.backend.service.ConsensusService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConsensusController.class)
@Import(GlobalExceptionHandler.class)
public class ConsensusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ConsensusService consensusService;

    @MockitoBean
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Test
    public void testCalculateResults_Returns200OK() throws Exception {
        ScoredMovieDto winner = ScoredMovieDto.builder()
                .movieSuggestionId(100L)
                .tmdbId(550L)
                .title("Fight Club")
                .suggestedBy("Alice")
                .positiveVoters(List.of("Alice", "Bob"))
                .score(3)
                .yesVotes(1)
                .superlikeVotes(1)
                .matchPercentage(100.0)
                .isUnanimous(true)
                .build();

        SessionResultsResponse response = SessionResultsResponse.builder()
                .sessionId(1L)
                .roomCode("WINNER")
                .totalParticipants(2)
                .totalMovies(1)
                .winner(winner)
                .rankedMovies(List.of(winner))
                .calculatedAt(LocalDateTime.now())
                .build();

        when(consensusService.calculateResults(1L)).thenReturn(response);

        mockMvc.perform(post("/api/sessions/1/calculate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("WINNER"))
                .andExpect(jsonPath("$.winner.title").value("Fight Club"))
                .andExpect(jsonPath("$.winner.suggestedBy").value("Alice"))
                .andExpect(jsonPath("$.winner.positiveVoters[0]").value("Alice"))
                .andExpect(jsonPath("$.winner.isUnanimous").value(true));
    }

    @Test
    public void testGetResults_Returns200OK() throws Exception {
        ScoredMovieDto winner = ScoredMovieDto.builder()
                .movieSuggestionId(100L)
                .tmdbId(550L)
                .title("Fight Club")
                .score(3)
                .matchPercentage(100.0)
                .build();

        SessionResultsResponse response = SessionResultsResponse.builder()
                .sessionId(1L)
                .roomCode("WINNER")
                .totalParticipants(2)
                .totalMovies(1)
                .winner(winner)
                .rankedMovies(List.of(winner))
                .calculatedAt(LocalDateTime.now())
                .build();

        when(consensusService.getResults(1L)).thenReturn(response);

        mockMvc.perform(get("/api/sessions/1/results"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("WINNER"))
                .andExpect(jsonPath("$.winner.title").value("Fight Club"));
    }
}
