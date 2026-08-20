package com.moviepicker.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.UserVotingProgressDto;
import com.moviepicker.backend.dto.VoteResponse;
import com.moviepicker.backend.dto.VotingProgressResponse;
import com.moviepicker.backend.exception.DuplicateVoteException;
import com.moviepicker.backend.exception.GlobalExceptionHandler;
import com.moviepicker.backend.model.VoteType;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.service.ConsensusService;
import com.moviepicker.backend.service.RoomEventPublisher;
import com.moviepicker.backend.service.VoteService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VoteController.class)
@Import(GlobalExceptionHandler.class)
public class VoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private VoteService voteService;

    @MockitoBean
    private ConsensusService consensusService;

    @MockitoBean
    private SessionRepository sessionRepository;

    @MockitoBean
    private RoomEventPublisher roomEventPublisher;

    @Test
    public void testCastVote_Returns201Created() throws Exception {
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.YES)
                .build();

        VoteResponse voteResponse = VoteResponse.builder()
                .id(500L)
                .sessionId(1L)
                .userId(10L)
                .userDisplayName("Alice")
                .movieSuggestionId(100L)
                .movieTitle("Fight Club")
                .voteType(VoteType.YES)
                .votedAt(LocalDateTime.now())
                .build();

        com.moviepicker.backend.model.Session sampleSession = com.moviepicker.backend.model.Session.builder()
                .id(1L)
                .roomCode("SWIPE1")
                .hostName("Alice")
                .status(com.moviepicker.backend.model.SessionStatus.VOTING)
                .build();

        when(voteService.castVoteAndBroadcast(eq(1L), any(CastVoteRequest.class))).thenReturn(voteResponse);

        mockMvc.perform(post("/api/sessions/1/votes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(500))
                .andExpect(jsonPath("$.voteType").value("YES"))
                .andExpect(jsonPath("$.movieTitle").value("Fight Club"))
                .andExpect(jsonPath("$.userDisplayName").value("Alice"));
    }

    @Test
    public void testCastVote_DuplicateVote_Returns409Conflict() throws Exception {
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.YES)
                .build();

        when(voteService.castVoteAndBroadcast(eq(1L), any(CastVoteRequest.class)))
                .thenThrow(new DuplicateVoteException("User has already voted on this movie"));

        mockMvc.perform(post("/api/sessions/1/votes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User has already voted on this movie"));
    }

    @Test
    public void testGetVotingProgress_Returns200OK() throws Exception {
        UserVotingProgressDto userProgress = UserVotingProgressDto.builder()
                .userId(10L)
                .displayName("Alice")
                .votedCount(2)
                .completed(true)
                .build();

        VotingProgressResponse progressResponse = VotingProgressResponse.builder()
                .sessionId(1L)
                .roomCode("SWIPE1")
                .totalMovies(2)
                .totalUsers(1)
                .completedUserCount(1)
                .allUsersCompleted(true)
                .users(List.of(userProgress))
                .build();

        when(voteService.getVotingProgress(1L)).thenReturn(progressResponse);

        mockMvc.perform(get("/api/sessions/1/votes/progress"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("SWIPE1"))
                .andExpect(jsonPath("$.totalMovies").value(2))
                .andExpect(jsonPath("$.allUsersCompleted").value(true))
                .andExpect(jsonPath("$.users[0].displayName").value("Alice"));
    }
}
