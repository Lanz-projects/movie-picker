package com.moviepicker.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.exception.DuplicateDisplayNameException;
import com.moviepicker.backend.exception.GlobalExceptionHandler;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class SessionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SessionService sessionService;

    @InjectMocks
    private SessionController sessionController;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private SessionResponse sampleResponse;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sessionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        UserResponse hostUser = UserResponse.builder()
                .id(1L)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();

        sampleResponse = SessionResponse.builder()
                .id(100L)
                .roomCode("ROOM99")
                .hostName("Alice")
                .maxUsers(10)
                .maxSuggestionsPerUser(5)
                .status(SessionStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .users(List.of(hostUser))
                .build();
    }

    @Test
    public void testCreateSession_Returns201Created() throws Exception {
        CreateSessionRequest request = CreateSessionRequest.builder()
                .hostName("Alice")
                .maxUsers(10)
                .maxSuggestionsPerUser(5)
                .build();

        when(sessionService.createSession(any(CreateSessionRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"))
                .andExpect(jsonPath("$.hostName").value("Alice"))
                .andExpect(jsonPath("$.users[0].displayName").value("Alice"));
    }

    @Test
    public void testCreateSession_InvalidInput_Returns400BadRequest() throws Exception {
        CreateSessionRequest request = CreateSessionRequest.builder()
                .hostName("") // Blank host name
                .maxUsers(1)  // Below min 2
                .build();

        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.hostName").exists());
    }

    @Test
    public void testGetSessionByRoomCode_Returns200OK() throws Exception {
        when(sessionService.getSessionByRoomCode("ROOM99")).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/sessions/ROOM99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"))
                .andExpect(jsonPath("$.hostName").value("Alice"));
    }

    @Test
    public void testGetSessionByRoomCode_NotFound_Returns404() throws Exception {
        when(sessionService.getSessionByRoomCode("NOTFOUND"))
                .thenThrow(new ResourceNotFoundException("Session not found with room code: NOTFOUND"));

        mockMvc.perform(get("/api/sessions/NOTFOUND"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Session not found with room code: NOTFOUND"));
    }

    @Test
    public void testJoinSession_Returns200OK() throws Exception {
        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM99")
                .displayName("Bob")
                .build();

        when(sessionService.joinSession(any(JoinSessionRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/sessions/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"));
    }

    @Test
    public void testJoinSession_DuplicateName_Returns409Conflict() throws Exception {
        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM99")
                .displayName("Alice")
                .build();

        when(sessionService.joinSession(any(JoinSessionRequest.class)))
                .thenThrow(new DuplicateDisplayNameException("Display name 'Alice' is already taken in this session"));

        mockMvc.perform(post("/api/sessions/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Display name 'Alice' is already taken in this session"));
    }

    @Test
    public void testUpdateSessionStatus_Returns200OK() throws Exception {
        UpdateSessionStatusRequest request = UpdateSessionStatusRequest.builder()
                .status(SessionStatus.VOTING)
                .build();

        sampleResponse.setStatus(SessionStatus.VOTING);
        when(sessionService.updateSessionStatus(eq("ROOM99"), any(UpdateSessionStatusRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/sessions/ROOM99/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VOTING"));
    }

    @Test
    public void testLeaveSession_Returns200OK() throws Exception {
        LeaveSessionRequest request = LeaveSessionRequest.builder().userId(1L).build();

        LeaveSessionResponse leaveResponse = LeaveSessionResponse.builder()
                .sessionId(100L)
                .roomCode("ROOM99")
                .hostName("Bob")
                .status(SessionStatus.WAITING)
                .remainingUserCount(1)
                .message("Host role transferred to 'Bob'")
                .build();

        when(sessionService.leaveSession(eq(100L), any(LeaveSessionRequest.class))).thenReturn(leaveResponse);

        mockMvc.perform(post("/api/sessions/100/leave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hostName").value("Bob"))
                .andExpect(jsonPath("$.remainingUserCount").value(1))
                .andExpect(jsonPath("$.message").value("Host role transferred to 'Bob'"));
    }

    @Test
    public void testLeaveSessionByRoomCode_Returns200OK() throws Exception {
        LeaveSessionRequest request = LeaveSessionRequest.builder().userId(1L).build();

        LeaveSessionResponse leaveResponse = LeaveSessionResponse.builder()
                .sessionId(100L)
                .roomCode("ROOM99")
                .hostName("Alice")
                .status(SessionStatus.WAITING)
                .remainingUserCount(1)
                .message("User 'Bob' left the session.")
                .build();

        when(sessionService.leaveSessionByRoomCode(eq("ROOM99"), any(LeaveSessionRequest.class))).thenReturn(leaveResponse);

        mockMvc.perform(post("/api/sessions/room/ROOM99/leave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"))
                .andExpect(jsonPath("$.message").value("User 'Bob' left the session."));
    }

    @Test
    public void testKickUser_Returns200OK() throws Exception {
        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(1L)
                .targetUserId(2L)
                .build();

        LeaveSessionResponse kickResponse = LeaveSessionResponse.builder()
                .sessionId(100L)
                .roomCode("ROOM99")
                .hostName("Alice")
                .status(SessionStatus.WAITING)
                .remainingUserCount(1)
                .message("User 'Bob' was removed from the session by the host.")
                .build();

        when(sessionService.kickUser(eq("ROOM99"), any(KickUserRequest.class))).thenReturn(kickResponse);

        mockMvc.perform(post("/api/sessions/room/ROOM99/kick")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"))
                .andExpect(jsonPath("$.remainingUserCount").value(1))
                .andExpect(jsonPath("$.message").value("User 'Bob' was removed from the session by the host."));
    }

    @Test
    public void testKickUser_InvalidInput_Returns400BadRequest() throws Exception {
        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(null)
                .targetUserId(null)
                .build();

        mockMvc.perform(post("/api/sessions/room/ROOM99/kick")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    public void testCreateSession_V1Endpoint_Returns201Created() throws Exception {
        CreateSessionRequest request = CreateSessionRequest.builder()
                .hostName("Alice")
                .maxUsers(10)
                .maxSuggestionsPerUser(5)
                .build();

        when(sessionService.createSession(any(CreateSessionRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"))
                .andExpect(jsonPath("$.hostName").value("Alice"));
    }

    @Test
    public void testGetSessionByRoomCode_V1Endpoint_Returns200OK() throws Exception {
        when(sessionService.getSessionByRoomCode("ROOM99")).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/sessions/ROOM99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomCode").value("ROOM99"))
                .andExpect(jsonPath("$.hostName").value("Alice"));
    }
}
