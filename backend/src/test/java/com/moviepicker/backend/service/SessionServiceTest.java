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

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.exception.DuplicateDisplayNameException;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.exception.SessionFullException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;
import com.moviepicker.backend.util.RoomCodeGenerator;

@ExtendWith(MockitoExtension.class)
public class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MovieSuggestionRepository movieSuggestionRepository;

    @Mock
    private RoomCodeGenerator roomCodeGenerator;

    @Mock
    private RoomEventPublisher roomEventPublisher;

    @Mock
    private VoteRepository voteRepository;

    @Mock
    private VoteService voteService;

    @Mock
    private ConsensusService consensusService;

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

    @Test
    public void testUpdateSessionStatus_ToSuggesting_PurgesPreviousRoundVotesAndSuggestions() {
        sampleSession.setStatus(SessionStatus.COMPLETED);
        UpdateSessionStatusRequest request = UpdateSessionStatusRequest.builder()
                .status(SessionStatus.SUGGESTING)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(sampleSession);
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));

        SessionResponse response = sessionService.updateSessionStatus("ROOM12", request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(SessionStatus.SUGGESTING);
        verify(voteRepository).deleteBySessionId(1L);
        verify(movieSuggestionRepository).deleteBySessionId(1L);
    }

    @Test
    public void testUpdateSessionStatus_ToWaiting_PurgesPreviousRoundVotesAndSuggestions() {
        sampleSession.setStatus(SessionStatus.COMPLETED);
        sampleSession.getRoundKickedDisplayNames().add("bob");
        UpdateSessionStatusRequest request = UpdateSessionStatusRequest.builder()
                .status(SessionStatus.WAITING)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(sampleSession);
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));

        SessionResponse response = sessionService.updateSessionStatus("ROOM12", request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(SessionStatus.WAITING);
        assertThat(sampleSession.getRoundKickedDisplayNames()).isEmpty();
        verify(voteRepository).deleteBySessionId(1L);
        verify(movieSuggestionRepository).deleteBySessionId(1L);
    }

    @Test
    public void testLeaveSession_NonHostLeaves() {
        User bobUser = User.builder()
                .id(11L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now())
                .build();

        LeaveSessionRequest request = LeaveSessionRequest.builder().userId(11L).build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(11L)).thenReturn(Optional.of(bobUser));
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of(hostUser));

        LeaveSessionResponse response = sessionService.leaveSession(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getHostName()).isEqualTo("Alice");
        assertThat(response.getRemainingUserCount()).isEqualTo(1);
        assertThat(response.getMessage()).contains("User 'Bob' left the session.");
        verify(userRepository).delete(bobUser);
    }

    @Test
    public void testLeaveSession_HostLeaves_SuccessionTransfersHost() {
        User bobUser = User.builder()
                .id(11L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now().plusSeconds(1))
                .build();

        LeaveSessionRequest request = LeaveSessionRequest.builder().userId(10L).build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser)); // Alice is host
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of(bobUser));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        LeaveSessionResponse response = sessionService.leaveSession(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getHostName()).isEqualTo("Bob");
        assertThat(response.getRemainingUserCount()).isEqualTo(1);
        assertThat(response.getMessage()).contains("Host role transferred to 'Bob'");
        verify(userRepository).delete(hostUser);
        verify(sessionRepository).save(sampleSession);
    }

    @Test
    public void testLeaveSession_LastUserLeaves_SessionMarkedCompleted() {
        LeaveSessionRequest request = LeaveSessionRequest.builder().userId(10L).build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser));
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of()); // No remaining users
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        LeaveSessionResponse response = sessionService.leaveSession(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(SessionStatus.COMPLETED);
        assertThat(response.getRemainingUserCount()).isEqualTo(0);
        assertThat(response.getMessage()).contains("marked completed");
        verify(sessionRepository).save(sampleSession);
    }

    @Test
    public void testLeaveSession_DisassociatesMovieSuggestions() {
        LeaveSessionRequest request = LeaveSessionRequest.builder().userId(10L).build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser));
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of());
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        sessionService.leaveSession(1L, request);

        verify(voteRepository).deleteBySessionIdAndUserId(1L, 10L);
        verify(movieSuggestionRepository).disassociateUserSuggestions(10L);
    }

    @Test
    public void testKickUser_Success_InWaitingStage() {
        User guestUser = User.builder()
                .id(20L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now().plusMinutes(1))
                .build();

        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(10L)
                .targetUserId(20L)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser));
        when(userRepository.findById(20L)).thenReturn(Optional.of(guestUser));
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of(hostUser));

        LeaveSessionResponse response = sessionService.kickUser("ROOM12", request);

        assertThat(response).isNotNull();
        assertThat(response.getRemainingUserCount()).isEqualTo(1);
        assertThat(response.getMessage()).contains("Bob");
        assertThat(response.getMessage()).contains("removed from the session by the host");
        verify(voteRepository).deleteBySessionIdAndUserId(1L, 20L);
        verify(movieSuggestionRepository).disassociateUserSuggestions(20L);
        verify(userRepository).delete(guestUser);
        verify(roomEventPublisher).publishUserKicked("ROOM12", 20L, "Bob", response);
    }

    @Test
    public void testKickUser_Success_InSuggestingStage_DisassociatesSuggestions() {
        sampleSession.setStatus(SessionStatus.SUGGESTING);
        User guestUser = User.builder()
                .id(20L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now().plusMinutes(1))
                .build();

        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(10L)
                .targetUserId(20L)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser));
        when(userRepository.findById(20L)).thenReturn(Optional.of(guestUser));
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of(hostUser));

        LeaveSessionResponse response = sessionService.kickUser("ROOM12", request);

        assertThat(response).isNotNull();
        verify(voteRepository).deleteBySessionIdAndUserId(1L, 20L);
        verify(movieSuggestionRepository).disassociateUserSuggestions(20L);
        verify(userRepository).delete(guestUser);
        verify(roomEventPublisher).publishUserKicked("ROOM12", 20L, "Bob", response);
    }

    @Test
    public void testKickUser_ByNonHost_ThrowsException() {
        User guestUser1 = User.builder()
                .id(20L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now())
                .build();

        User guestUser2 = User.builder()
                .id(30L)
                .session(sampleSession)
                .displayName("Charlie")
                .joinedAt(LocalDateTime.now())
                .build();

        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(20L) // Bob is not host (Alice is)
                .targetUserId(30L)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(20L)).thenReturn(Optional.of(guestUser1));

        assertThatThrownBy(() -> sessionService.kickUser("ROOM12", request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Only the room host can kick members");
    }

    @Test
    public void testKickUser_HostKickingSelf_ThrowsException() {
        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(10L)
                .targetUserId(10L)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser));

        assertThatThrownBy(() -> sessionService.kickUser("ROOM12", request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Host cannot kick themselves");
    }

    @Test
    public void testKickUser_PermanentBan_AddsToBannedList() {
        User guestUser = User.builder()
                .id(20L)
                .session(sampleSession)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now().plusMinutes(1))
                .build();

        KickUserRequest request = KickUserRequest.builder()
                .hostUserId(10L)
                .targetUserId(20L)
                .banPermanently(true)
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(hostUser));
        when(userRepository.findById(20L)).thenReturn(Optional.of(guestUser));
        when(userRepository.findBySessionIdOrderByJoinedAtAsc(1L)).thenReturn(List.of(hostUser));

        LeaveSessionResponse response = sessionService.kickUser("ROOM12", request);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("permanently banned");
        assertThat(sampleSession.getBannedDisplayNames()).contains("bob");
        assertThat(sampleSession.getKickCounts().get("bob")).isEqualTo(1);
        verify(sessionRepository).save(sampleSession);
    }

    @Test
    public void testJoinSession_WhenPermanentlyBanned_ThrowsException() {
        sampleSession.getBannedDisplayNames().add("bob");

        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Bob")
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));

        assertThatThrownBy(() -> sessionService.joinSession(request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("permanently banned");
    }

    @Test
    public void testJoinSession_WhenKickedFromActiveRound_ThrowsException() {
        sampleSession.setStatus(SessionStatus.SUGGESTING);
        sampleSession.getRoundKickedDisplayNames().add("bob");

        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Bob")
                .build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));

        assertThatThrownBy(() -> sessionService.joinSession(request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("removed from this round");
    }

    @Test
    public void testJoinSession_WhenKickedFromRound_CanRejoinWhenWaiting() {
        sampleSession.setStatus(SessionStatus.WAITING);
        sampleSession.getRoundKickedDisplayNames().add("bob");

        JoinSessionRequest request = JoinSessionRequest.builder()
                .roomCode("ROOM12")
                .displayName("Bob")
                .build();

        User bobUser = User.builder().id(20L).displayName("Bob").session(sampleSession).build();

        when(sessionRepository.findByRoomCode("ROOM12")).thenReturn(Optional.of(sampleSession));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(hostUser));
        when(userRepository.save(any(User.class))).thenReturn(bobUser);

        SessionResponse response = sessionService.joinSession(request);

        assertThat(response).isNotNull();
    }
}
