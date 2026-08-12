package com.moviepicker.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.moviepicker.backend.dto.CreateSessionRequest;
import com.moviepicker.backend.dto.JoinSessionRequest;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.UpdateSessionStatusRequest;
import com.moviepicker.backend.exception.DuplicateDisplayNameException;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.exception.SessionFullException;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.util.RoomCodeGenerator;

@ExtendWith(MockitoExtension.class)
public class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomCodeGenerator roomCodeGenerator;

    @InjectMocks
    private SessionServiceImpl sessionService;

    private Session sampleSession;
    private User hostUser;

    @BeforeEach
    public void setUp() {
        sampleSession = Session.builder()
                .id(1L)
                .roomCode("ROOM12")
                .hostName("Alice")
                .maxUsers(3)
                .maxSuggestionsPerUser(5)
                .status(SessionStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .build();

        hostUser = User.builder()
                .id(10L)
                .session(sampleSession)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();
    }

    @Test
    public void testCreateSession_Success() {
        CreateSessionRequest request = CreateSessionRequest.builder()
                .hostName("Alice")
                .maxUsers(5)
                .maxSuggestionsPerUser(3)
                .build();

        when(roomCodeGenerator.generate()).thenReturn("ROOM12");
        when(sessionRepository.existsByRoomCode("ROOM12")).thenReturn(false);
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> {
            Session s = invocation.getArgument(0);
            s.setId(1L);
            return s;
        });
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));

        SessionResponse response = sessionService.createSession(request);

        assertThat(response).isNotNull();
        assertThat(response.getRoomCode()).isEqualTo("ROOM12");
        assertThat(response.getHostName()).isEqualTo("Alice");
        assertThat(response.getUsers()).hasSize(1);
        assertThat(response.getUsers().get(0).getDisplayName()).isEqualTo("Alice");

        verify(sessionRepository, times(1)).save(any(Session.class));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testGetSessionByRoomCode_Success() {
        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));

        SessionResponse response = sessionService.getSessionByRoomCode("ROOM12");

        assertThat(response).isNotNull();
        assertThat(response.getRoomCode()).isEqualTo("ROOM12");
        assertThat(response.getUsers()).hasSize(1);
    }

    @Test
    public void testGetSessionByRoomCode_NotFound() {
        when(sessionRepository.findByRoomCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getSessionByRoomCode("UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Session not found with room code: UNKNOWN");
    }

    @Test
    public void testJoinSession_Success() {
        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Bob")
                .build();

        User bobUser = User.builder()
                .id(11L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now())
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findBySessionId(1L))
                .thenReturn(List.of(hostUser))
                .thenReturn(List.of(hostUser, bobUser));
        when(userRepository.save(any(User.class))).thenReturn(bobUser);

        SessionResponse response = sessionService.joinSession(request);

        assertThat(response).isNotNull();
        assertThat(response.getUsers()).hasSize(2);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testJoinSession_SessionFull() {
        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Dave")
                .build();

        User user2 = User.builder().id(11L).displayName("Bob").build();
        User user3 = User.builder().id(12L).displayName("Charlie").build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        // sampleSession maxUsers is 3. Returning 3 existing users.
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser, user2, user3));

        assertThatThrownBy(() -> sessionService.joinSession(request))
                .isInstanceOf(SessionFullException.class)
                .hasMessageContaining("Session is full");
    }

    @Test
    public void testJoinSession_InvalidState() {
        sampleSession.setStatus(SessionStatus.VOTING);

        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Bob")
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));

        assertThatThrownBy(() -> sessionService.joinSession(request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Cannot join session in VOTING state");
    }

    @Test
    public void testJoinSession_DuplicateDisplayName() {
        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Alice") // Same as host
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));

        assertThatThrownBy(() -> sessionService.joinSession(request))
                .isInstanceOf(DuplicateDisplayNameException.class)
                .hasMessageContaining("Display name 'Alice' is already taken in this session");
    }

    @Test
    public void testUpdateSessionStatus_Success() {
        UpdateSessionStatusRequest request = UpdateSessionStatusRequest.builder()
                .status(SessionStatus.VOTING)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(sampleSession);
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));

        SessionResponse response = sessionService.updateSessionStatus("ROOM12", request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(SessionStatus.VOTING);
        verify(sessionRepository, times(1)).save(sampleSession);
    }
}
